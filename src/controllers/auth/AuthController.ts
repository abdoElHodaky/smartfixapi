import 'reflect-metadata';
import { Response } from 'express';
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Req, 
  Res,
  Status
} from '@decorators/express';
import { Injectable } from '@decorators/di';
import { serviceContainer } from '../../container';
import { AuthRequest } from '../../types';
import { IAuthService } from '../../interfaces/services';
import { Auth, ValidateUserRegistration, ValidateUserLogin, RateLimit, AsyncHandler } from '../../decorators/middleware';

/**
 * Authentication Controller using optimized services
 * Handles user registration, login, profile management, and token operations
 */
@Injectable()
@Controller('/api/auth')
export class AuthController {
  private authService: IAuthService;

  constructor() {
    this.authService = serviceContainer.getAuthService();
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  @ValidateUserRegistration()
  @RateLimit(15 * 60 * 1000, 5) // 5 requests per 15 minutes
  @Post('/register')
  @Status(201)
  @AsyncHandler()
  async register(@Body() body: any, @Res() res: Response): Promise<void> {
    try {
      const result = await this.authService.register(body);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  }

  /**
   * Register a new service provider
   * POST /api/auth/register-provider
   */
  @Post('/register-provider')
  @Status(201)
  async registerProvider(@Body() body: any, @Res() res: Response): Promise<void> {
    try {
      const { userData, providerData } = body;
      const result = await this.authService.registerProvider(userData, providerData);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Provider registration failed'
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  @ValidateUserLogin()
  @RateLimit(15 * 60 * 1000, 10) // 10 requests per 15 minutes
  @Post('/login')
  @Status(200)
  @AsyncHandler()
  async login(@Body() body: any, @Res() res: Response): Promise<void> {
    try {
      const result = await this.authService.login(body);
      res.json(result);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  @Auth()
  @Get('/profile')
  @Status(200)
  @AsyncHandler()
  async getProfile(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const profile = await this.authService.getUserProfile(req.user.id);
      
      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve profile'
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  @Put('/profile')
  @Status(200)
  async updateProfile(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // This would be implemented in UserController, but for now:
      res.json({
        success: true,
        message: 'Profile update endpoint - to be implemented in UserController'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update profile'
      });
    }
  }

  /**
   * Change password
   * PUT /api/auth/change-password
   */
  @Put('/change-password')
  @Status(200)
  async changePassword(@Req() req: AuthRequest, @Body() body: any, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { currentPassword, newPassword } = body;
      const result = await this.authService.changePassword(req.user.id, currentPassword, newPassword);
      
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to change password'
      });
    }
  }

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  @Post('/reset-password')
  @Status(200)
  async resetPassword(@Body() body: any, @Res() res: Response): Promise<void> {
    try {
      const { email, newPassword } = body;
      const result = await this.authService.resetPassword(email, newPassword);
      
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reset password'
      });
    }
  }

  /**
   * Refresh JWT token
   * POST /api/auth/refresh-token
   */
  @Post('/refresh-token')
  @Status(200)
  async refreshToken(@Body() body: any, @Res() res: Response): Promise<void> {
    try {
      const { token } = body;
      
      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required'
        });
        return;
      }

      const result = await this.authService.refreshToken(token);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to refresh token'
      });
    }
  }

  /**
   * Verify email
   * POST /api/auth/verify-email
   */
  @Post('/verify-email')
  @Status(200)
  async verifyEmail(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.authService.verifyEmail(req.user.id);
      
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify email'
      });
    }
  }

  /**
   * Deactivate account
   * POST /api/auth/deactivate
   */
  @Post('/deactivate')
  @Status(200)
  async deactivateAccount(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.authService.deactivateAccount(req.user.id);
      
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to deactivate account'
      });
    }
  }

  /**
   * Logout (client-side token removal, but we can track it server-side if needed)
   * POST /api/auth/logout
   */
  @Post('/logout')
  @Status(200)
  async logout(@Res() res: Response): Promise<void> {
    // In a more sophisticated implementation, we might maintain a blacklist of tokens
    // For now, we just return success as the client will remove the token
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  /**
   * Verify token endpoint
   * POST /api/auth/verify-token
   */
  @Post('/verify-token')
  @Status(200)
  async verifyToken(@Body() body: any, @Res() res: Response): Promise<void> {
    try {
      const { token } = body;
      
      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required'
        });
        return;
      }

      const result = await this.authService.verifyToken(token);
      
      res.json({
        success: true,
        message: 'Token is valid',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Invalid token'
      });
    }
  }
}
