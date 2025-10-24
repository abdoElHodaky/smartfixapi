import { PartialAddressDto } from '../../common/dtos/address.dto';
import { LocationDto } from '../../common/dtos/location.dto';

/**
 * Update user DTO
 */
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
  address?: PartialAddressDto;
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

