import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

/**
 * Review service interface
 */
export interface IReviewService {
  /**
   * Create a new review
   */
  createReview(userId: string, reviewData: CreateReviewDto): Promise<ApiResponseDto>;

  /**
   * Get review by ID
   */
  getReviewById(reviewId: string): Promise<any>;

  /**
   * Update review
   */
  updateReview(reviewId: string, userId: string, updateData: UpdateReviewDto): Promise<ApiResponseDto>;

  /**
   * Delete review
   */
  deleteReview(reviewId: string, userId: string): Promise<ApiResponseDto>;

  /**
   * Search reviews with filters
   */
  searchReviews(filters: ReviewFiltersDto): Promise<PaginatedResponseDto<any>>;

  /**
   * Get reviews by provider
   */
  getReviewsByProvider(providerId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Get reviews by user
   */
  getReviewsByUser(userId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Respond to review (provider)
   */
  respondToReview(reviewId: string, providerId: string, response: string): Promise<ApiResponseDto>;

  /**
   * Flag review as inappropriate
   */
  flagReview(reviewId: string, userId: string, reason: string): Promise<ApiResponseDto>;

  /**
   * Get review statistics for provider
   */
  getProviderReviewStatistics(providerId: string): Promise<any>;

  /**
   * Verify review (admin)
   */
  verifyReview(reviewId: string): Promise<ApiResponseDto>;

  /**
   * Get pending reviews for moderation
   */
  getPendingReviews(page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Calculate provider rating from reviews
   */
  calculateProviderRating(providerId: string): Promise<{ average: number; count: number }>;

  /**
   * Get all reviews (admin function)
   */
  getAllReviews(filters: ReviewFiltersDto): Promise<PaginatedResponseDto<any>>;

  /**
   * Moderate review (admin function)
   */
  moderateReview(reviewId: string, action: string, reason?: string): Promise<ApiResponseDto>;

  /**
   * Get reviews by user ID
   */
  getReviewsByUserId(userId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Get reviews by provider ID
   */
  getReviewsByProviderId(providerId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Get reviews by service request ID
   */
  getReviewsByServiceRequestId(serviceRequestId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Get review statistics for provider
   */
  getReviewStatistics(providerId: string): Promise<ReviewStatisticsDto>;

  /**
   * Validate service request exists (for review creation)
   */
  validateServiceRequest(serviceRequestId: string): Promise<boolean>;
}
