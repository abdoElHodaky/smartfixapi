/**
 * Modern ReviewController
 * 
 * Updated implementation using the new BaseController pattern with:
 * - Modern dependency injection
 * - Standardized response formatting
 * - Built-in validation and error handling
 * - Decorator-based routing
 */

import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { AuthRequest } from '../../types';
import { IReviewService } from '../../interfaces/services';
import { 
  ReviewDto,
  ReviewCreationDto,
  ReviewUpdateDto,
  ReviewListDto,
  ReviewStatsDto,
  ReviewResponseDto
} from '../../dtos';
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  RequireAuth, 
  RequireRoles,
  Validate 
} from '../../decorators/controller';

@Controller({ path: '/reviews' })
export class ReviewController extends BaseController {
  private reviewService: IReviewService;

  constructor() {
    super();
    this.reviewService = this.serviceRegistry.getReviewService();
  }

  /**
   * Create a new review
   */
  @Post('/')
  @RequireAuth()
  @Validate({
    serviceRequestId: { required: true },
    rating: { required: true },
    comment: { required: false, maxLength: 1000 }
  })
  createReview = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Create Review');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      serviceRequestId: { required: true },
      rating: { required: true },
      comment: { maxLength: 1000 }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    // Additional validation for rating range
    const { rating } = req.body;
    if (rating < 1 || rating > 5) {
      this.sendError(res, 'Rating must be between 1 and 5', 400);
      return;
    }

    try {
      const result = await this.reviewService.createReview(req.user!.id, req.body as ReviewCreationDto);
      this.sendSuccess<ReviewResponseDto>(res, result, 'Review created successfully', 201);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to create review', 400);
    }
  });

  /**
   * Get review by ID
   */
  @Get('/:reviewId')
  getReviewById = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Review By ID');

    const { reviewId } = req.params;

    try {
      const result = await this.reviewService.getReviewById(reviewId);
      this.sendSuccess<ReviewDto>(res, result, 'Review retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get review', 400);
    }
  });

  /**
   * Update review (only by review author)
   */
  @Put('/:reviewId')
  @RequireAuth()
  @Validate({
    rating: { required: false },
    comment: { required: false, maxLength: 1000 }
  })
  updateReview = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Update Review');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      comment: { maxLength: 1000 }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    // Additional validation for rating range if provided
    const { rating } = req.body;
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      this.sendError(res, 'Rating must be between 1 and 5', 400);
      return;
    }

    const { reviewId } = req.params;

    try {
      const result = await this.reviewService.updateReview(reviewId, req.user!.id, req.body as ReviewUpdateDto);
      this.sendSuccess<ReviewDto>(res, result, 'Review updated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update review', 400);
    }
  });

  /**
   * Delete review (only by review author or admin)
   */
  @Delete('/:reviewId')
  @RequireAuth()
  deleteReview = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Delete Review');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { reviewId } = req.params;

    try {
      await this.reviewService.deleteReview(reviewId, req.user!.id);
      this.sendSuccess(res, null, 'Review deleted successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to delete review', 400);
    }
  });

  /**
   * Get reviews for a service provider
   */
  @Get('/provider/:providerId')
  getProviderReviews = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Provider Reviews');

    const { providerId } = req.params;
    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'rating']);
    const filters = this.getFilterParams(req, ['rating', 'hasComment']);

    try {
      const result = await this.reviewService.getProviderReviews(providerId, {
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        filters
      });
      this.sendSuccess<ReviewListDto>(res, result, 'Provider reviews retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get provider reviews', 400);
    }
  });

  /**
   * Get reviews by a specific user
   */
  @Get('/user/:userId')
  getUserReviews = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get User Reviews');

    const { userId } = req.params;
    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'rating']);

    try {
      const result = await this.reviewService.getUserReviews(userId, {
        page,
        limit,
        offset,
        sortBy,
        sortOrder
      });
      this.sendSuccess<ReviewListDto>(res, result, 'User reviews retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get user reviews', 400);
    }
  });

  /**
   * Get my reviews (reviews written by authenticated user)
   */
  @Get('/my-reviews')
  @RequireAuth()
  getMyReviews = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get My Reviews');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'rating']);

    try {
      const result = await this.reviewService.getUserReviews(req.user!.id, {
        page,
        limit,
        offset,
        sortBy,
        sortOrder
      });
      this.sendSuccess<ReviewListDto>(res, result, 'Your reviews retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get your reviews', 400);
    }
  });

  /**
   * Get reviews for a service request
   */
  @Get('/service-request/:serviceRequestId')
  getServiceRequestReviews = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Service Request Reviews');

    const { serviceRequestId } = req.params;

    try {
      const result = await this.reviewService.getServiceRequestReviews(serviceRequestId);
      this.sendSuccess<ReviewListDto>(res, result, 'Service request reviews retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get service request reviews', 400);
    }
  });

  /**
   * Get provider review statistics
   */
  @Get('/provider/:providerId/stats')
  getProviderReviewStats = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Provider Review Stats');

    const { providerId } = req.params;

    try {
      const result = await this.reviewService.getProviderReviewStats(providerId);
      this.sendSuccess<ReviewStatsDto>(res, result, 'Provider review statistics retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get provider review statistics', 400);
    }
  });

  /**
   * Reply to a review (provider response)
   */
  @Post('/:reviewId/reply')
  @RequireAuth()
  @RequireRoles('provider')
  @Validate({
    reply: { required: true, minLength: 1, maxLength: 500 }
  })
  replyToReview = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Reply To Review');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      reply: { required: true, minLength: 1, maxLength: 500 }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    const { reviewId } = req.params;
    const { reply } = req.body;

    try {
      const result = await this.reviewService.replyToReview(reviewId, req.user!.id, reply);
      this.sendSuccess<ReviewDto>(res, result, 'Reply added successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to reply to review', 400);
    }
  });

  /**
   * Update reply to a review
   */
  @Put('/:reviewId/reply')
  @RequireAuth()
  @RequireRoles('provider')
  @Validate({
    reply: { required: true, minLength: 1, maxLength: 500 }
  })
  updateReviewReply = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Update Review Reply');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      reply: { required: true, minLength: 1, maxLength: 500 }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    const { reviewId } = req.params;
    const { reply } = req.body;

    try {
      const result = await this.reviewService.updateReviewReply(reviewId, req.user!.id, reply);
      this.sendSuccess<ReviewDto>(res, result, 'Reply updated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update reply', 400);
    }
  });

  /**
   * Delete reply to a review
   */
  @Delete('/:reviewId/reply')
  @RequireAuth()
  @RequireRoles('provider')
  deleteReviewReply = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Delete Review Reply');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const { reviewId } = req.params;

    try {
      const result = await this.reviewService.deleteReviewReply(reviewId, req.user!.id);
      this.sendSuccess<ReviewDto>(res, result, 'Reply deleted successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to delete reply', 400);
    }
  });

  /**
   * Flag a review as inappropriate
   */
  @Post('/:reviewId/flag')
  @RequireAuth()
  @Validate({
    reason: { required: true, maxLength: 200 }
  })
  flagReview = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Flag Review');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      reason: { required: true, maxLength: 200 }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    const { reviewId } = req.params;
    const { reason } = req.body;

    try {
      await this.reviewService.flagReview(reviewId, req.user!.id, reason);
      this.sendSuccess(res, null, 'Review flagged successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to flag review', 400);
    }
  });

  /**
   * Like/Unlike a review
   */
  @Post('/:reviewId/like')
  @RequireAuth()
  likeReview = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Like Review');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { reviewId } = req.params;

    try {
      const result = await this.reviewService.toggleReviewLike(reviewId, req.user!.id);
      this.sendSuccess(res, result, result.liked ? 'Review liked successfully' : 'Review unliked successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to like/unlike review', 400);
    }
  });

  /**
   * Get recent reviews (public endpoint)
   */
  @Get('/recent')
  getRecentReviews = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Recent Reviews');

    const { limit } = req.query;
    const reviewLimit = Math.min(50, Math.max(1, parseInt(limit as string) || 10));

    try {
      const result = await this.reviewService.getRecentReviews(reviewLimit);
      this.sendSuccess<ReviewListDto>(res, result, 'Recent reviews retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get recent reviews', 400);
    }
  });

  /**
   * Get top-rated providers based on reviews
   */
  @Get('/top-providers')
  getTopRatedProviders = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Top Rated Providers');

    const { limit, serviceType } = req.query;
    const providerLimit = Math.min(50, Math.max(1, parseInt(limit as string) || 10));

    try {
      const result = await this.reviewService.getTopRatedProviders({
        limit: providerLimit,
        serviceType: serviceType as string
      });
      this.sendSuccess(res, result, 'Top-rated providers retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get top-rated providers', 400);
    }
  });

  /**
   * Search reviews
   */
  @Get('/search')
  searchReviews = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Search Reviews');

    const { query, providerId, rating, hasComment } = req.query;
    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'rating', 'relevance']);

    if (!query || (query as string).trim().length < 2) {
      this.sendError(res, 'Search query must be at least 2 characters long', 400);
      return;
    }

    try {
      const result = await this.reviewService.searchReviews({
        query: query as string,
        providerId: providerId as string,
        rating: rating ? parseInt(rating as string) : undefined,
        hasComment: hasComment === 'true',
        page,
        limit,
        offset,
        sortBy,
        sortOrder
      });
      this.sendSuccess<ReviewListDto>(res, result, 'Review search completed successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to search reviews', 400);
    }
  });
}
