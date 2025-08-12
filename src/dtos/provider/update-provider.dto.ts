import { ServiceAreaDto } from '../common';

/**
 * Update provider DTO
 */
export interface UpdateProviderDto {
  businessName?: string;
  description?: string;
  services?: string[];
  serviceArea?: ServiceAreaDto;
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
  isAvailable?: boolean;
}

/**
 * Update provider response DTO
 */
export interface UpdateProviderResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
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
    isAvailable: boolean;
    rating: number;
    completedJobs: number;
    updatedAt: Date;
  };
}

