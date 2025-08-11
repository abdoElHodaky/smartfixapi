import { IsString, IsOptional, ValidateNested, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialAddressDto, LocationDto } from '../common';
import { IsPhoneNumber, IsUrl } from '../../utils/validation.utils';

/**
 * Update user DTO
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @Length(2, 50, { message: 'First name must be between 2 and 50 characters' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @Length(2, 50, { message: 'Last name must be between 2 and 50 characters' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @IsPhoneNumber({ message: 'Phone must be a valid phone number' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Profile image must be a string' })
  @IsUrl({ message: 'Profile image must be a valid URL' })
  profileImage?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartialAddressDto)
  address?: PartialAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

/**
 * Update user response DTO
 */
export interface UpdateUserResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImage?: string;
    address?: PartialAddressDto;
    location?: LocationDto;
    updatedAt: Date;
  };
}
