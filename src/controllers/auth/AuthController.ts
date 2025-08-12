import { Request, Response } from 'express';
import { serviceRegistry } from '../../container';
import { AuthRequest } from '../../types';
import { asyncHandler } from '../../middleware/errorHandler';
import { IAuthService } from '../../interfaces/services';

export class AuthController {
  private authService: IAuthService;

  constructor() {
    this.authService = serviceRegistry.getService<IAuthService>('AuthService');
  }
  /**
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.register(req.body);
    
    res.status(201).json(result);
  });

  /**
   * Register a new service provider
   */
  registerProvider = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userData, providerData } = req.body;
    
    const result = await this.authService.registerProvider(userData, providerData);
    
    res.status(201).json(result);
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body);
    
    res.status(200).json(result);
  });

  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const profile = await this.authService.getUserProfile(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profile
    });
  });

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
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
  changePassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    
    const result = await this.authService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.status(200).json(result);
  });

  /**
   * Reset password
   */
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, newPassword } = req.body;
    
    const result = await this.authService.resetPassword(email, newPassword);
    
    res.status(200).json(result);
  });

  /**
   * Refresh JWT token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token is required'
      });
      return;
    }

    const result = await this.authService.refreshToken(token);
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  });

  /**
   * Verify email
   */
  verifyEmail = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await this.authService.verifyEmail(req.user.id);
    
    res.status(200).json(result);
  });

  /**
   * Deactivate account
   */
  deactivateAccount = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await this.authService.deactivateAccount(req.user.id);
    
    res.status(200).json(result);
  });

  /**
   * Logout (client-side token removal, but we can track it server-side if needed)
   */
  logout = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
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
  verifyToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token is required'
      });
      return;
    }

    const result = await this.authService.verifyToken(token);
    
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: result
    });
  });
}
