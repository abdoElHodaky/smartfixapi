import { PaginationDto } from '../common';

/**
 * User search filters DTO
 */
export interface UserFiltersDto extends PaginationDto {
  role?: 'user' | 'provider';
  isActive?: boolean;
  isEmailVerified?: boolean;
  search?: string;
}

/**
 * User profile response DTO
 */
export interface UserProfileResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    profileImage?: string;
    isActive: boolean;
    isEmailVerified: boolean;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    location?: {
      type: string;
      coordinates: [number, number];
    };
    createdAt: Date;
    updatedAt: Date;
  };
}

