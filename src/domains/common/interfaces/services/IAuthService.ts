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

/**
 * Authentication service interface
 */
export interface IAuthService {
  /**
   * Generate JWT token
   */
  generateToken(userId: string, email: string, role: string): string;

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenVerificationDto;

  /**
   * Hash password
   */
  hashPassword(password: string): Promise<string>;

  /**
   * Compare password
   */
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;

  /**
   * Register a new user
   */
  register(userData: UserRegistrationDto): Promise<UserRegistrationResponseDto>;

  /**
   * Register a new service provider
   */
  registerProvider(
    userData: UserRegistrationDto,
    providerData: ServiceProviderRegistrationDto
  ): Promise<ServiceProviderRegistrationResponseDto>;

  /**
   * Login user
   */
  login(credentials: LoginDto): Promise<LoginResponseDto>;

  /**
   * Change user password
   */
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponseDto>;

  /**
   * Reset password
   */
  resetPassword(email: string, newPassword: string): Promise<ApiResponseDto>;

  /**
   * Refresh JWT token
   */
  refreshToken(token: string): Promise<ApiResponseDto>;

  /**
   * Verify email
   */
  verifyEmail(userId: string): Promise<ApiResponseDto>;

  /**
   * Get user profile
   */
  getUserProfile(userId: string): Promise<any>;

  /**
   * Deactivate user account
   */
  deactivateAccount(userId: string): Promise<ApiResponseDto>;
}

