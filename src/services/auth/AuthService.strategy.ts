/**
 * Strategy-Based AuthService Implementation
 * 
 * Enhanced AuthService using Strategy Patterns for authentication operations
 * with optimized security, validation, and performance.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { NotFoundError, ValidationError, AuthenticationError } from '../../middleware/errorHandler';
import { IAuthService } from '../../interfaces/services';
import {
  UserRegistrationDto,
  ServiceProviderRegistrationDto,
  LoginDto,
  LoginResponseDto,
  UserRegistrationResponseDto,
  ServiceProviderRegistrationResponseDto,
  TokenVerificationDto,
  ApiResponseDto
} from '../../dtos';

// Import optimization utilities
import { AggregationBuilder, AggregationUtils } from '../../utils/aggregation/AggregationBuilder';
import { 
  StrategyRegistry, 
  AsyncStrategyRegistry, 
  Strategy, 
  AsyncStrategy 
} from '../../utils/conditions/StrategyPatterns';
import { ConditionalHelpers, RoleCheckOptions } from '../../utils/conditions/ConditionalHelpers';
import { CommandBase, CommandResult, CommandContext } from '../../utils/service-optimization/CommandBase';

// Import service decorators
import {
  Singleton,
  Service,
  Cached,
  Retryable,
  Log,
  Validate,
  PostConstruct,
  PreDestroy
} from '../../decorators/service';

// Strategy interfaces
interface AuthOperationInput {
  userId?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
  newPassword?: string;
  token?: string;
  userData?: any;
  providerData?: any;
  metadata?: Record<string, any>;
}

interface TokenOperationInput {
  userId?: string;
  email?: string;
  role?: string;
  token?: string;
  expiresIn?: string;
}

interface PasswordOperationInput {
  password: string;
  hashedPassword?: string;
  saltRounds?: number;
}

interface RegistrationInput {
  userData: UserRegistrationDto;
  providerData?: ServiceProviderRegistrationDto;
  role: 'user' | 'provider';
}

// Password strategies
class HashPasswordStrategy implements AsyncStrategy<PasswordOperationInput, CommandResult> {
  async execute(input: PasswordOperationInput): Promise<CommandResult> {
    try {
      const saltRounds = input.saltRounds || 12;
      const hashedPassword = await bcrypt.hash(input.password, saltRounds);
      
      return CommandResult.success(
        { hashedPassword },
        'Password hashed successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to hash password', [error.message]);
    }
  }
}

class ComparePasswordStrategy implements AsyncStrategy<PasswordOperationInput, CommandResult> {
  async execute(input: PasswordOperationInput): Promise<CommandResult> {
    try {
      if (!input.hashedPassword) {
        return CommandResult.failure('Hashed password is required for comparison');
      }

      const isMatch = await bcrypt.compare(input.password, input.hashedPassword);
      
      return CommandResult.success(
        { isMatch },
        isMatch ? 'Password matches' : 'Password does not match'
      );
    } catch (error) {
      return CommandResult.failure('Failed to compare password', [error.message]);
    }
  }
}

class ChangePasswordStrategy implements AsyncStrategy<AuthOperationInput, CommandResult> {
  constructor(private hashPasswordStrategy: HashPasswordStrategy, private comparePasswordStrategy: ComparePasswordStrategy) {}

  async execute(input: AuthOperationInput): Promise<CommandResult> {
    try {
      // Get user
      const user = await User.findById(input.userId);
      if (!user) {
        return CommandResult.failure('User not found');
      }

      // Verify current password
      const compareResult = await this.comparePasswordStrategy.execute({
        password: input.currentPassword!,
        hashedPassword: user.password
      });

      if (!compareResult.success || !compareResult.data.isMatch) {
        return CommandResult.failure('Current password is incorrect');
      }

      // Hash new password
      const hashResult = await this.hashPasswordStrategy.execute({
        password: input.newPassword!
      });

      if (!hashResult.success) {
        return CommandResult.failure('Failed to hash new password');
      }

      // Update user password
      await User.findByIdAndUpdate(input.userId, {
        password: hashResult.data.hashedPassword,
        passwordChangedAt: new Date(),
        updatedAt: new Date()
      });

      return CommandResult.success(
        { userId: input.userId },
        'Password changed successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to change password', [error.message]);
    }
  }
}

// Token strategies
class GenerateTokenStrategy implements Strategy<TokenOperationInput, CommandResult> {
  execute(input: TokenOperationInput): CommandResult {
    try {
      const payload = {
        userId: input.userId,
        email: input.email,
        role: input.role,
        iat: Math.floor(Date.now() / 1000)
      };

      const secret = process.env.JWT_SECRET || 'default-secret';
      const expiresIn = input.expiresIn || '24h';

      const token = jwt.sign(payload, secret, { expiresIn });

      return CommandResult.success(
        { token, expiresIn },
        'Token generated successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to generate token', [error.message]);
    }
  }
}

class VerifyTokenStrategy implements Strategy<TokenOperationInput, CommandResult> {
  execute(input: TokenOperationInput): CommandResult {
    try {
      if (!input.token) {
        return CommandResult.failure('Token is required');
      }

      const secret = process.env.JWT_SECRET || 'default-secret';
      const decoded = jwt.verify(input.token, secret) as any;

      return CommandResult.success(
        {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          iat: decoded.iat,
          exp: decoded.exp,
          isValid: true
        },
        'Token verified successfully'
      );
    } catch (error) {
      return CommandResult.failure('Invalid or expired token', [error.message]);
    }
  }
}

class RefreshTokenStrategy implements Strategy<TokenOperationInput, CommandResult> {
  constructor(private verifyTokenStrategy: VerifyTokenStrategy, private generateTokenStrategy: GenerateTokenStrategy) {}

  execute(input: TokenOperationInput): CommandResult {
    try {
      // Verify current token
      const verifyResult = this.verifyTokenStrategy.execute({ token: input.token });
      
      if (!verifyResult.success) {
        return CommandResult.failure('Invalid token for refresh');
      }

      // Generate new token
      const generateResult = this.generateTokenStrategy.execute({
        userId: verifyResult.data.userId,
        email: verifyResult.data.email,
        role: verifyResult.data.role,
        expiresIn: input.expiresIn
      });

      return generateResult;
    } catch (error) {
      return CommandResult.failure('Failed to refresh token', [error.message]);
    }
  }
}

// Registration strategies
class RegisterUserStrategy implements AsyncStrategy<RegistrationInput, CommandResult> {
  constructor(private hashPasswordStrategy: HashPasswordStrategy) {}

  async execute(input: RegistrationInput): Promise<CommandResult> {
    try {
      const { userData } = input;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { email: userData.email },
          { phone: userData.phone }
        ]
      });

      if (existingUser) {
        return CommandResult.failure('User with this email or phone already exists');
      }

      // Hash password
      const hashResult = await this.hashPasswordStrategy.execute({
        password: userData.password
      });

      if (!hashResult.success) {
        return CommandResult.failure('Failed to hash password');
      }

      // Create user
      const user = new User({
        ...userData,
        password: hashResult.data.hashedPassword,
        role: input.role,
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return CommandResult.success(
        { user: userResponse },
        'User registered successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to register user', [error.message]);
    }
  }
}

class RegisterProviderStrategy implements AsyncStrategy<RegistrationInput, CommandResult> {
  constructor(private registerUserStrategy: RegisterUserStrategy) {}

  async execute(input: RegistrationInput): Promise<CommandResult> {
    try {
      // First register as user
      const userResult = await this.registerUserStrategy.execute({
        ...input,
        role: 'provider'
      });

      if (!userResult.success) {
        return userResult;
      }

      const user = userResult.data.user;

      // Create provider profile
      const provider = new ServiceProvider({
        userId: user._id,
        ...input.providerData,
        isVerified: false,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await provider.save();

      return CommandResult.success(
        { 
          user,
          provider: provider.toObject()
        },
        'Service provider registered successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to register service provider', [error.message]);
    }
  }
}

// Login strategy
class LoginStrategy implements AsyncStrategy<AuthOperationInput, CommandResult> {
  constructor(
    private comparePasswordStrategy: ComparePasswordStrategy,
    private generateTokenStrategy: GenerateTokenStrategy
  ) {}

  async execute(input: AuthOperationInput): Promise<CommandResult> {
    try {
      const { email, password } = input;

      // Find user by email
      const user = await User.findOne({ 
        email,
        isDeleted: { $ne: true }
      });

      if (!user) {
        return CommandResult.failure('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        return CommandResult.failure('Account is deactivated');
      }

      // Compare password
      const compareResult = await this.comparePasswordStrategy.execute({
        password: password!,
        hashedPassword: user.password
      });

      if (!compareResult.success || !compareResult.data.isMatch) {
        return CommandResult.failure('Invalid email or password');
      }

      // Generate token
      const tokenResult = this.generateTokenStrategy.execute({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

      if (!tokenResult.success) {
        return CommandResult.failure('Failed to generate authentication token');
      }

      // Update last login
      await User.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date()
      });

      // Prepare user data (without password)
      const userData = user.toObject();
      delete userData.password;

      return CommandResult.success(
        {
          user: userData,
          token: tokenResult.data.token,
          expiresIn: tokenResult.data.expiresIn
        },
        'Login successful'
      );
    } catch (error) {
      return CommandResult.failure('Login failed', [error.message]);
    }
  }
}

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 9
})
export class AuthServiceStrategy implements IAuthService {
  private passwordRegistry: AsyncStrategyRegistry<PasswordOperationInput, CommandResult>;
  private tokenRegistry: StrategyRegistry<TokenOperationInput, CommandResult>;
  private authOperationRegistry: AsyncStrategyRegistry<AuthOperationInput, CommandResult>;
  private registrationRegistry: AsyncStrategyRegistry<RegistrationInput, CommandResult>;

  // Strategy instances
  private hashPasswordStrategy: HashPasswordStrategy;
  private comparePasswordStrategy: ComparePasswordStrategy;
  private generateTokenStrategy: GenerateTokenStrategy;
  private verifyTokenStrategy: VerifyTokenStrategy;
  private refreshTokenStrategy: RefreshTokenStrategy;

  constructor() {
    this.initializeStrategies();
  }

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('🔐 Strategy-based AuthService initialized with optimized patterns');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('🔐 Strategy-based AuthService cleanup completed');
  }

  /**
   * Initialize all strategy registries
   */
  private initializeStrategies(): void {
    // Initialize strategy instances
    this.hashPasswordStrategy = new HashPasswordStrategy();
    this.comparePasswordStrategy = new ComparePasswordStrategy();
    this.generateTokenStrategy = new GenerateTokenStrategy();
    this.verifyTokenStrategy = new VerifyTokenStrategy();
    this.refreshTokenStrategy = new RefreshTokenStrategy(this.verifyTokenStrategy, this.generateTokenStrategy);

    // Password strategies
    this.passwordRegistry = new AsyncStrategyRegistry<PasswordOperationInput, CommandResult>();
    this.passwordRegistry.register('hash', this.hashPasswordStrategy);
    this.passwordRegistry.register('compare', this.comparePasswordStrategy);

    // Token strategies
    this.tokenRegistry = new StrategyRegistry<TokenOperationInput, CommandResult>();
    this.tokenRegistry.register('generate', this.generateTokenStrategy);
    this.tokenRegistry.register('verify', this.verifyTokenStrategy);
    this.tokenRegistry.register('refresh', this.refreshTokenStrategy);

    // Auth operation strategies
    this.authOperationRegistry = new AsyncStrategyRegistry<AuthOperationInput, CommandResult>();
    this.authOperationRegistry.register('login', new LoginStrategy(this.comparePasswordStrategy, this.generateTokenStrategy));
    this.authOperationRegistry.register('changePassword', new ChangePasswordStrategy(this.hashPasswordStrategy, this.comparePasswordStrategy));

    // Registration strategies
    this.registrationRegistry = new AsyncStrategyRegistry<RegistrationInput, CommandResult>();
    this.registrationRegistry.register('user', new RegisterUserStrategy(this.hashPasswordStrategy));
    this.registrationRegistry.register('provider', new RegisterProviderStrategy(new RegisterUserStrategy(this.hashPasswordStrategy)));
  }

  /**
   * Generate JWT token with strategy pattern
   */
  @Log({
    message: 'Generating JWT token with strategy pattern',
    includeExecutionTime: true
  })
  generateToken(userId: string, email: string, role: string): string {
    const result = this.tokenRegistry.execute('generate', { userId, email, role });
    
    if (!result.success) {
      throw new ValidationError(result.message);
    }

    return result.data.token;
  }

  /**
   * Verify JWT token with strategy pattern
   */
  @Log({
    message: 'Verifying JWT token with strategy pattern',
    includeExecutionTime: true
  })
  verifyToken(token: string): TokenVerificationDto {
    const result = this.tokenRegistry.execute('verify', { token });
    
    if (!result.success) {
      throw new AuthenticationError(result.message);
    }

    return result.data;
  }

  /**
   * Hash password with strategy pattern
   */
  @Log({
    message: 'Hashing password with strategy pattern',
    includeExecutionTime: true
  })
  async hashPassword(password: string): Promise<string> {
    const result = await this.passwordRegistry.execute('hash', { password });
    
    if (!result.success) {
      throw new ValidationError(result.message);
    }

    return result.data.hashedPassword;
  }

  /**
   * Compare password with strategy pattern
   */
  @Log({
    message: 'Comparing password with strategy pattern',
    includeExecutionTime: true
  })
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    const result = await this.passwordRegistry.execute('compare', { password, hashedPassword });
    
    if (!result.success) {
      throw new ValidationError(result.message);
    }

    return result.data.isMatch;
  }

  /**
   * Register user with strategy pattern
   */
  @Log({
    message: 'Registering user with strategy pattern',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  })
  async register(userData: UserRegistrationDto): Promise<UserRegistrationResponseDto> {
    const result = await this.registrationRegistry.execute('user', { userData, role: 'user' });
    
    if (!result.success) {
      throw new ValidationError(result.message);
    }

    // Generate token for new user
    const token = this.generateToken(
      result.data.user._id.toString(),
      result.data.user.email,
      result.data.user.role
    );

    return {
      success: true,
      message: result.message,
      data: {
        user: result.data.user,
        token
      }
    };
  }

  /**
   * Register service provider with strategy pattern
   */
  @Log({
    message: 'Registering service provider with strategy pattern',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  })
  async registerProvider(
    userData: UserRegistrationDto,
    providerData: ServiceProviderRegistrationDto
  ): Promise<ServiceProviderRegistrationResponseDto> {
    const result = await this.registrationRegistry.execute('provider', { 
      userData, 
      providerData, 
      role: 'provider' 
    });
    
    if (!result.success) {
      throw new ValidationError(result.message);
    }

    // Generate token for new provider
    const token = this.generateToken(
      result.data.user._id.toString(),
      result.data.user.email,
      result.data.user.role
    );

    return {
      success: true,
      message: result.message,
      data: {
        user: result.data.user,
        provider: result.data.provider,
        token
      }
    };
  }

  /**
   * Login with strategy pattern
   */
  @Log({
    message: 'User login with strategy pattern',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'linear'
  })
  async login(credentials: LoginDto): Promise<LoginResponseDto> {
    const result = await this.authOperationRegistry.execute('login', {
      email: credentials.email,
      password: credentials.password
    });
    
    if (!result.success) {
      throw new AuthenticationError(result.message);
    }

    return {
      success: true,
      message: result.message,
      data: result.data
    };
  }

  /**
   * Change password with strategy pattern
   */
  @Log({
    message: 'Changing password with strategy pattern',
    includeExecutionTime: true
  })
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponseDto> {
    const result = await this.authOperationRegistry.execute('changePassword', {
      userId,
      currentPassword,
      newPassword
    });
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  /**
   * Reset password with strategy pattern
   */
  @Log({
    message: 'Resetting password with strategy pattern',
    includeExecutionTime: true
  })
  async resetPassword(email: string, newPassword: string): Promise<ApiResponseDto> {
    try {
      // Find user by email
      const user = await User.findOne({ email, isDeleted: { $ne: true } });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      await User.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Password reset successfully',
        data: { userId: user._id }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reset password',
        errors: [error.message]
      };
    }
  }

  /**
   * Refresh token with strategy pattern
   */
  @Log({
    message: 'Refreshing token with strategy pattern',
    includeExecutionTime: true
  })
  async refreshToken(token: string): Promise<ApiResponseDto> {
    const result = this.tokenRegistry.execute('refresh', { token });
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  /**
   * Verify email
   */
  @Log({
    message: 'Verifying email',
    includeExecutionTime: true
  })
  async verifyEmail(userId: string): Promise<ApiResponseDto> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).select('-password');

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return {
        success: true,
        message: 'Email verified successfully',
        data: { user }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to verify email',
        errors: [error.message]
      };
    }
  }

  /**
   * Get user profile with optimized aggregation
   */
  @Log({
    message: 'Getting user profile with aggregation',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getUserProfile(userId: string): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .match({ _id: userId, isDeleted: { $ne: true } })
      .lookup('serviceProviders', '_id', 'userId', 'providerProfile')
      .lookup('reviews', '_id', 'userId', 'reviews')
      .lookup('serviceRequests', '_id', 'userId', 'serviceRequests')
      .addFields({
        isProvider: { $gt: [{ $size: '$providerProfile' }, 0] },
        averageRating: { $avg: '$reviews.rating' },
        totalReviews: { $size: '$reviews' },
        totalServiceRequests: { $size: '$serviceRequests' }
      })
      .project({
        password: 0,
        email: 1,
        name: 1,
        phone: 1,
        location: 1,
        isActive: 1,
        role: 1,
        profileImage: 1,
        isProvider: 1,
        providerProfile: { $arrayElemAt: ['$providerProfile', 0] },
        averageRating: 1,
        totalReviews: 1,
        totalServiceRequests: 1,
        createdAt: 1,
        updatedAt: 1
      });

    const users = await aggregation.execute(User);
    const user = users[0];

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Deactivate user account
   */
  @Log({
    message: 'Deactivating user account',
    includeExecutionTime: true
  })
  async deactivateAccount(userId: string): Promise<ApiResponseDto> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          isActive: false,
          deactivatedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).select('-password');

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return {
        success: true,
        message: 'Account deactivated successfully',
        data: { user }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to deactivate account',
        errors: [error.message]
      };
    }
  }
}

