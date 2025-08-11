import { IsString, IsEnum, IsOptional, ValidateNested, IsArray, IsNumber, IsDateString, Length, Min, Max, ArrayMaxSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { LocationDto, AddressDto } from '../common';
import { IsServiceType, IsUrl } from '../../utils/validation.utils';

/**
 * Budget DTO for service requests
 */
export class BudgetDto {
  @IsNumber({}, { message: 'Minimum budget must be a number' })
  @Min(0, { message: 'Minimum budget must be at least 0' })
  min: number;

  @IsNumber({}, { message: 'Maximum budget must be a number' })
  @Min(0, { message: 'Maximum budget must be at least 0' })
  max: number;
}

/**
 * Create service request DTO
 */
export class CreateRequestDto {
  @IsString({ message: 'Title must be a string' })
  @Length(5, 100, { message: 'Title must be between 5 and 100 characters' })
  title: string;

  @IsString({ message: 'Description must be a string' })
  @Length(20, 1000, { message: 'Description must be between 20 and 1000 characters' })
  description: string;

  @IsString({ message: 'Category must be a string' })
  @IsServiceType({ message: 'Category must be a valid service type' })
  category: string;

  @IsEnum(['low', 'medium', 'high'], { message: 'Urgency must be low, medium, or high' })
  urgency: 'low' | 'medium' | 'high';

  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetDto)
  budget?: BudgetDto;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsDateString({}, { message: 'Preferred date must be a valid date string' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  preferredDate?: Date;

  @IsOptional()
  @IsArray({ message: 'Images must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 images allowed' })
  @IsUrl({ each: true, message: 'Each image must be a valid URL' })
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
