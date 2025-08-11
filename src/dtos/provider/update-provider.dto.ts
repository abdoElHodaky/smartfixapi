import { IsString, IsOptional, ValidateNested, IsArray, IsBoolean, IsNumber, Length, Min, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceAreaDto } from '../common';
import { IsServiceType } from '../../utils/validation.utils';

/**
 * Fixed price DTO for provider pricing
 */
export class FixedPriceDto {
  @IsString({ message: 'Service must be a string' })
  @IsServiceType({ message: 'Service must be a valid service type' })
  service: string;

  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be at least 0' })
  price: number;
}

/**
 * Pricing DTO for provider
 */
export class PricingDto {
  @IsOptional()
  @IsNumber({}, { message: 'Hourly rate must be a number' })
  @Min(0, { message: 'Hourly rate must be at least 0' })
  hourlyRate?: number;

  @IsOptional()
  @IsArray({ message: 'Fixed prices must be an array' })
  @ValidateNested({ each: true })
  @Type(() => FixedPriceDto)
  @ArrayMaxSize(20, { message: 'Maximum 20 fixed prices allowed' })
  fixedPrices?: FixedPriceDto[];
}

/**
 * Availability slot DTO
 */
export class AvailabilitySlotDto {
  @IsBoolean({ message: 'Available must be a boolean' })
  available: boolean;

  @IsOptional()
  @IsString({ message: 'Start time must be a string' })
  startTime?: string;

  @IsOptional()
  @IsString({ message: 'End time must be a string' })
  endTime?: string;
}

/**
 * Update provider DTO
 */
export class UpdateProviderDto {
  @IsOptional()
  @IsString({ message: 'Business name must be a string' })
  @Length(2, 100, { message: 'Business name must be between 2 and 100 characters' })
  businessName?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @Length(20, 1000, { message: 'Description must be between 20 and 1000 characters' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'Services must be an array' })
  @IsServiceType({ each: true, message: 'Each service must be a valid service type' })
  @ArrayMaxSize(10, { message: 'Maximum 10 services allowed' })
  services?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceAreaDto)
  serviceArea?: ServiceAreaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PricingDto)
  pricing?: PricingDto;

  @IsOptional()
  availability?: {
    [key: string]: AvailabilitySlotDto;
  };

  @IsOptional()
  @IsBoolean({ message: 'Is available must be a boolean' })
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
