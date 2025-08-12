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
import { BaseController } from '../BaseController';
import { AuthRequest } from '../../types';
import { IAuthService } from '../../interfaces/services';

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
} from '../../dtos';

// Decorator imports
import { 
  Controller, 
  Post, 
  Get, 
  RequireAuth, 
  Validate 
} from '../../decorators';

// Middleware imports
import { validateBody } from '../../middleware';

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
  register = [
    validateBody(UserRegistrationDto),
    this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
      this.logRequest(req, 'User Registration');

      try {
        const result = await this.authService.register(req.body as UserRegistrationDto);
        this.sendSuccess<UserRegistrationResponseDto>(res, result, 'User registered successfully', 201);
      } catch (error: any) {
        this.sendError(res, error.message || 'Registration failed', 400);
      }
    })
  ];

  /**
   * Register a new service provider
   */
  @Post('/register-provider')
  registerProvider = [
    validateBody(ProviderUserRegistrationDto),
    this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
      this.logRequest(req, 'Provider Registration');

      const { userData, providerData } = req.body;

      try {
        const result = await this.authService.registerProvider(
          userData as UserRegistrationDto, 
          providerData as ServiceProviderRegistrationDto
        );
        this.sendSuccess<ServiceProviderRegistrationResponseDto>(res, result, 'Provider registered successfully', 201);
      } catch (error: any) {
        this.sendError(res, error.message || 'Provider registration failed', 400);
      }
    })
  ];

  /**
   * Login user
   */
  @Post('/login')
  login = [
    validateBody(LoginDto),
    this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
      this.logRequest(req, 'User Login');

      try {
        const result = await this.authService.login(req.body as LoginDto);
        this.sendSuccess<LoginResponseDto>(res, result, 'Login successful');
      } catch (error: any) {
        this.sendError(res, error.message || 'Login failed', 401);
      }
    })
  ];

  /**
   * Get current user profile
   */
  @Get('/profile')
  @RequireAuth()
  getProfile = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Profile');

    if (!this.requireAuth(req, res)) {
      return;
    }

    try {
      const result = await this.authService.getProfile(req.user!.id);
      this.sendSuccess(res, result, 'Profile retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get profile', 400);
    }
  });

  /**
   * Refresh authentication token
   */
  @Post('/refresh-token')
  @RequireAuth()
  refreshToken = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Refresh Token');

    if (!this.requireAuth(req, res)) {
      return;
    }

    try {
      const result = await this.authService.refreshToken(req.user!.id);
      this.sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Token refresh failed', 401);
    }
  });

  /**
   * Logout user
   */
  @Post('/logout')
  @RequireAuth()
  logout = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'User Logout');

    if (!this.requireAuth(req, res)) {
      return;
    }

    try {
      await this.authService.logout(req.user!.id);
      this.sendSuccess(res, null, 'Logout successful');
    } catch (error: any) {
      this.sendError(res, error.message || 'Logout failed', 400);
    }
  });

  /**
   * Request password reset
   */
  @Post('/forgot-password')
  forgotPassword = [
    validateBody(ForgotPasswordDto),
    this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
      this.logRequest(req, 'Forgot Password');

      try {
        await this.authService.forgotPassword(req.body.email);
        this.sendSuccess(res, null, 'Password reset email sent');
      } catch (error: any) {
        this.sendError(res, error.message || 'Failed to send reset email', 400);
      }
    })
  ];

  /**
   * Reset password with token
   */
  @Post('/reset-password')
  resetPassword = [
    validateBody(ResetPasswordDto),
    this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
      this.logRequest(req, 'Reset Password');

      try {
        await this.authService.resetPassword(req.body.token, req.body.newPassword);
        this.sendSuccess(res, null, 'Password reset successful');
      } catch (error: any) {
        this.sendError(res, error.message || 'Password reset failed', 400);
      }
    })
  ];

  /**
   * Verify email address
   */
  @Post('/verify-email')
  verifyEmail = [
    validateBody(VerifyEmailDto),
    this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
      this.logRequest(req, 'Verify Email');

      try {
        await this.authService.verifyEmail(req.body.token);
        this.sendSuccess(res, null, 'Email verified successfully');
      } catch (error: any) {
        this.sendError(res, error.message || 'Email verification failed', 400);
      }
    })
  ];

  /**
   * Resend email verification
   */
  @Post('/resend-verification')
  @RequireAuth()
  resendVerification = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Resend Verification');

    if (!this.requireAuth(req, res)) {
      return;
    }

    try {
      await this.authService.resendVerificationEmail(req.user!.id);
      this.sendSuccess(res, null, 'Verification email sent');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to send verification email', 400);
    }
  });
}
