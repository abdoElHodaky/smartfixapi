import { AddressDto } from '../../common/dtos/address.dto';
import { LocationDto } from '../../common/dtos/location.dto';

/**
 * User registration DTO
 */
export interface UserRegistrationDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role?: 'user' | 'provider';
  address?: AddressDto;
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
