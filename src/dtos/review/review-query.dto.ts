// Validation imports
import { IsOptional, IsString, IsNumberString, IsIn, IsBoolean, Length } from 'class-validator';
import { Transform } from 'class-transformer';

// Internal imports
import { PaginationDto } from '../common';

/**
 * Review query parameters DTO
 */
export class ReviewQueryDto extends PaginationDto {
  @IsOptional()
  @IsString({ message: 'Provider ID must be a string' })
  providerId?: string;

  @IsOptional()
  @IsString({ message: 'User ID must be a string' })
  userId?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Rating must be a number' })
  @Transform(({ value }) => parseInt(value))
  rating?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean({ message: 'Has comment must be a boolean' })
  hasComment?: boolean;

  @IsOptional()
  @IsIn(['createdAt', 'rating', 'relevance'], { message: 'Invalid sort field' })
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Sort order must be asc or desc' })
  sortOrder?: string;
}

/**
 * Review search query DTO
 */
export class ReviewSearchQueryDto extends ReviewQueryDto {
  @IsString({ message: 'Search query is required' })
  @Transform(({ value }) => value?.trim())
  @Length(2, 100, { message: 'Search query must be between 2 and 100 characters' })
  query: string;
}

/**
 * Recent reviews query DTO
 */
export class RecentReviewsQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'Limit must be a number' })
  @Transform(({ value }) => Math.min(50, Math.max(1, parseInt(value) || 10)))
  limit?: number;
}

/**
 * Top providers query DTO
 */
export class TopProvidersQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'Limit must be a number' })
  @Transform(({ value }) => Math.min(50, Math.max(1, parseInt(value) || 10)))
  limit?: number;

  @IsOptional()
  @IsString({ message: 'Service type must be a string' })
  serviceType?: string;
}
