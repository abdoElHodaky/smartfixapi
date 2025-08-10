import { Response } from 'express';
import { ReviewService } from '../../services/review/ReviewService';
import { AuthRequest } from '../../types';
import { asyncHandler, AuthorizationError } from '../../middleware/errorHandler';

export class ReviewController {
  private reviewService: ReviewService;

  constructor(reviewService: ReviewService = new ReviewService()) {
    this.reviewService = reviewService;
  }

  /**
   * Create a new review
   */
  createReview = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await this.reviewService.createReview(req.user.id, req.body);
    res.status(201).json(result);
  });

  /**
   * Get review by ID
   */
  getReviewById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { reviewId } = req.params;

    const result = await this.reviewService.getReviewById(reviewId);
    res.status(200).json(result);
  });

  /**
   * Update review
   */
  updateReview = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { reviewId } = req.params;

    const result = await this.reviewService.updateReview(reviewId, req.user.id, req.body);
    res.status(200).json(result);
  });

  /**
   * Delete review
   */
  deleteReview = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { reviewId } = req.params;

    const result = await this.reviewService.deleteReview(reviewId, req.user.id, req.user.role);
    res.status(200).json(result);
  });

  /**
   * Get reviews for a provider
   */
  getProviderReviews = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { providerId } = req.params;
    const searchParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      rating: req.query.rating ? parseInt(req.query.rating as string) : undefined
    };

    const result = await this.reviewService.getProviderReviews(providerId, searchParams);
    res.status(200).json(result);
  });

  /**
   * Add provider response to review
   */
  addProviderResponse = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const { reviewId } = req.params;

    const result = await this.reviewService.addProviderResponse(reviewId, req.user.id, req.body.message);
    res.status(200).json(result);
  });

  /**
   * Mark review as helpful/not helpful
   */
  markHelpful = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { reviewId } = req.params;

    const result = await this.reviewService.markReviewHelpful(reviewId, req.body.helpful);
    res.status(200).json(result);
  });

  /**
   * Get user's reviews (reviews they've written)
   */
  getUserReviews = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const searchParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10
    };

    const result = await this.reviewService.getUserReviews(req.user.id, searchParams);
    res.status(200).json(result);
  });

  /**
   * Get recent reviews (public endpoint)
   */
  getRecentReviews = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const searchParams = {
      limit: parseInt(req.query.limit as string) || 10,
      minRating: parseInt(req.query.minRating as string) || 1
    };

    const result = await this.reviewService.getRecentReviews(searchParams);
    res.status(200).json(result);
  });

  /**
   * Get review statistics
   */
  getReviewStatistics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await this.reviewService.getReviewStatistics();
    res.status(200).json(result);
  });
}
