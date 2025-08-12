import { Response } from 'express';
import { serviceContainer } from '../../container';
import { AuthRequest } from '../../types';
import { asyncHandler, AuthorizationError } from '../../middleware/errorHandler';
import { IReviewService } from '../../interfaces/services';

export class ReviewController {
  private reviewService: IReviewService;

  constructor() {
    this.reviewService = serviceContainer.getReviewService();
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

    const result = await this.reviewService.deleteReview(reviewId, req.user.id);
    res.status(200).json(result);
  });

  /**
   * Get reviews for a provider
   */
  getProviderReviews = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { providerId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await this.reviewService.getReviewsByProvider(providerId, page, limit);
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

    const result = await this.reviewService.respondToReview(reviewId, req.user.id, req.body.message);
    res.status(200).json(result);
  });

  /**
   * Flag review as inappropriate
   */
  flagReview = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { reviewId } = req.params;

    const result = await this.reviewService.flagReview(reviewId, req.user.id, req.body.reason);
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await this.reviewService.getReviewsByUser(req.user.id, page, limit);
    res.status(200).json(result);
  });

  /**
   * Search reviews with filters
   */
  searchReviews = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const searchParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
      isVerified: req.query.isVerified ? req.query.isVerified === 'true' : undefined,
      providerId: req.query.providerId as string || undefined,
      userId: req.query.userId as string || undefined
    };

    const result = await this.reviewService.searchReviews(searchParams);
    res.status(200).json(result);
  });

  /**
   * Get review statistics for provider
   */
  getReviewStatistics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { providerId } = req.params;
    const result = await this.reviewService.getReviewStatistics(providerId);
    res.status(200).json(result);
  });
}
