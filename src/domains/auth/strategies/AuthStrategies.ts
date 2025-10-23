/**
 * Auth Service Strategy Implementations
 * 
 * Strategy classes for authentication operations extracted from AuthService
 */

import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Strategy, AsyncStrategy } from '../../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../../utils/service-optimization/CommandBase';
import { User } from '../../../models/User';
import { ServiceProvider } from '../../../models/ServiceProvider';
// TODO: Define these interfaces in common/interfaces
// import { AuthOperationInput, TokenOperationInput, PasswordOperationInput, RegistrationInput } from '../interfaces/ServiceStrategy';

// Temporary type definitions to reduce errors
type AuthOperationInput = any;
type TokenOperationInput = any;
type PasswordOperationInput = any;
type RegistrationInput = any;

// Password strategies
export class HashPasswordStrategy implements AsyncStrategy<PasswordOperationInput, CommandResult> {
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

export class ComparePasswordStrategy implements AsyncStrategy<PasswordOperationInput, CommandResult> {
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

export class ChangePasswordStrategy implements AsyncStrategy<AuthOperationInput, CommandResult> {
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
export class GenerateTokenStrategy implements Strategy<TokenOperationInput, CommandResult> {
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

export class VerifyTokenStrategy implements Strategy<TokenOperationInput, CommandResult> {
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

export class RefreshTokenStrategy implements Strategy<TokenOperationInput, CommandResult> {
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
export class RegisterUserStrategy implements AsyncStrategy<RegistrationInput, CommandResult> {
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

export class RegisterProviderStrategy implements AsyncStrategy<RegistrationInput, CommandResult> {
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
export class LoginStrategy implements AsyncStrategy<AuthOperationInput, CommandResult> {
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

// Email verification strategy
export class VerifyEmailStrategy implements AsyncStrategy<AuthOperationInput, CommandResult> {
  async execute(input: AuthOperationInput): Promise<CommandResult> {
    try {
      const user = await User.findByIdAndUpdate(
        input.userId,
        { 
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).select('-password');

      if (!user) {
        return CommandResult.failure('User not found');
      }

      return CommandResult.success(
        { user },
        'Email verified successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to verify email', [error.message]);
    }
  }
}

// Account deactivation strategy
export class DeactivateAccountStrategy implements AsyncStrategy<AuthOperationInput, CommandResult> {
  async execute(input: AuthOperationInput): Promise<CommandResult> {
    try {
      const user = await User.findByIdAndUpdate(
        input.userId,
        { 
          isActive: false,
          deactivatedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).select('-password');

      if (!user) {
        return CommandResult.failure('User not found');
      }

      return CommandResult.success(
        { user },
        'Account deactivated successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to deactivate account', [error.message]);
    }
  }
}

// Password reset strategy
export class ResetPasswordStrategy implements AsyncStrategy<AuthOperationInput, CommandResult> {
  constructor(private hashPasswordStrategy: HashPasswordStrategy) {}

  async execute(input: AuthOperationInput): Promise<CommandResult> {
    try {
      // Find user by email
      const user = await User.findOne({ 
        email: input.email, 
        isDeleted: { $ne: true } 
      });
      
      if (!user) {
        return CommandResult.failure('User not found');
      }

      // Hash new password
      const hashResult = await this.hashPasswordStrategy.execute({
        password: input.newPassword!
      });

      if (!hashResult.success) {
        return CommandResult.failure('Failed to hash new password');
      }

      // Update password
      await User.findByIdAndUpdate(user._id, {
        password: hashResult.data.hashedPassword,
        passwordChangedAt: new Date(),
        updatedAt: new Date()
      });

      return CommandResult.success(
        { userId: user._id },
        'Password reset successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to reset password', [error.message]);
    }
  }
}
