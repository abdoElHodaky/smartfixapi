import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ServiceProvider } from '../models/ServiceProvider';
import { ValidationError, AuthenticationError } from '../middleware/errorHandler';

export interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role?: 'user' | 'provider';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface ServiceProviderRegistrationData {
  businessName: string;
  description: string;
  services: string[];
  serviceArea: {
    type: 'Point';
    coordinates: [number, number];
    radius: number;
  };
  pricing?: {
    hourlyRate?: number;
    fixedPrices?: Array<{
      service: string;
      price: number;
    }>;
  };
  availability?: {
    [key: string]: {
      available: boolean;
      startTime?: string;
      endTime?: string;
    };
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  /**
   * Generate JWT token
   */
  static generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { id: userId, email, role },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password
   */
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Register a new user
   */
  static async registerUser(userData: UserRegistrationData): Promise<any> {
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
   * Register a new service provider
   */
  static async registerServiceProvider(
    userData: UserRegistrationData,
    providerData: ServiceProviderRegistrationData
  ): Promise<any> {
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
      const serviceProvider = new ServiceProvider({
        userId: user._id,
        businessName: providerData.businessName,
        description: providerData.description,
        services: providerData.services,
        serviceArea: providerData.serviceArea,
        pricing: providerData.pricing || {},
        availability: providerData.availability || {
          monday: { available: true, startTime: '09:00', endTime: '17:00' },
          tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
          wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
          thursday: { available: true, startTime: '09:00', endTime: '17:00' },
          friday: { available: true, startTime: '09:00', endTime: '17:00' },
          saturday: { available: false },
          sunday: { available: false }
        }
      });

      await serviceProvider.save();

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
          provider: serviceProvider,
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
   * Login user
   */
  static async loginUser(credentials: LoginCredentials): Promise<any> {
    try {
      // Find user by email
      const user = await User.findOne({ email: credentials.email }).select('+password');
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Compare password
      const isPasswordValid = await this.comparePassword(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Update last login
      user.lastLoginDate = new Date();
      await user.save();

      // Generate token
      const token = this.generateToken(String(user._id), user.email, user.role);

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      // Get provider profile if user is a provider
      let providerProfile = null;
      if (user.role === 'provider') {
        providerProfile = await ServiceProvider.findOne({ userId: user._id });
      }

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          provider: providerProfile,
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
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<any> {
    try {
      // Find user
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new AuthenticationError('User not found');
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
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new ValidationError('Password change failed');
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string, newPassword: string): Promise<any> {
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        throw new ValidationError('User with this email does not exist');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      user.password = hashedPassword;
      await user.save();

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Password reset failed');
    }
  }

  /**
   * Refresh JWT token
   */
  static async refreshToken(token: string): Promise<any> {
    try {
      // Verify the token (even if expired)
      const decoded = jwt.verify(token, this.JWT_SECRET, { ignoreExpiration: true }) as any;

      // Find user to ensure they still exist and are active
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      // Generate new token
      const newToken = this.generateToken(String(user._id), user.email, user.role);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          expiresIn: this.JWT_EXPIRES_IN
        }
      };
    } catch (error) {
      throw new AuthenticationError('Token refresh failed');
    }
  }

  /**
   * Verify email (placeholder for email verification logic)
   */
  static async verifyEmail(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      user.isEmailVerified = true;
      await user.save();

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      throw new ValidationError('Email verification failed');
    }
  }

  /**
   * Deactivate user account
   */
  static async deactivateAccount(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      user.isActive = false;
      await user.save();

      return {
        success: true,
        message: 'Account deactivated successfully'
      };
    } catch (error) {
      throw new ValidationError('Account deactivation failed');
    }
  }
}

