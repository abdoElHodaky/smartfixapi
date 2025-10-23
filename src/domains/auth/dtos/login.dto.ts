/**
 * Login credentials DTO
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Login response DTO
 */
export interface LoginResponseDto {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      isEmailVerified: boolean;
      profileImage?: string;
    };
    token: string;
  };
}

/**
 * Token verification response DTO
 */
export interface TokenVerificationDto {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

