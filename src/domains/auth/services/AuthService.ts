/**
 * Strategy-Based AuthService Implementation
 * 
 * Enhanced AuthService using Strategy Patterns for authentication operations
 * with optimized security, validation, and performance.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { User } from '../../../models/User';
import { NotFoundError, ValidationError, AuthenticationError } from '../../common/middleware/errorHandler';
import { IAuthService } from '../../common/interfaces/services/IAuthService';
import {
  UserRegistrationDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ProviderRegistrationDto,
  ProviderUserRegistrationDto
} from '../dtos';

// Import optimization utilities
import { AggregationBuilder, AggregationUtils } from '../../../utils/aggregation/AggregationBuilder';
import { 
  StrategyRegistry, 
  AsyncStrategyRegistry, 
  Strategy, 
  AsyncStrategy 
} from '../../../utils/conditions/StrategyPatterns';
import { ConditionalHelpers, RoleCheckOptions } from '../../../utils/conditions/ConditionalHelpers';
import { CommandBase, CommandResult, CommandContext } from '../../../utils/service-optimization/CommandBase';

// Import strategy implementations
import {
  HashPasswordStrategy,
  ComparePasswordStrategy,
  ChangePasswordStrategy,
  GenerateTokenStrategy,
  VerifyTokenStrategy,
  RefreshTokenStrategy,
  RegisterUserStrategy,
  RegisterProviderStrategy,
  LoginStrategy
} from '../strategies/AuthStrategies';

// Import strategy interfaces
// TODO: Define these interfaces in common/interfaces
// import {
//   AuthOperationInput,
//   TokenOperationInput,
//   PasswordOperationInput,
//   RegistrationInput
// } from '../../strategy/interfaces/ServiceStrategy';

// Temporary type definitions to reduce errors
type AuthOperationInput = any;
type TokenOperationInput = any;
type PasswordOperationInput = any;
type RegistrationInput = any;

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
} from '../../../decorators/service';



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
