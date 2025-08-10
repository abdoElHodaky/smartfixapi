import { PaginationDto } from '../common';

/**
 * Review filters DTO
 */
export interface ReviewFiltersDto extends PaginationDto {
  providerId?: string;
  userId?: string;
  rating?: number;
  isVerified?: boolean;
}

/**
 * Recent reviews filters DTO
 */
export interface RecentReviewsFiltersDto {
  limit?: number;
  minRating?: number;
}

/**
 * Review statistics response DTO
 */
export interface ReviewStatisticsResponseDto {
  success: boolean;
  message: string;
  data: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: {
      [key: number]: number;
    };
    verifiedReviews: number;
    reviewsWithResponse: number;
    responseRate: number;
  };
}

