import { IsString, IsArray, IsNumber, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { IsCoordinate } from '../../utils/validation.utils';

/**
 * Location DTO for geographic coordinates
 */
export class LocationDto {
  @IsString({ message: 'Type must be a string' })
  type: 'Point' = 'Point';

  @IsArray({ message: 'Coordinates must be an array' })
  @ArrayMinSize(2, { message: 'Coordinates must have exactly 2 elements' })
  @ArrayMaxSize(2, { message: 'Coordinates must have exactly 2 elements' })
  @IsCoordinate({ each: true, message: 'Each coordinate must be a valid number' })
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Service area DTO with location and radius
 */
export class ServiceAreaDto {
  @IsString({ message: 'Type must be a string' })
  type: 'Point' = 'Point';

  @IsArray({ message: 'Coordinates must be an array' })
  @ArrayMinSize(2, { message: 'Coordinates must have exactly 2 elements' })
  @ArrayMaxSize(2, { message: 'Coordinates must have exactly 2 elements' })
  @IsCoordinate({ each: true, message: 'Each coordinate must be a valid number' })
  coordinates: [number, number];

  @IsNumber({}, { message: 'Radius must be a number' })
  radius: number; // in kilometers
}

/**
 * Location search DTO for proximity searches
 */
export class LocationSearchDto {
  @IsArray({ message: 'Coordinates must be an array' })
  @ArrayMinSize(2, { message: 'Coordinates must have exactly 2 elements' })
  @ArrayMaxSize(2, { message: 'Coordinates must have exactly 2 elements' })
  @IsCoordinate({ each: true, message: 'Each coordinate must be a valid number' })
  coordinates: [number, number];

  @IsNumber({}, { message: 'Radius must be a number' })
  radius: number; // in kilometers
}
