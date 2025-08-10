import { Response } from 'express';
import { Review } from '../../models/Review';
import { ServiceRequest } from '../../models/ServiceRequest';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ReviewService } from '../../services/review/ReviewService';
import { AuthRequest } from '../../types';
import { asyncHandler, NotFoundError, ValidationError, AuthorizationError } from '../../middleware/errorHandler';

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

    const { serviceRequestId, rating, title, comment, images } = req.body;

    // Check if service request exists and is completed
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Check if user owns this service request
    if (serviceRequest.userId.toString() !== req.user.id) {
      throw new AuthorizationError('You can only review services you have requested');
    }

    // Check if service is completed and approved
    if (serviceRequest.status !== 'completed' || !serviceRequest.completion.customerApproval) {
      throw new ValidationError('You can only review completed and approved services');
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ serviceRequestId });
    if (existingReview) {
      throw new ValidationError('You have already reviewed this service');
    }

    if (!serviceRequest.providerId) {
      throw new ValidationError('No provider assigned to this service request');
    }

    // Create the review
    const review = new Review({
      serviceRequestId,
      userId: req.user.id,
      providerId: serviceRequest.providerId,
      rating,
      title,
      comment,
      images: images || []
    });

    await review.save();

    // Update provider's rating
    const provider = await ServiceProvider.findById(serviceRequest.providerId);
    if (provider) {
      await provider.updateRating(rating);
    }

    // Populate the review for response
    await review.populate([
      { path: 'userId', select: 'firstName lastName profileImage' },
      { path: 'serviceRequest', select: 'title category' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  });

  /**
   * Get review by ID
   */
  getReviewById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate('userId', 'firstName lastName profileImage')
      .populate('providerId', 'businessName')
      .populate('serviceRequest', 'title category');

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    res.status(200).json({
      success: true,
      message: 'Review retrieved successfully',
      data: review
    });
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
    const { rating, title, comment, images } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if user owns this review
    if (review.userId.toString() !== req.user.id) {
      throw new AuthorizationError('You can only update your own reviews');
    }

    // Update the review
    const oldRating = review.rating;
    review.rating = rating;
    review.title = title;
    review.comment = comment;
    review.images = images || review.images;
    
    await review.save();

    // Update provider's rating if rating changed
    if (oldRating !== rating) {
      const provider = await ServiceProvider.findById(review.providerId);
      if (provider) {
        // Recalculate provider's average rating
        const ratingData = await Review.getProviderAverageRating(provider._id.toString());
        provider.rating.average = ratingData.averageRating;
        provider.rating.count = ratingData.totalReviews;
        await provider.save();
      }
    }

    await review.populate([
      { path: 'userId', select: 'firstName lastName profileImage' },
      { path: 'serviceRequest', select: 'title category' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
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

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if user owns this review or is admin
    if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AuthorizationError('You can only delete your own reviews');
    }

    await Review.findByIdAndDelete(reviewId);

    // Update provider's rating after deletion
    const provider = await ServiceProvider.findById(review.providerId);
    if (provider) {
      const ratingData = await Review.getProviderAverageRating(provider._id.toString());
      provider.rating.average = ratingData.averageRating;
      provider.rating.count = ratingData.totalReviews;
      await provider.save();
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  });

  /**
   * Get reviews for a provider
   */
  getProviderReviews = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { providerId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const rating = req.query.rating as string;
    const skip = (page - 1) * limit;

    const filter: any = { providerId };
    if (rating) {
      filter.rating = parseInt(rating);
    }

    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName profileImage')
      .populate('serviceRequest', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    // Get rating statistics
    const ratingStats = await Review.getProviderAverageRating(providerId);

    res.status(200).json({
      success: true,
      message: 'Provider reviews retrieved successfully',
      data: {
        reviews,
        ratingStats
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  });

  /**
   * Add provider response to review
   */
  addProviderResponse = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const { reviewId } = req.params;
    const { message } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if provider owns the service that was reviewed
    const provider = await ServiceProvider.findOne({ userId: req.user.id });
    if (!provider || review.providerId.toString() !== provider._id.toString()) {
      throw new AuthorizationError('You can only respond to reviews for your services');
    }

    // Check if response already exists
    if (review.response) {
      throw new ValidationError('You have already responded to this review');
    }

    await review.addResponse(message);

    await review.populate([
      { path: 'userId', select: 'firstName lastName profileImage' },
      { path: 'serviceRequest', select: 'title category' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: review
    });
  });

  /**
   * Mark review as helpful/not helpful
   */
  markHelpful = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { reviewId } = req.params;
    const { helpful } = req.body; // boolean

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    await review.markHelpful(helpful);

    res.status(200).json({
      success: true,
      message: `Review marked as ${helpful ? 'helpful' : 'not helpful'}`,
      data: {
        isHelpful: review.isHelpful,
        helpfulnessRatio: review.helpfulnessRatio
      }
    });
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
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ userId: req.user.id })
      .populate('providerId', 'businessName')
      .populate('serviceRequest', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ userId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'User reviews retrieved successfully',
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  });

  /**
   * Get recent reviews (public endpoint)
   */
  getRecentReviews = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 10;
    const minRating = parseInt(req.query.minRating as string) || 1;

    const filter: any = { 
      rating: { $gte: minRating },
      isVerified: true 
    };

    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName profileImage')
      .populate('providerId', 'businessName')
      .populate('serviceRequest', 'title category')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Recent reviews retrieved successfully',
      data: reviews
    });
  });

  /**
   * Get review statistics
   */
  getReviewStatistics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const [
      totalReviews,
      averageRating,
      ratingDistribution,
      verifiedReviews,
      reviewsWithResponse
    ] = await Promise.all([
      Review.countDocuments(),
      Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]),
      Review.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Review.countDocuments({ isVerified: true }),
      Review.countDocuments({ response: { $exists: true } })
    ]);

    const stats = {
      totalReviews,
      averageRating: averageRating[0]?.avgRating || 0,
      ratingDistribution: ratingDistribution.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      verifiedReviews,
      reviewsWithResponse,
      responseRate: totalReviews > 0 ? (reviewsWithResponse / totalReviews) * 100 : 0
    };

    res.status(200).json({
      success: true,
      message: 'Review statistics retrieved successfully',
      data: stats
    });
  });
}
