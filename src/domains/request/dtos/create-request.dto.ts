import { LocationDto } from '../../common/dtos/location.dto';
import { AddressDto } from '../../common/dtos/address.dto';

/**
 * Create service request DTO
 */
export interface CreateRequestDto {
  title: string;
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high';
  budget?: {
    min: number;
    max: number;
  };
  location: LocationDto;
  address: AddressDto;
  preferredDate?: Date;
  images?: string[];
}

/**
 * Create request response DTO
 */
export interface CreateRequestResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    description: string;
    category: string;
    urgency: string;
    status: string;
    budget?: {
      min: number;
      max: number;
    };
    location: LocationDto;
    address: AddressDto;
    preferredDate?: Date;
    images?: string[];
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    createdAt: Date;
  };
}

