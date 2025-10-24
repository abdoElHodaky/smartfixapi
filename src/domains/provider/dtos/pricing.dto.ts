import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum, Length, Min, Max, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { IsServiceType } from '../../../utils/validation.utils';

/**
 * Service pricing tier DTO
 */
export class ServicePricingTierDto {
  @IsString({ message: 'Tier name must be a string' })
  @Length(2, 50, { message: 'Tier name must be between 2 and 50 characters' })
  tierName: string;

  @IsString({ message: 'Description must be a string' })
  @Length(10, 200, { message: 'Description must be between 10 and 200 characters' })
  description: string;

  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be at least 0' })
  price: number;

  @IsOptional()
  @IsNumber({}, { message: 'Duration must be a number' })
  @Min(15, { message: 'Duration must be at least 15 minutes' })
  estimatedDuration?: number; // in minutes
}

/**
 * Service pricing DTO
 */
export class ServicePricingDto {
  @IsString({ message: 'Service type must be a string' })
  @IsServiceType({ message: 'Service type must be a valid service type' })
  serviceType: string;

  @IsEnum(['fixed', 'hourly', 'tiered', 'quote'], { 
    message: 'Pricing type must be fixed, hourly, tiered, or quote' 
  })
  pricingType: 'fixed' | 'hourly' | 'tiered' | 'quote';

  @IsOptional()
  @IsNumber({}, { message: 'Base price must be a number' })
  @Min(0, { message: 'Base price must be at least 0' })
  basePrice?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Hourly rate must be a number' })
  @Min(0, { message: 'Hourly rate must be at least 0' })
  hourlyRate?: number;

  @IsOptional()
  @IsArray({ message: 'Pricing tiers must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ServicePricingTierDto)
  @ArrayMaxSize(5, { message: 'Maximum 5 pricing tiers allowed' })
  pricingTiers?: ServicePricingTierDto[];

  @IsOptional()
  @IsNumber({}, { message: 'Minimum charge must be a number' })
  @Min(0, { message: 'Minimum charge must be at least 0' })
  minimumCharge?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Travel fee must be a number' })
  @Min(0, { message: 'Travel fee must be at least 0' })
  travelFee?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Emergency surcharge must be a number' })
  @Min(0, { message: 'Emergency surcharge must be at least 0' })
  @Max(100, { message: 'Emergency surcharge cannot exceed 100%' })
  emergencySurchargePercent?: number;
}

/**
 * Discount DTO
 */
export class DiscountDto {
  @IsString({ message: 'Discount code must be a string' })
  @Length(3, 20, { message: 'Discount code must be between 3 and 20 characters' })
  code: string;

  @IsString({ message: 'Description must be a string' })
  @Length(10, 200, { message: 'Description must be between 10 and 200 characters' })
  description: string;

  @IsEnum(['percentage', 'fixed'], { message: 'Discount type must be percentage or fixed' })
  discountType: 'percentage' | 'fixed';

  @IsNumber({}, { message: 'Discount value must be a number' })
  @Min(0, { message: 'Discount value must be at least 0' })
  discountValue: number;

  @IsOptional()
  @IsNumber({}, { message: 'Minimum order must be a number' })
  @Min(0, { message: 'Minimum order must be at least 0' })
  minimumOrder?: number;

  @IsOptional()
  @IsString({ message: 'Valid from must be a string' })
  validFrom?: string; // ISO date string

  @IsOptional()
  @IsString({ message: 'Valid until must be a string' })
  validUntil?: string; // ISO date string

  @IsOptional()
  @IsNumber({}, { message: 'Usage limit must be a number' })
  @Min(1, { message: 'Usage limit must be at least 1' })
  usageLimit?: number;
}

/**
 * Update pricing DTO
 */
export class UpdatePricingDto {
  @IsOptional()
  @IsArray({ message: 'Service pricing must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ServicePricingDto)
  @ArrayMaxSize(20, { message: 'Maximum 20 service pricing entries allowed' })
  servicePricing?: ServicePricingDto[];

  @IsOptional()
  @IsArray({ message: 'Discounts must be an array' })
  @ValidateNested({ each: true })
  @Type(() => DiscountDto)
  @ArrayMaxSize(10, { message: 'Maximum 10 discounts allowed' })
  discounts?: DiscountDto[];

  @IsOptional()
  @IsString({ message: 'Currency must be a string' })
  @Length(3, 3, { message: 'Currency must be exactly 3 characters (ISO code)' })
  currency?: string;

  @IsOptional()
  @IsString({ message: 'Payment terms must be a string' })
  @Length(10, 500, { message: 'Payment terms must be between 10 and 500 characters' })
  paymentTerms?: string;
}
