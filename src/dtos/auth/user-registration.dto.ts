import { IsString, IsEmail, IsOptional, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto, LocationDto } from '../common';
import { IsPhoneNumber, IsStrongPassword, IsUserRole } from '../../utils/validation.utils';

/**
 * User registration DTO
 */
export class UserRegistrationDto {
  @IsString({ message: 'First name must be a string' })
  @Length(2, 50, { message: 'First name must be between 2 and 50 characters' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @Length(2, 50, { message: 'Last name must be between 2 and 50 characters' })
  lastName: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsStrongPassword({ message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' })
  password: string;

  @IsString({ message: 'Phone must be a string' })
  @IsPhoneNumber({ message: 'Phone must be a valid phone number' })
  phone: string;

  @IsOptional()
  @IsUserRole({ message: 'Role must be either user or provider' })
  role?: 'user' | 'provider';

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

/**
 * User registration response DTO
 */
export interface UserRegistrationResponseDto {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      role: string;
      isEmailVerified: boolean;
    };
    token: string;
  };
}
