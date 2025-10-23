import { IsString } from 'class-validator';

/**
 * Verify email DTO
 */
export class VerifyEmailDto {
  @IsString({ message: 'Token must be a string' })
  token: string;
}
