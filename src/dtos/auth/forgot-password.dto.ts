import { IsEmail } from 'class-validator';

/**
 * Forgot password DTO
 */
export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;
}
