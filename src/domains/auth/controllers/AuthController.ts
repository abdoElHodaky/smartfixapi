/**
 * Modern AuthController
 * 
 * Updated implementation using the new BaseController pattern with:
 * - Modern dependency injection
 * - Standardized response formatting
 * - Built-in validation and error handling
 * - Decorator-based routing
 */

// External imports
import { Request, Response } from 'express';

// Internal imports
import { BaseController } from '../../common/BaseController';
import { AuthRequest } from '../../common/types';
import { IAuthService } from '../../common/interfaces/services';

// DTO imports
import { 
  UserRegistrationDto, 
  ServiceProviderRegistrationDto, 
  LoginDto,
  LoginResponseDto,
  UserRegistrationResponseDto,
  ServiceProviderRegistrationResponseDto,
  ProviderUserRegistrationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto
} from '../dtos';

// Decorator imports
import { 
  Controller, 
  Post, 
  Get, 
  RequireAuth, 
  UseMiddleware,
  Validate 
} from '../../decorators';

// Middleware imports
import { validateBody } from '../../common/middleware';

// Utility imports
import { ConditionalHelpers } from '../../../utils/conditions/ConditionalHelpers';

@Controller({ path: '/auth' })
export class AuthController extends BaseController {
  private authService: IAuthService;

  constructor() {
    super();
    this.authService = this.serviceRegistry.getAuthService();
  }

  /**
   * Register a new user
   */
  @Post('/register')
  @UseMiddleware(validateBody(UserRegistrationDto))
  async register(req: Request, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'User Registration');

      const result = await this.authService.register(req.body as UserRegistrationDto);
      this.sendSuccess<UserRegistrationResponseDto>(res, result, 'User registered successfully', 201);
    } catch (error: any) {
      this.sendError(res, error.message || 'Registration failed', 400);
    }
  }

  /**
   * Register a new service provider
   */
  @Post('/register-provider')
  @UseMiddleware(validateBody(ProviderUserRegistrationDto))
  async registerProvider(req: Request, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Provider Registration');

      const { userData, providerData } = req.body;

      const result = await this.authService.registerProvider(
        userData as UserRegistrationDto, 
        providerData as ServiceProviderRegistrationDto
      );
      this.sendSuccess<ServiceProviderRegistrationResponseDto>(res, result, 'Provider registered successfully', 201);
    } catch (error: any) {
      this.sendError(res, error.message || 'Provider registration failed', 400);
    }
  }

  /**
   * Login user
   */
  @Post('/login')
  @UseMiddleware(validateBody(LoginDto))
  async login(req: Request, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'User Login');

      const result = await this.authService.login(req.body as LoginDto);
      this.sendSuccess<LoginResponseDto>(res, result, 'Login successful');
    } catch (error: any) {
      this.sendError(res, error.message || 'Login failed', 401);
    }
  }

  /**
   * Get current user profile
   */
  @Get('/profile')
  @RequireAuth()
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get Profile');

      // Use ConditionalHelpers for guard clause
      const authError = ConditionalHelpers.guardAuthenticated(req.user);
      if (authError) {
        this.sendError(res, authError, 401);
        return;
      }

      const result = await this.authService.getProfile(req.user!.id);
      this.sendSuccess(res, result, 'Profile retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get profile', 400);
    }
  }

  /**
   * Refresh authentication token
   */
  @Post('/refresh-token')
  @RequireAuth()
  async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Refresh Token');

      // Use ConditionalHelpers for guard clause
      const authError = ConditionalHelpers.guardAuthenticated(req.user);
      if (authError) {
        this.sendError(res, authError, 401);
        return;
      }

      const result = await this.authService.refreshToken(req.user!.id);
      this.sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Token refresh failed', 401);
    }
  }

  /**
   * Logout user
   */
  @Post('/logout')
  @RequireAuth()
  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'User Logout');

      // Use ConditionalHelpers for guard clause
      const authError = ConditionalHelpers.guardAuthenticated(req.user);
      if (authError) {
        this.sendError(res, authError, 401);
        return;
      }

      await this.authService.logout(req.user!.id);
      this.sendSuccess(res, null, 'Logout successful');
    } catch (error: any) {
      this.sendError(res, error.message || 'Logout failed', 400);
    }
  }

  /**
   * Request password reset
   */
  @Post('/forgot-password')
  @UseMiddleware(validateBody(ForgotPasswordDto))
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Forgot Password');

      await this.authService.forgotPassword(req.body.email);
      this.sendSuccess(res, null, 'Password reset email sent');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to send reset email', 400);
    }
  }

  /**
   * Reset password with token
   */
  @Post('/reset-password')
  @UseMiddleware(validateBody(ResetPasswordDto))
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Reset Password');

      await this.authService.resetPassword(req.body.token, req.body.newPassword);
      this.sendSuccess(res, null, 'Password reset successful');
    } catch (error: any) {
      this.sendError(res, error.message || 'Password reset failed', 400);
    }
  }

  /**
   * Verify email address
   */
  @Post('/verify-email')
  @UseMiddleware(validateBody(VerifyEmailDto))
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Verify Email');

      await this.authService.verifyEmail(req.body.token);
      this.sendSuccess(res, null, 'Email verified successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Email verification failed', 400);
    }
  }

  /**
   * Resend email verification
   */
  @Post('/resend-verification')
  @RequireAuth()
  async resendVerification(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Resend Verification');

      // Use ConditionalHelpers for guard clause
      const authError = ConditionalHelpers.guardAuthenticated(req.user);
      if (authError) {
        this.sendError(res, authError, 401);
        return;
      }

      await this.authService.resendVerificationEmail(req.user!.id);
      this.sendSuccess(res, null, 'Verification email sent');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to send verification email', 400);
    }
  }
}
