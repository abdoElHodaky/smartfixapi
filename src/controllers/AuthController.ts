import { Request, Response } from 'express';
import { AuthService } from '../services/auth/AuthService';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  /**
   * Register a new user
   */
  static register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.register(req.body);
    
    res.status(201).json(result);
  });

  /**
   * Register a new service provider
   */
  static registerProvider = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userData, providerData } = req.body;
    
    const result = await AuthService.registerProvider(userData, providerData);
    
    res.status(201).json(result);
  });

  /**
   * Login user
   */
  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.login(req.body);
    
    res.status(200).json(result);
  });

  /**
   * Get current user profile
   */
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const profile = await AuthService.getUserProfile(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profile
    });
  });

  /**
   * Update user profile
   */
  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // This would be implemented in UserController, but for now:
    res.status(200).json({
      success: true,
      message: 'Profile update endpoint - to be implemented in UserController'
    });
  });

  /**
   * Change password
   */
  static changePassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    
    const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.status(200).json(result);
  });

  /**
   * Reset password
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, newPassword } = req.body;
    
    const result = await AuthService.resetPassword(email, newPassword);
    
    res.status(200).json(result);
  });

  /**
   * Refresh JWT token
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token is required'
      });
      return;
    }

    const result = await AuthService.refreshToken(token);
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  });

  /**
   * Verify email
   */
  static verifyEmail = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await AuthService.verifyEmail(req.user.id);
    
    res.status(200).json(result);
  });

  /**
   * Deactivate account
   */
  static deactivateAccount = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await AuthService.deactivateAccount(req.user.id);
    
    res.status(200).json(result);
  });

  /**
   * Logout (client-side token removal, but we can track it server-side if needed)
   */
  static logout = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    // In a more sophisticated implementation, we might maintain a blacklist of tokens
    // For now, we just return success as the client will remove the token
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * Verify token endpoint
   */
  static verifyToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token is required'
      });
      return;
    }

    const result = await AuthService.verifyToken(token);
    
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: result
    });
  });
}
