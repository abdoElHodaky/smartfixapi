import { PaginationDto } from '../../common/dtos/pagination.dto';

/**
 * Provider search filters DTO
 */
export interface ProviderFiltersDto extends PaginationDto {
  services?: string[];
  location?: [number, number];
  radius?: number;
  minRating?: number;
  isVerified?: boolean;
  isAvailable?: boolean;
  sort?: 'rating' | 'completedJobs' | 'newest';
}

/**
 * Provider profile response DTO
 */
export interface ProviderProfileResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    businessName: string;
    description: string;
    services: string[];
    serviceArea: {
      type: string;
      coordinates: [number, number];
      radius: number;
    };
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
    isVerified: boolean;
    rating: number;
    completedJobs: number;
    responseTime: number;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      profileImage?: string;
    };
    createdAt: Date;
    updatedAt: Date;
  };
}

