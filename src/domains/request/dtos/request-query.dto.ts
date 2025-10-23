import { IsOptional, IsString, IsEnum, IsArray, IsNumber, ArrayMaxSize, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { SearchPaginationDto, LocationPaginationDto, DateRangePaginationDto } from '../common/pagination.dto';
import { IsServiceType, IsObjectId } from '../../utils/validation.utils';

/**
 * Service request search and filter DTO
 */
export class RequestQueryDto extends SearchPaginationDto {
  @IsOptional()
  @IsEnum(['pending', 'accepted', 'in-progress', 'completed', 'cancelled'], {
    message: 'Status must be pending, accepted, in-progress, completed, or cancelled'
  })
  status?: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';

  @IsOptional()
  @IsServiceType({ message: 'Category must be a valid service type' })
  category?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'], {
    message: 'Urgency must be low, medium, or high'
  })
  urgency?: 'low' | 'medium' | 'high';

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Minimum budget must be a number' })
  @Min(0, { message: 'Minimum budget must be at least 0' })
  minBudget?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Maximum budget must be a number' })
  @Min(0, { message: 'Maximum budget must be at least 0' })
  maxBudget?: number;

  @IsOptional()
  @IsString({ message: 'User ID must be a string' })
  @IsObjectId({ message: 'User ID must be a valid MongoDB ObjectId' })
  userId?: string;

  @IsOptional()
  @IsString({ message: 'Provider ID must be a string' })
  @IsObjectId({ message: 'Provider ID must be a valid MongoDB ObjectId' })
  providerId?: string;

  @IsOptional()
  @IsString({ message: 'Created from must be a string' })
  createdFrom?: string;

  @IsOptional()
  @IsString({ message: 'Created to must be a string' })
  createdTo?: string;

  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'urgency', 'budget', 'status'], {
    message: 'Sort by must be createdAt, updatedAt, urgency, budget, or status'
  })
  sortBy?: 'createdAt' | 'updatedAt' | 'urgency' | 'budget' | 'status';
}

/**
 * Service request location search DTO
 */
export class RequestLocationQueryDto extends LocationPaginationDto {
  @IsOptional()
  @IsEnum(['pending', 'accepted', 'in-progress'], {
    message: 'Status must be pending, accepted, or in-progress'
  })
  status?: 'pending' | 'accepted' | 'in-progress';

  @IsOptional()
  @IsArray({ message: 'Categories must be an array' })
  @IsServiceType({ each: true, message: 'Each category must be a valid service type' })
  @ArrayMaxSize(5, { message: 'Maximum 5 categories allowed' })
  categories?: string[];

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'], {
    message: 'Urgency must be low, medium, or high'
  })
  urgency?: 'low' | 'medium' | 'high';

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Minimum budget must be a number' })
  @Min(0, { message: 'Minimum budget must be at least 0' })
  minBudget?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Maximum budget must be a number' })
  @Min(0, { message: 'Maximum budget must be at least 0' })
  maxBudget?: number;
}

/**
 * Request analytics query DTO
 */
export class RequestAnalyticsQueryDto extends DateRangePaginationDto {
  @IsOptional()
  @IsArray({ message: 'Metrics must be an array' })
  @IsEnum(['total_requests', 'completion_rate', 'average_budget', 'response_time', 'customer_satisfaction'], { each: true })
  @ArrayMaxSize(10, { message: 'Maximum 10 metrics allowed' })
  metrics?: ('total_requests' | 'completion_rate' | 'average_budget' | 'response_time' | 'customer_satisfaction')[];

  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'quarter'], {
    message: 'Group by must be day, week, month, or quarter'
  })
  groupBy?: 'day' | 'week' | 'month' | 'quarter';

  @IsOptional()
  @IsArray({ message: 'Categories must be an array' })
  @IsServiceType({ each: true, message: 'Each category must be a valid service type' })
  @ArrayMaxSize(10, { message: 'Maximum 10 categories allowed' })
  categories?: string[];

  @IsOptional()
  @IsArray({ message: 'Statuses must be an array' })
  @IsEnum(['pending', 'accepted', 'in-progress', 'completed', 'cancelled'], { each: true })
  @ArrayMaxSize(5, { message: 'Maximum 5 statuses allowed' })
  statuses?: ('pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled')[];
}

/**
 * Request matching query DTO for providers
 */
export class RequestMatchingQueryDto extends LocationPaginationDto {
  @IsOptional()
  @IsArray({ message: 'Provider services must be an array' })
  @IsServiceType({ each: true, message: 'Each service must be a valid service type' })
  @ArrayMaxSize(10, { message: 'Maximum 10 services allowed' })
  providerServices?: string[];

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Minimum budget must be a number' })
  @Min(0, { message: 'Minimum budget must be at least 0' })
  minBudget?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Maximum budget must be a number' })
  @Min(0, { message: 'Maximum budget must be at least 0' })
  maxBudget?: number;

  @IsOptional()
  @IsArray({ message: 'Urgency levels must be an array' })
  @IsEnum(['low', 'medium', 'high'], { each: true })
  @ArrayMaxSize(3, { message: 'Maximum 3 urgency levels allowed' })
  urgencyLevels?: ('low' | 'medium' | 'high')[];

  @IsOptional()
  @IsString({ message: 'Availability date must be a string' })
  availabilityDate?: string; // YYYY-MM-DD format

  @IsOptional()
  @IsEnum(['budget', 'urgency', 'distance', 'createdAt'], {
    message: 'Sort by must be budget, urgency, distance, or createdAt'
  })
  sortBy?: 'budget' | 'urgency' | 'distance' | 'createdAt';
}

/**
 * Request timeline query DTO
 */
export class RequestTimelineQueryDto {
  @IsOptional()
  @IsString({ message: 'Start date must be a string' })
  startDate?: string;

  @IsOptional()
  @IsString({ message: 'End date must be a string' })
  endDate?: string;

  @IsOptional()
  @IsArray({ message: 'Event types must be an array' })
  @IsEnum(['created', 'accepted', 'started', 'completed', 'cancelled', 'reviewed'], { each: true })
  @ArrayMaxSize(10, { message: 'Maximum 10 event types allowed' })
  eventTypes?: ('created' | 'accepted' | 'started' | 'completed' | 'cancelled' | 'reviewed')[];

  @IsOptional()
  @IsString({ message: 'User ID must be a string' })
  @IsObjectId({ message: 'User ID must be a valid MongoDB ObjectId' })
  userId?: string;

  @IsOptional()
  @IsString({ message: 'Provider ID must be a string' })
  @IsObjectId({ message: 'Provider ID must be a valid MongoDB ObjectId' })
  providerId?: string;
}

