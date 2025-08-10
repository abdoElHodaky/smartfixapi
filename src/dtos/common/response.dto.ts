/**
 * Standard API response DTO
 */
export interface ApiResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Error response DTO
 */
export interface ErrorResponseDto {
  success: false;
  message: string;
  error: string;
  statusCode?: number;
}

/**
 * Success response DTO
 */
export interface SuccessResponseDto<T = any> {
  success: true;
  message: string;
  data: T;
}

