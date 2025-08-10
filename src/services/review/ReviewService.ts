import { Review } from '../../models/Review';
import { ServiceRequest } from '../../models/ServiceRequest';
import { ServiceProvider } from '../../models/ServiceProvider';
import { NotFoundError, ValidationError, AuthorizationError } from '../../middleware/errorHandler';

export interface ReviewData {
  serviceRequestId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

export interface ReviewFilters {
  providerId?: string;
  userId?: string;
  rating?: number;
  isVerified?: boolean;
  page?: number;
  limit?: number;
}

export interface ReviewUpdateData {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export class ReviewService {
  /**
   * Create a new review
   */
  static async createReview(userId: string, reviewData: ReviewData): Promise<any> {
    const { serviceRequestId, rating, title, comment, images } = reviewData;

    // Check if service request exists and is completed
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Check if user owns this service request
    if (serviceRequest.userId.toString() !== userId) {
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
      userId,
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

    return review;
  }

  /**
   * Get review by ID
   */
  static async getReviewById(reviewId: string): Promise<any> {
    const review = await Review.findById(reviewId)
      .populate('userId', 'firstName lastName profileImage')
      .populate('providerId', 'businessName')
      .populate('serviceRequest', 'title category');

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return review;
  }

  /**
   * Update review
   */
  static async updateReview(
    reviewId: string, 
    userId: string, 
    updateData: ReviewUpdateData
  ): Promise<any> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if user owns this review
    if (review.userId.toString() !== userId) {
      throw new AuthorizationError('You can only update your own reviews');
    }

    // Update the review
    const oldRating = review.rating;
    Object.assign(review, updateData);
    await review.save();

    // Update provider's rating if rating changed
    if (oldRating !== updateData.rating && updateData.rating) {
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

    return review;
  }

  /**
   * Delete review
   */
  static async deleteReview(reviewId: string, userId: string, userRole: string): Promise<void> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if user owns this review or is admin
    if (review.userId.toString() !== userId && userRole !== 'admin') {
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
  }

  /**
   * Get reviews for a provider
   */
  static async getProviderReviews(
    providerId: string, 
    page: number = 1, 
    limit: number = 10, 
    rating?: number
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = { providerId };
    
    if (rating) {
      filter.rating = rating;
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

    return {
      reviews,
      ratingStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Add provider response to review
   */
  static async addProviderResponse(
    reviewId: string, 
    providerId: string, 
    message: string
  ): Promise<any> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if provider owns the service that was reviewed
    if (review.providerId.toString() !== providerId) {
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

    return review;
  }

  /**
   * Mark review as helpful/not helpful
   */
  static async markHelpful(reviewId: string, helpful: boolean): Promise<any> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    await review.markHelpful(helpful);

    return {
      isHelpful: review.isHelpful,
      helpfulnessRatio: review.helpfulnessRatio
    };
  }

  /**
   * Get user's reviews (reviews they've written)
   */
  static async getUserReviews(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ userId })
      .populate('providerId', 'businessName')
      .populate('serviceRequest', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ userId });

    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get recent reviews (public endpoint)
   */
  static async getRecentReviews(
    limit: number = 10, 
    minRating: number = 1
  ): Promise<any[]> {
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

    return reviews;
  }

  /**
   * Get review statistics
   */
  static async getReviewStatistics(): Promise<any> {
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

    return {
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
  }

  /**
   * Search reviews
   */
  static async searchReviews(filters: ReviewFilters): Promise<any> {
    const { 
      providerId, 
      userId, 
      rating, 
      isVerified, 
      page = 1, 
      limit = 10 
    } = filters;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (providerId) filter.providerId = providerId;
    if (userId) filter.userId = userId;
    if (rating) filter.rating = rating;
    if (isVerified !== undefined) filter.isVerified = isVerified;

    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName profileImage')
      .populate('providerId', 'businessName')
      .populate('serviceRequest', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Verify/unverify review (admin only)
   */
  static async toggleReviewVerification(reviewId: string, isVerified: boolean): Promise<any> {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isVerified },
      { new: true }
    ).populate('userId', 'firstName lastName')
     .populate('providerId', 'businessName');

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return review;
  }

  /**
   * Get top-rated providers based on reviews
   */
  static async getTopRatedProviders(limit: number = 10): Promise<any[]> {
    const topProviders = await Review.aggregate([
      {
        $group: {
          _id: '$providerId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      },
      {
        $match: {
          totalReviews: { $gte: 5 }, // At least 5 reviews
          averageRating: { $gte: 4.0 } // At least 4.0 rating
        }
      },
      {
        $sort: { averageRating: -1, totalReviews: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'serviceproviders',
          localField: '_id',
          foreignField: '_id',
          as: 'provider'
        }
      },
      {
        $unwind: '$provider'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'provider.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      }
    ]);

    return topProviders;
  }

  /**
   * Validate review data
   */
  static validateReviewData(reviewData: ReviewData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!reviewData.serviceRequestId) {
      errors.push('Service request ID is required');
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }

    if (!reviewData.title || reviewData.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters long');
    }

    if (reviewData.title && reviewData.title.length > 100) {
      errors.push('Title cannot exceed 100 characters');
    }

    if (!reviewData.comment || reviewData.comment.trim().length < 10) {
      errors.push('Comment must be at least 10 characters long');
    }

    if (reviewData.comment && reviewData.comment.length > 1000) {
      errors.push('Comment cannot exceed 1000 characters');
    }

    if (reviewData.images && !Array.isArray(reviewData.images)) {
      errors.push('Images must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

