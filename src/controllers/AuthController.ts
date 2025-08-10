import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { UserRegistrationDto, ServiceProviderRegistrationDto, LoginDto } from '../dtos';

/**
 * Authentication Controller using Dependency Injection
 */
export class AuthController extends BaseController {
  /**
   * Register a new user
   */
  register = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userData: UserRegistrationDto = req.body;
    
    const result = await this.authService.register(userData);
    this.sendSuccess(res, result, 'User registered successfully', 201);
  });

  /**
   * Register a new service provider
   */
  registerProvider = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userData, providerData } = req.body;
    
    const userDto: UserRegistrationDto = userData;
    const providerDto: ServiceProviderRegistrationDto = providerData;
    
    const result = await this.authService.registerProvider(userDto, providerDto);
    this.sendSuccess(res, result, 'Service provider registered successfully', 201);
  });

  /**
   * Login user
   */
  login = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const credentials: LoginDto = req.body;
    
    const result = await this.authService.login(credentials);
    this.sendSuccess(res, result, 'Login successful');
  });

  /**
   * Change password
   */
  changePassword = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.getUserId(req);
    const { currentPassword, newPassword } = req.body;
    
    const result = await this.authService.changePassword(userId, currentPassword, newPassword);
    this.sendSuccess(res, result, 'Password changed successfully');
  });

  /**
   * Reset password
   */
  resetPassword = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, newPassword } = req.body;
    
    const result = await this.authService.resetPassword(email, newPassword);
    this.sendSuccess(res, result, 'Password reset successfully');
  });

  /**
   * Refresh token
   */
  refreshToken = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;
    
    const result = await this.authService.refreshToken(token);
    this.sendSuccess(res, result, 'Token refreshed successfully');
  });

  /**
   * Verify email
   */
  verifyEmail = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.getUserId(req);
    
    const result = await this.authService.verifyEmail(userId);
    this.sendSuccess(res, result, 'Email verified successfully');
  });

  /**
   * Get user profile
   */
  getProfile = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.getUserId(req);
    
    const profile = await this.authService.getUserProfile(userId);
    this.sendSuccess(res, profile, 'Profile retrieved successfully');
  });

  /**
   * Deactivate account
   */
  deactivateAccount = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.getUserId(req);
    
    const result = await this.authService.deactivateAccount(userId);
    this.sendSuccess(res, result, 'Account deactivated successfully');
  });
}

// Export singleton instance
export const authController = new AuthController();

