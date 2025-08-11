import { IsOptional, IsString, IsBoolean, IsEnum, IsArray, ArrayMaxSize } from 'class-validator';
import { Transform } from 'class-transformer';
import { SearchPaginationDto, DateRangePaginationDto, LocationPaginationDto } from '../common/pagination.dto';
import { IsUserRole } from '../../utils/validation.utils';

/**
 * User search and filter DTO
 */
export class UserQueryDto extends SearchPaginationDto {
  @IsOptional()
  @IsUserRole({ message: 'Role must be a valid user role' })
  role?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Active must be a boolean' })
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Email verified must be a boolean' })
  emailVerified?: boolean;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @IsOptional()
  @IsString({ message: 'Created from must be a string' })
  createdFrom?: string;

  @IsOptional()
  @IsString({ message: 'Created to must be a string' })
  createdTo?: string;

  @IsOptional()
  @IsEnum(['firstName', 'lastName', 'email', 'createdAt', 'lastLogin'], {
    message: 'Sort by must be firstName, lastName, email, createdAt, or lastLogin'
  })
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt' | 'lastLogin';
}

/**
 * User location search DTO
 */
export class UserLocationQueryDto extends LocationPaginationDto {
  @IsOptional()
  @IsUserRole({ message: 'Role must be a valid user role' })
  role?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Active must be a boolean' })
  isActive?: boolean;

  @IsOptional()
  @IsArray({ message: 'Services must be an array' })
  @IsString({ each: true, message: 'Each service must be a string' })
  @ArrayMaxSize(10, { message: 'Maximum 10 services allowed' })
  services?: string[];
}

/**
 * User activity query DTO
 */
export class UserActivityQueryDto extends DateRangePaginationDto {
  @IsOptional()
  @IsEnum(['login', 'registration', 'profile_update', 'service_request', 'review'], {
    message: 'Activity type must be login, registration, profile_update, service_request, or review'
  })
  activityType?: 'login' | 'registration' | 'profile_update' | 'service_request' | 'review';

  @IsOptional()
  @IsString({ message: 'User ID must be a string' })
  userId?: string;

  @IsOptional()
  @IsEnum(['createdAt', 'activityType'], {
    message: 'Sort by must be createdAt or activityType'
  })
  sortBy?: 'createdAt' | 'activityType';
}

/**
 * User statistics query DTO
 */
export class UserStatsQueryDto {
  @IsOptional()
  @IsString({ message: 'Start date must be a string' })
  startDate?: string;

  @IsOptional()
  @IsString({ message: 'End date must be a string' })
  endDate?: string;

  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'], {
    message: 'Group by must be day, week, month, or year'
  })
  groupBy?: 'day' | 'week' | 'month' | 'year';

  @IsOptional()
  @IsArray({ message: 'Metrics must be an array' })
  @IsEnum(['registrations', 'active_users', 'profile_completions', 'service_requests'], { each: true })
  @ArrayMaxSize(10, { message: 'Maximum 10 metrics allowed' })
  metrics?: ('registrations' | 'active_users' | 'profile_completions' | 'service_requests')[];
}

