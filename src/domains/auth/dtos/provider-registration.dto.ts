import { ServiceAreaDto } from '../../common/dtos/location.dto';

/**
 * Service provider registration DTO
 */
export interface ServiceProviderRegistrationDto {
  businessName: string;
  description: string;
  services: string[];
  serviceArea: ServiceAreaDto;
  pricing?: {
    hourlyRate?: number;
    fixedPrices?: Array<{
      service: string;
      price: number;
    }>;
  };
  availability?: {
    [key: string]: {
      available: boolean;
      startTime?: string;
      endTime?: string;
    };
  };
}

/**
 * Service provider registration response DTO
 */
export interface ServiceProviderRegistrationResponseDto {
  success: boolean;
  message: string;
  data: {
    provider: {
      id: string;
      businessName: string;
      description: string;
      services: string[];
      isVerified: boolean;
      rating: number;
    };
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    };
    token: string;
  };
}
