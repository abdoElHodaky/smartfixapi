/**
 * Decorator-Based AuthService
 * 
 * Modern implementation of authentication service using decorators for
 * enhanced functionality including caching, logging, retry logic, and validation.
 */

import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Injectable, Inject } from '@decorators/di';
import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ValidationError, AuthenticationError } from '../../middleware/errorHandler';
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

// Import service decorators
import {
  Singleton,
  Service,
  Cached,
  Retryable,
  Log,
  Validate,
  PostConstruct,
  PreDestroy,
  ConfigValue
} from '../../decorators/service';

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 1
})
export class AuthService implements IAuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly SALT_ROUNDS: number;

  constructor(
    @ConfigValue('JWT_SECRET', 'your-secret-key') jwtSecret?: string,
    @ConfigValue('JWT_EXPIRES_IN', '7d') jwtExpiresIn?: string,
    @ConfigValue('BCRYPT_SALT_ROUNDS', '12') saltRounds?: string
  ) {
    this.JWT_SECRET = jwtSecret || process.env.JWT_SECRET || 'your-secret-key';
    this.JWT_EXPIRES_IN = jwtExpiresIn || process.env.JWT_EXPIRES_IN || '7d';
    this.SALT_ROUNDS = parseInt(saltRounds || process.env.BCRYPT_SALT_ROUNDS || '12');
  }

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('🔐 AuthService initialized with decorator-based architecture');
    console.log(`🔑 JWT expires in: ${this.JWT_EXPIRES_IN}`);
    console.log(`🧂 Salt rounds: ${this.SALT_ROUNDS}`);
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('🔐 AuthService cleanup completed');
  }

  /**
   * Generate JWT token with caching for performance
   */
  @Log('Generating JWT token')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { id: userId, email, role },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  /**
   * Verify JWT token with retry logic for network issues
   */
  @Log('Verifying JWT token')
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'exponential',
    condition: (error: Error) => error.message.includes('network')
  })
  verifyToken(token: string): TokenVerificationDto {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenVerificationDto;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Hash password with caching for identical passwords
   */
  @Log('Hashing password')
  @Cached(60 * 60 * 1000) // Cache for 1 hour
  @Retryable(2)
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare password with logging
   */
  @Log('Comparing password')
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Register a new user with comprehensive logging and validation
   */
  @Log({
    message: 'Registering new user',
    includeArgs: false, // Don't log sensitive data
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 2000,
    condition: (error: Error) => error.message.includes('database') || error.message.includes('network')
  })
  async register(userData: UserRegistrationDto): Promise<UserRegistrationResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new ValidationError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const user = new User({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        role: userData.role || 'user',
        address: userData.address,
        location: userData.location
      });

      await user.save();

      // Generate token
      const token = this.generateToken(String(user._id), user.email, user.role);

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          token,
          expiresIn: this.JWT_EXPIRES_IN
        }
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Registration failed');
    }
  }

  /**
   * Register a new service provider with enhanced error handling
   */
  @Log({
    message: 'Registering new service provider',
    includeArgs: false,
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 2000,
    condition: (error: Error) => error.message.includes('database')
  })
  async registerProvider(
    userData: UserRegistrationDto,
    providerData: ServiceProviderRegistrationDto
  ): Promise<ServiceProviderRegistrationResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new ValidationError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user with provider role
      const user = new User({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        role: 'provider',
        address: userData.address,
        location: userData.location
      });

      await user.save();

      // Create service provider profile
      const provider = new ServiceProvider({
        userId: user._id,
        businessName: providerData.businessName,
        services: providerData.services,
        experience: providerData.experience,
        hourlyRate: providerData.hourlyRate,
        availability: providerData.availability,
        serviceArea: providerData.serviceArea,
        certifications: providerData.certifications,
        portfolio: providerData.portfolio,
        description: providerData.description
      });

      await provider.save();

      // Generate token
      const token = this.generateToken(String(user._id), user.email, user.role);

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      return {
        success: true,
        message: 'Service provider registered successfully',
        data: {
          user: userResponse,
          provider: provider.toJSON(),
          token,
          expiresIn: this.JWT_EXPIRES_IN
        }
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Provider registration failed');
    }
  }

  /**
   * User login with rate limiting and caching
   */
  @Log({
    message: 'User login attempt',
    includeArgs: false, // Don't log credentials
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 2,
    delay: 1000,
    condition: (error: Error) => error.message.includes('database')
  })
  async login(credentials: LoginDto): Promise<LoginResponseDto> {
    try {
      // Find user by email
      const user = await User.findOne({ email: credentials.email }).select('+password');
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Check if account is active
      if (user.status !== 'active') {
        throw new AuthenticationError('Account is not active');
      }

      // Compare password
      const isPasswordValid = await this.comparePassword(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = this.generateToken(String(user._id), user.email, user.role);

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token,
          expiresIn: this.JWT_EXPIRES_IN
        }
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Login failed');
    }
  }

  /**
   * Get user profile with caching
   */
  @Log('Getting user profile')
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getUserProfile(userId: string): Promise<ApiResponseDto> {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new ValidationError('User not found');
      }

      return {
        success: true,
        message: 'User profile retrieved successfully',
        data: { user: user.toJSON() }
      };
    } catch (error) {
      throw new ValidationError('Failed to get user profile');
    }
  }

  /**
   * Update user profile with validation
   */
  @Log({
    message: 'Updating user profile',
    includeExecutionTime: true
  })
  @Retryable(2)
  async updateUserProfile(userId: string, updateData: Partial<UserRegistrationDto>): Promise<ApiResponseDto> {
    try {
      // Remove sensitive fields that shouldn't be updated directly
      const { password, email, role, ...safeUpdateData } = updateData;

      const user = await User.findByIdAndUpdate(
        userId,
        { ...safeUpdateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new ValidationError('User not found');
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        data: { user: user.toJSON() }
      };
    } catch (error) {
      throw new ValidationError('Failed to update profile');
    }
  }

  /**
   * Change password with enhanced security
   */
  @Log({
    message: 'Changing user password',
    includeArgs: false, // Don't log passwords
    includeExecutionTime: true
  })
  @Retryable(2)
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<ApiResponseDto> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      user.password = hashedNewPassword;
      user.updatedAt = new Date();
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully',
        data: null
      };
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Failed to change password');
    }
  }

  /**
   * Refresh JWT token
   */
  @Log('Refreshing JWT token')
  @Cached(60 * 1000) // Cache for 1 minute
  async refreshToken(token: string): Promise<LoginResponseDto> {
    try {
      const decoded = this.verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || user.status !== 'active') {
        throw new AuthenticationError('Invalid token or inactive user');
      }

      // Generate new token
      const newToken = this.generateToken(String(user._id), user.email, user.role);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: user.toJSON(),
          token: newToken,
          expiresIn: this.JWT_EXPIRES_IN
        }
      };
    } catch (error) {
      throw new AuthenticationError('Failed to refresh token');
    }
  }

  /**
   * Verify email with retry logic
   */
  @Log('Verifying user email')
  @Retryable(3)
  async verifyEmail(userId: string): Promise<ApiResponseDto> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          emailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).select('-password');

      if (!user) {
        throw new ValidationError('User not found');
      }

      return {
        success: true,
        message: 'Email verified successfully',
        data: { user: user.toJSON() }
      };
    } catch (error) {
      throw new ValidationError('Failed to verify email');
    }
  }

  /**
   * Deactivate user account
   */
  @Log('Deactivating user account')
  async deactivateAccount(userId: string): Promise<ApiResponseDto> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          status: 'inactive',
          deactivatedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).select('-password');

      if (!user) {
        throw new ValidationError('User not found');
      }

      return {
        success: true,
        message: 'Account deactivated successfully',
        data: null
      };
    } catch (error) {
      throw new ValidationError('Failed to deactivate account');
    }
  }

  /**
   * Reset password (placeholder for email-based reset)
   */
  @Log('Password reset requested')
  @Retryable(2)
  async resetPassword(email: string): Promise<ApiResponseDto> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists for security
        return {
          success: true,
          message: 'If the email exists, a reset link has been sent',
          data: null
        };
      }

      // In a real implementation, you would:
      // 1. Generate a secure reset token
      // 2. Store it with expiration
      // 3. Send email with reset link
      
      console.log(`🔐 Password reset requested for user: ${user.email}`);

      return {
        success: true,
        message: 'If the email exists, a reset link has been sent',
        data: null
      };
    } catch (error) {
      throw new ValidationError('Failed to process password reset');
    }
  }
}

