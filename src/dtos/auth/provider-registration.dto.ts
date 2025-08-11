import { IsString, IsArray, IsOptional, ValidateNested, Length, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceAreaDto } from '../common';
import { IsServiceType } from '../../utils/validation.utils';

/**
 * Fixed price DTO for service pricing
 */
export class FixedPriceDto {
  @IsString({ message: 'Service must be a string' })
  @IsServiceType({ message: 'Service must be a valid service type' })
  service: string;

  @IsNumber({}, { message: 'Price must be a number' })
  price: number;
}

/**
 * Pricing DTO for service provider
 */
export class PricingDto {
  @IsOptional()
  @IsNumber({}, { message: 'Hourly rate must be a number' })
  hourlyRate?: number;

  @IsOptional()
  @IsArray({ message: 'Fixed prices must be an array' })
  @ValidateNested({ each: true })
  @Type(() => FixedPriceDto)
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
 * Service provider registration DTO
 */
export class ServiceProviderRegistrationDto {
  @IsString({ message: 'Business name must be a string' })
  @Length(2, 100, { message: 'Business name must be between 2 and 100 characters' })
  businessName: string;

  @IsString({ message: 'Description must be a string' })
  @Length(10, 1000, { message: 'Description must be between 10 and 1000 characters' })
  description: string;

  @IsArray({ message: 'Services must be an array' })
  @IsServiceType({ each: true, message: 'Each service must be a valid service type' })
  services: string[];

  @ValidateNested()
  @Type(() => ServiceAreaDto)
  serviceArea: ServiceAreaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PricingDto)
  pricing?: PricingDto;

  @IsOptional()
  availability?: {
    [key: string]: AvailabilitySlotDto;
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
