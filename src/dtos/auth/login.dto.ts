import { IsString, IsEmail, Length } from 'class-validator';

/**
 * Login credentials DTO
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @Length(1, 100, { message: 'Password is required' })
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
