import { IsString, IsOptional, IsEnum, IsArray, IsDateString, IsNumber, Min, Max, ArrayMaxSize } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsObjectId } from '../../utils/validation.utils';

/**
 * Date range DTO for statistics queries
 */
export class DateRangeDto {
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  startDate: Date;

  @IsDateString({}, { message: 'End date must be a valid date string' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  endDate: Date;
}

/**
 * Statistics query DTO
 */
export class StatisticsQueryDto {
  @IsEnum(['users', 'providers', 'requests', 'reviews', 'revenue', 'bookings'], {
    message: 'Metric type must be users, providers, requests, reviews, revenue, or bookings'
  })
  metricType: 'users' | 'providers' | 'requests' | 'reviews' | 'revenue' | 'bookings';

  @IsEnum(['day', 'week', 'month', 'quarter', 'year'], {
    message: 'Time period must be day, week, month, quarter, or year'
  })
  timePeriod: 'day' | 'week' | 'month' | 'quarter' | 'year';

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  startDate?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date string' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  endDate?: Date;

  @IsOptional()
  @IsArray({ message: 'Filters must be an array' })
  @IsString({ each: true, message: 'Each filter must be a string' })
  @ArrayMaxSize(10, { message: 'Maximum 10 filters allowed' })
  filters?: string[];

  @IsOptional()
  @IsEnum(['count', 'sum', 'avg', 'min', 'max'], {
    message: 'Aggregation must be count, sum, avg, min, or max'
  })
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';

  @IsOptional()
  @IsString({ message: 'Group by must be a string' })
  @IsEnum(['category', 'location', 'provider', 'user', 'status'], {
    message: 'Group by must be category, location, provider, user, or status'
  })
  groupBy?: string;
}

/**
 * Revenue statistics query DTO
 */
export class RevenueStatisticsDto {
  @IsEnum(['gross', 'net', 'commission', 'refunds'], {
    message: 'Revenue type must be gross, net, commission, or refunds'
  })
  revenueType: 'gross' | 'net' | 'commission' | 'refunds';

  @IsEnum(['day', 'week', 'month', 'quarter', 'year'], {
    message: 'Time period must be day, week, month, quarter, or year'
  })
  timePeriod: 'day' | 'week' | 'month' | 'quarter' | 'year';

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  startDate?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date string' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  endDate?: Date;

  @IsOptional()
  @IsArray({ message: 'Provider IDs must be an array' })
  @IsObjectId({ each: true, message: 'Each provider ID must be a valid MongoDB ObjectId' })
  @ArrayMaxSize(50, { message: 'Maximum 50 provider IDs allowed' })
  providerIds?: string[];

  @IsOptional()
  @IsArray({ message: 'Categories must be an array' })
  @IsString({ each: true, message: 'Each category must be a string' })
  @ArrayMaxSize(20, { message: 'Maximum 20 categories allowed' })
  categories?: string[];

  @IsOptional()
  @IsString({ message: 'Currency must be a string' })
  currency?: string;
}

/**
 * Performance metrics query DTO
 */
export class PerformanceMetricsDto {
  @IsEnum(['response_time', 'completion_rate', 'customer_satisfaction', 'booking_conversion'], {
    message: 'Metric must be response_time, completion_rate, customer_satisfaction, or booking_conversion'
  })
  metric: 'response_time' | 'completion_rate' | 'customer_satisfaction' | 'booking_conversion';

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  startDate?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date string' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  endDate?: Date;

  @IsOptional()
  @IsArray({ message: 'Provider IDs must be an array' })
  @IsObjectId({ each: true, message: 'Each provider ID must be a valid MongoDB ObjectId' })
  @ArrayMaxSize(50, { message: 'Maximum 50 provider IDs allowed' })
  providerIds?: string[];

  @IsOptional()
  @IsNumber({}, { message: 'Minimum threshold must be a number' })
  @Min(0, { message: 'Minimum threshold must be at least 0' })
  minThreshold?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Maximum threshold must be a number' })
  @Min(0, { message: 'Maximum threshold must be at least 0' })
  maxThreshold?: number;
}

/**
 * Export statistics DTO
 */
export class ExportStatisticsDto {
  @IsEnum(['csv', 'xlsx', 'json', 'pdf'], {
    message: 'Format must be csv, xlsx, json, or pdf'
  })
  format: 'csv' | 'xlsx' | 'json' | 'pdf';

  @IsArray({ message: 'Metrics must be an array' })
  @IsString({ each: true, message: 'Each metric must be a string' })
  @ArrayMaxSize(10, { message: 'Maximum 10 metrics allowed' })
  metrics: string[];

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  startDate?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date string' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  endDate?: Date;

  @IsOptional()
  @IsString({ message: 'Email must be a string' })
  email?: string; // Email to send the export to

  @IsOptional()
  @IsBoolean({ message: 'Include charts must be a boolean' })
  includeCharts?: boolean;
}

