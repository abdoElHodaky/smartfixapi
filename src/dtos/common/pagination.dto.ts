import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Base pagination DTO
 */
export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'Sort by must be a string' })
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort order must be asc or desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * Search pagination DTO with search query
 */
export class SearchPaginationDto extends PaginationDto {
  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  q?: string;

  @IsOptional()
  @IsString({ message: 'Search field must be a string' })
  searchField?: string;
}

/**
 * Date range pagination DTO
 */
export class DateRangePaginationDto extends PaginationDto {
  @IsOptional()
  @IsString({ message: 'Start date must be a string' })
  startDate?: string;

  @IsOptional()
  @IsString({ message: 'End date must be a string' })
  endDate?: string;
}

/**
 * Location-based pagination DTO
 */
export class LocationPaginationDto extends PaginationDto {
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
  @Max(100, { message: 'Radius cannot exceed 100 km' })
  radius?: number; // in kilometers
}

