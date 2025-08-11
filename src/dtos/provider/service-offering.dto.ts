import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Length, Min, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { IsServiceType, IsUrl } from '../../utils/validation.utils';

/**
 * Service offering item DTO
 */
export class ServiceOfferingItemDto {
  @IsString({ message: 'Service type must be a string' })
  @IsServiceType({ message: 'Service type must be a valid service type' })
  serviceType: string;

  @IsString({ message: 'Title must be a string' })
  @Length(5, 100, { message: 'Title must be between 5 and 100 characters' })
  title: string;

  @IsString({ message: 'Description must be a string' })
  @Length(20, 500, { message: 'Description must be between 20 and 500 characters' })
  description: string;

  @IsNumber({}, { message: 'Base price must be a number' })
  @Min(0, { message: 'Base price must be at least 0' })
  basePrice: number;

  @IsOptional()
  @IsNumber({}, { message: 'Duration must be a number' })
  @Min(15, { message: 'Duration must be at least 15 minutes' })
  estimatedDuration?: number; // in minutes

  @IsOptional()
  @IsArray({ message: 'Images must be an array' })
  @ArrayMaxSize(5, { message: 'Maximum 5 images allowed' })
  @IsUrl({ each: true, message: 'Each image must be a valid URL' })
  images?: string[];

  @IsOptional()
  @IsArray({ message: 'Requirements must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 requirements allowed' })
  @IsString({ each: true, message: 'Each requirement must be a string' })
  requirements?: string[];
}

/**
 * Create service offering DTO
 */
export class CreateServiceOfferingDto {
  @IsArray({ message: 'Services must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ServiceOfferingItemDto)
  @ArrayMaxSize(20, { message: 'Maximum 20 service offerings allowed' })
  services: ServiceOfferingItemDto[];
}

/**
 * Update service offering DTO
 */
export class UpdateServiceOfferingDto {
  @IsOptional()
  @IsArray({ message: 'Services must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ServiceOfferingItemDto)
  @ArrayMaxSize(20, { message: 'Maximum 20 service offerings allowed' })
  services?: ServiceOfferingItemDto[];
}

