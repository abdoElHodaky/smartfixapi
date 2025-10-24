import { IsOptional, IsString, IsBoolean, IsEnum, IsArray, IsNumber, ArrayMaxSize, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { SearchPaginationDto, LocationPaginationDto, DateRangePaginationDto } from '../../common/dtos/pagination.dto';
import { IsServiceType } from '../../../utils/validation.utils';

/**
 * Provider search and filter DTO
 */
export class ProviderQueryDto extends SearchPaginationDto {
  @IsOptional()
  @IsArray({ message: 'Services must be an array' })
  @IsServiceType({ each: true, message: 'Each service must be a valid service type' })
  @ArrayMaxSize(10, { message: 'Maximum 10 services allowed' })
  services?: string[];

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Available must be a boolean' })
  isAvailable?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Minimum rating must be a number' })
  @Min(1, { message: 'Minimum rating must be at least 1' })
  @Max(5, { message: 'Minimum rating cannot exceed 5' })
  minRating?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Maximum hourly rate must be a number' })
  @Min(0, { message: 'Maximum hourly rate must be at least 0' })
  maxHourlyRate?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'Minimum completed jobs must be a number' })
  @Min(0, { message: 'Minimum completed jobs must be at least 0' })
  minCompletedJobs?: number;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @IsOptional()
  @IsEnum(['rating', 'completedJobs', 'hourlyRate', 'createdAt', 'businessName'], {
    message: 'Sort by must be rating, completedJobs, hourlyRate, createdAt, or businessName'
  })
  sortBy?: 'rating' | 'completedJobs' | 'hourlyRate' | 'createdAt' | 'businessName';
}

/**
 * Provider location search DTO
 */
export class ProviderLocationQueryDto extends LocationPaginationDto {
  @IsOptional()
  @IsArray({ message: 'Services must be an array' })
  @IsServiceType({ each: true, message: 'Each service must be a valid service type' })
  @ArrayMaxSize(10, { message: 'Maximum 10 services allowed' })
  services?: string[];

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Available must be a boolean' })
  isAvailable?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Minimum rating must be a number' })
  @Min(1, { message: 'Minimum rating must be at least 1' })
  @Max(5, { message: 'Minimum rating cannot exceed 5' })
  minRating?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Maximum hourly rate must be a number' })
  @Min(0, { message: 'Maximum hourly rate must be at least 0' })
  maxHourlyRate?: number;
}

/**
 * Provider availability query DTO
 */
export class ProviderAvailabilityQueryDto {
  @IsOptional()
  @IsString({ message: 'Date must be a string' })
  date?: string; // YYYY-MM-DD format

  @IsOptional()
  @IsString({ message: 'Start time must be a string' })
  startTime?: string; // HH:MM format

  @IsOptional()
  @IsString({ message: 'End time must be a string' })
  endTime?: string; // HH:MM format

  @IsOptional()
  @IsArray({ message: 'Services must be an array' })
  @IsServiceType({ each: true, message: 'Each service must be a valid service type' })
  @ArrayMaxSize(5, { message: 'Maximum 5 services allowed' })
  services?: string[];

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Latitude must be a number' })
  @Min(-90, { message: 'Latitude must be at least -90' })
  @Max(90, { message: 'Latitude cannot exceed 90' })
  latitude?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Longitude must be a number' })
  @Min(-180, { message: 'Longitude must be at least -180' })
  @Max(180, { message: 'Longitude cannot exceed 180' })
  longitude?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Radius must be a number' })
  @Min(0.1, { message: 'Radius must be at least 0.1 km' })
  @Max(50, { message: 'Radius cannot exceed 50 km' })
  radius?: number;
}

/**
 * Provider performance query DTO
 */
export class ProviderPerformanceQueryDto extends DateRangePaginationDto {
  @IsOptional()
  @IsArray({ message: 'Metrics must be an array' })
  @IsEnum(['response_time', 'completion_rate', 'customer_satisfaction', 'revenue'], { each: true })
  @ArrayMaxSize(10, { message: 'Maximum 10 metrics allowed' })
  metrics?: ('response_time' | 'completion_rate' | 'customer_satisfaction' | 'revenue')[];

  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'quarter'], {
    message: 'Group by must be day, week, month, or quarter'
  })
  groupBy?: 'day' | 'week' | 'month' | 'quarter';

  @IsOptional()
  @IsArray({ message: 'Services must be an array' })
  @IsServiceType({ each: true, message: 'Each service must be a valid service type' })
  @ArrayMaxSize(10, { message: 'Maximum 10 services allowed' })
  services?: string[];
}

/**
 * Provider ranking query DTO
 */
export class ProviderRankingQueryDto {
  @IsOptional()
  @IsEnum(['rating', 'completedJobs', 'revenue', 'responseTime'], {
    message: 'Rank by must be rating, completedJobs, revenue, or responseTime'
  })
  rankBy?: 'rating' | 'completedJobs' | 'revenue' | 'responseTime';

  @IsOptional()
  @IsString({ message: 'Time period must be a string' })
  @IsEnum(['week', 'month', 'quarter', 'year', 'all'], {
    message: 'Time period must be week, month, quarter, year, or all'
  })
  timePeriod?: 'week' | 'month' | 'quarter' | 'year' | 'all';

  @IsOptional()
  @IsArray({ message: 'Services must be an array' })
  @IsServiceType({ each: true, message: 'Each service must be a valid service type' })
  @ArrayMaxSize(5, { message: 'Maximum 5 services allowed' })
  services?: string[];

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;
}
