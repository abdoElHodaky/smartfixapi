/**
 * Modern AuthController
 * 
 * Updated implementation using the new BaseController pattern with:
 * - Modern dependency injection
 * - Standardized response formatting
 * - Built-in validation and error handling
 * - Decorator-based routing
 */

import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { AuthRequest } from '../../types';
import { IAuthService } from '../../interfaces/services';
import { 
  UserRegistrationDto, 
  ServiceProviderRegistrationDto, 
  LoginDto,
  LoginResponseDto,
  UserRegistrationResponseDto,
  ServiceProviderRegistrationResponseDto
} from '../../dtos';
import { 
  Controller, 
  Post, 
  Get, 
  RequireAuth, 
  Validate 
} from '../../decorators/controller';

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
  @Validate({
    firstName: { required: true, minLength: 2, maxLength: 50 },
    lastName: { required: true, minLength: 2, maxLength: 50 },
    email: { required: true, email: true },
    password: { required: true, minLength: 6 },
    phone: { required: true }
  })
  register = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logRequest(req, 'User Registration');

    // Validate request data
    const validation = this.validateRequest(req.body, {
      firstName: { required: true, minLength: 2, maxLength: 50 },
      lastName: { required: true, minLength: 2, maxLength: 50 },
      email: { required: true, email: true },
      password: { required: true, minLength: 6 },
      phone: { required: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      const result = await this.authService.register(req.body as UserRegistrationDto);
      this.sendSuccess<UserRegistrationResponseDto>(res, result, 'User registered successfully', 201);
    } catch (error: any) {
      this.sendError(res, error.message || 'Registration failed', 400);
    }
  });

  /**
   * Register a new service provider
   */
  @Post('/register-provider')
  @Validate({
    userData: { required: true },
    providerData: { required: true }
  })
  registerProvider = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logRequest(req, 'Provider Registration');

    const { userData, providerData } = req.body;

    // Validate user data
    const userValidation = this.validateRequest(userData, {
      firstName: { required: true, minLength: 2, maxLength: 50 },
      lastName: { required: true, minLength: 2, maxLength: 50 },
      email: { required: true, email: true },
      password: { required: true, minLength: 6 },
      phone: { required: true }
    });

    if (!userValidation.isValid) {
      this.sendError(res, 'User data validation failed', 400, userValidation.errors);
      return;
    }

    // Validate provider data
    const providerValidation = this.validateRequest(providerData, {
      businessName: { required: true, minLength: 2, maxLength: 100 },
      serviceType: { required: true },
      description: { required: true, minLength: 10 }
    });

    if (!providerValidation.isValid) {
      this.sendError(res, 'Provider data validation failed', 400, providerValidation.errors);
      return;
    }

    try {
      const result = await this.authService.registerProvider(
        userData as UserRegistrationDto, 
        providerData as ServiceProviderRegistrationDto
      );
      this.sendSuccess<ServiceProviderRegistrationResponseDto>(res, result, 'Provider registered successfully', 201);
    } catch (error: any) {
      this.sendError(res, error.message || 'Provider registration failed', 400);
    }
  });

  /**
   * Login user
   */
  @Post('/login')
  @Validate({
    email: { required: true, email: true },
    password: { required: true }
  })
  login = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logRequest(req, 'User Login');

    // Validate request data
    const validation = this.validateRequest(req.body, {
      email: { required: true, email: true },
      password: { required: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      const result = await this.authService.login(req.body as LoginDto);
      this.sendSuccess<LoginResponseDto>(res, result, 'Login successful');
    } catch (error: any) {
      this.sendError(res, error.message || 'Login failed', 401);
    }
  });

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
  @Validate({
    email: { required: true, email: true }
  })
  forgotPassword = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logRequest(req, 'Forgot Password');

    const validation = this.validateRequest(req.body, {
      email: { required: true, email: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      await this.authService.forgotPassword(req.body.email);
      this.sendSuccess(res, null, 'Password reset email sent');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to send reset email', 400);
    }
  });

  /**
   * Reset password with token
   */
  @Post('/reset-password')
  @Validate({
    token: { required: true },
    newPassword: { required: true, minLength: 6 }
  })
  resetPassword = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logRequest(req, 'Reset Password');

    const validation = this.validateRequest(req.body, {
      token: { required: true },
      newPassword: { required: true, minLength: 6 }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      await this.authService.resetPassword(req.body.token, req.body.newPassword);
      this.sendSuccess(res, null, 'Password reset successful');
    } catch (error: any) {
      this.sendError(res, error.message || 'Password reset failed', 400);
    }
  });

  /**
   * Verify email address
   */
  @Post('/verify-email')
  @Validate({
    token: { required: true }
  })
  verifyEmail = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logRequest(req, 'Verify Email');

    const validation = this.validateRequest(req.body, {
      token: { required: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      await this.authService.verifyEmail(req.body.token);
      this.sendSuccess(res, null, 'Email verified successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Email verification failed', 400);
    }
  });

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

