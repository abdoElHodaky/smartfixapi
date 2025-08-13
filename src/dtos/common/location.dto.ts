/**
 * Location DTO for geographic coordinates
 */
export interface LocationDto {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Service area DTO with location and radius
 */
export interface ServiceAreaDto {
  type: 'Point';
  coordinates: [number, number];
  radius: number; // in kilometers
}

/**
 * Location search DTO for proximity searches
 */
export interface LocationSearchDto {
  coordinates: [number, number];
  radius: number; // in kilometers
}

