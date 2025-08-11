import { IsString } from 'class-validator';
import { IsStrongPassword } from '../../utils/validation.utils';

/**
 * Reset password DTO
 */
export class ResetPasswordDto {
  @IsString({ message: 'Token must be a string' })
  token: string;

  @IsString({ message: 'New password must be a string' })
  @IsStrongPassword({ message: 'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' })
  newPassword: string;
}
