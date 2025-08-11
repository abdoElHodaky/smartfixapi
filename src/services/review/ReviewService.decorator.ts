/**
 * Decorator-Based ReviewService
 * 
 * Modern implementation of review service using decorators for
 * enhanced functionality including caching, logging, retry logic, and validation.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { Review } from '../../models/Review';
import { ServiceRequest } from '../../models/ServiceRequest';
import { ServiceProvider } from '../../models/ServiceProvider';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { IReviewService, IServiceRequestService, IProviderService } from '../../interfaces/services';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto,
  ReviewStatisticsDto
} from '../../dtos';

// Import service decorators
import {
  Singleton,
  Service,
  Cached,
  Retryable,
  Log,
  Validate,
  PostConstruct,
  PreDestroy
} from '../../decorators/service';

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 5
})
export class ReviewService implements IReviewService {
  constructor(
    @Inject('ServiceRequestService') private serviceRequestService: IServiceRequestService,
    @Inject('ProviderService') private providerService: IProviderService
  ) {}

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('⭐ ReviewService initialized with decorator-based architecture');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('⭐ ReviewService cleanup completed');
  }

  /**
   * Create a new review with comprehensive validation and logging
   */
  @Log({
    message: 'Creating review',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 2000,
    condition: (error: Error) => error.message.includes('database')
  })
  async createReview(userId: string, reviewData: CreateReviewDto): Promise<ApiResponseDto> {
    try {
      // Validate review data
      if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
      }

      if (!reviewData.comment || reviewData.comment.trim().length < 10) {
        throw new ValidationError('Comment must be at least 10 characters long');
      }

      // Verify service request exists and is completed
      const serviceRequest = await this.serviceRequestService.getServiceRequestById(reviewData.serviceRequestId);
      
      if (serviceRequest.userId.toString() !== userId) {
        throw new ValidationError('You can only review your own service requests');
      }

      if (serviceRequest.status !== 'completed') {
        throw new ValidationError('You can only review completed service requests');
      }

      // Check if review already exists
      const existingReview = await Review.findOne({
        userId,
        serviceRequestId: reviewData.serviceRequestId
      });

      if (existingReview) {
        throw new ValidationError('You have already reviewed this service');
      }

      const review = new Review({
        ...reviewData,
        userId,
        providerId: serviceRequest.providerId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await review.save();

      // Update provider's average rating
      await this.updateProviderRating(serviceRequest.providerId);

      return {
        success: true,
        message: 'Review created successfully',
        data: review
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ValidationError('Failed to create review');
    }
  }

  /**
   * Get review by ID with caching
   */
  @Log('Getting review by ID')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  @Retryable({
    attempts: 3,
    delay: 1000,
    condition: (error: Error) => error.message.includes('database')
  })
  async getReviewById(reviewId: string): Promise<any> {
    const review = await Review.findById(reviewId)
      .populate('userId', 'firstName lastName profileImage')
      .populate('providerId', 'businessName userId')
      .populate('serviceRequestId', 'title category');

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return review;
  }

  /**
   * Update review with validation
   */
  @Log({
    message: 'Updating review',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 2,
    delay: 1500,
    condition: (error: Error) => error.message.includes('database')
  })
  async updateReview(reviewId: string, userId: string, updateData: UpdateReviewDto): Promise<ApiResponseDto> {
    try {
      const review = await Review.findById(reviewId);
      
      if (!review) {
        throw new NotFoundError('Review not found');
      }

      if (review.userId.toString() !== userId) {
        throw new ValidationError('You can only update your own reviews');
      }

      // Validate update data
      if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        throw new ValidationError('Rating must be between 1 and 5');
      }

      if (updateData.comment && updateData.comment.trim().length < 10) {
        throw new ValidationError('Comment must be at least 10 characters long');
      }

      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('userId', 'firstName lastName profileImage')
       .populate('providerId', 'businessName userId')
       .populate('serviceRequestId', 'title category');

      // Update provider's average rating if rating changed
      if (updateData.rating) {
        await this.updateProviderRating(review.providerId);
      }

      return {
        success: true,
        message: 'Review updated successfully',
        data: updatedReview
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ValidationError('Failed to update review');
    }
  }

  /**
   * Delete review with validation
   */
  @Log('Deleting review')
  @Retryable(2)
  async deleteReview(reviewId: string, userId: string): Promise<ApiResponseDto> {
    const review = await Review.findById(reviewId);
    
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.userId.toString() !== userId) {
      throw new ValidationError('You can only delete your own reviews');
    }

    const providerId = review.providerId;
    await Review.findByIdAndDelete(reviewId);

    // Update provider's average rating
    await this.updateProviderRating(providerId);

    return {
      success: true,
      message: 'Review deleted successfully',
      data: null
    };
  }

  /**
   * Get reviews by provider with caching
   */
  @Log('Getting provider reviews')
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  @Retryable(2)
  async getProviderReviews(providerId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    try {
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        Review.find({ providerId })
          .populate('userId', 'firstName lastName profileImage')
          .populate('serviceRequestId', 'title category')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Review.countDocuments({ providerId })
      ]);

      return {
        success: true,
        message: 'Provider reviews retrieved successfully',
        data: reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new ValidationError('Failed to get provider reviews');
    }
  }

  /**
   * Get reviews by user with caching
   */
  @Log('Getting user reviews')
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  @Retryable(2)
  async getUserReviews(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    try {
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        Review.find({ userId })
          .populate('providerId', 'businessName userId')
          .populate('serviceRequestId', 'title category')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Review.countDocuments({ userId })
      ]);

      return {
        success: true,
        message: 'User reviews retrieved successfully',
        data: reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new ValidationError('Failed to get user reviews');
    }
  }

  /**
   * Search reviews with advanced filtering and caching
   */
  @Log('Searching reviews')
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  @Retryable(2)
  async searchReviews(filters: ReviewFiltersDto, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    try {
      const skip = (page - 1) * limit;
      let query: any = {};

      // Apply filters
      if (filters.providerId) {
        query.providerId = filters.providerId;
      }

      if (filters.userId) {
        query.userId = filters.userId;
      }

      if (filters.minRating) {
        query.rating = { $gte: filters.minRating };
      }

      if (filters.maxRating) {
        query.rating = { ...query.rating, $lte: filters.maxRating };
      }

      if (filters.searchTerm) {
        query.comment = { $regex: filters.searchTerm, $options: 'i' };
      }

      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      // Execute query
      const [reviews, total] = await Promise.all([
        Review.find(query)
          .populate('userId', 'firstName lastName profileImage')
          .populate('providerId', 'businessName userId')
          .populate('serviceRequestId', 'title category')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Review.countDocuments(query)
      ]);

      return {
        success: true,
        message: 'Reviews retrieved successfully',
        data: reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new ValidationError('Failed to search reviews');
    }
  }

  /**
   * Get review statistics with caching
   */
  @Log('Getting review statistics')
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getReviewStatistics(providerId?: string): Promise<ReviewStatisticsDto> {
    try {
      let query: any = {};
      if (providerId) {
        query.providerId = providerId;
      }

      const [
        totalReviews,
        averageRating,
        ratingDistribution
      ] = await Promise.all([
        Review.countDocuments(query),
        Review.aggregate([
          { $match: query },
          { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]),
        Review.aggregate([
          { $match: query },
          { $group: { _id: '$rating', count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ])
      ]);

      const avgRating = averageRating.length > 0 ? averageRating[0].avgRating : 0;
      
      // Create rating distribution object
      const distribution: { [key: number]: number } = {};
      for (let i = 1; i <= 5; i++) {
        distribution[i] = 0;
      }
      
      ratingDistribution.forEach(item => {
        distribution[item._id] = item.count;
      });

      return {
        totalReviews,
        averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
        ratingDistribution: distribution,
        fiveStarPercentage: totalReviews > 0 ? (distribution[5] / totalReviews) * 100 : 0,
        fourStarAndAbovePercentage: totalReviews > 0 ? ((distribution[4] + distribution[5]) / totalReviews) * 100 : 0
      };
    } catch (error) {
      throw new ValidationError('Failed to get review statistics');
    }
  }

  /**
   * Get recent reviews with caching
   */
  @Log('Getting recent reviews')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getRecentReviews(limit: number = 10): Promise<ApiResponseDto> {
    try {
      const reviews = await Review.find()
        .populate('userId', 'firstName lastName profileImage')
        .populate('providerId', 'businessName userId')
        .populate('serviceRequestId', 'title category')
        .limit(limit)
        .sort({ createdAt: -1 });

      return {
        success: true,
        message: 'Recent reviews retrieved successfully',
        data: reviews
      };
    } catch (error) {
      throw new ValidationError('Failed to get recent reviews');
    }
  }

  /**
   * Update provider's average rating
   */
  @Log('Updating provider rating')
  @Retryable(3)
  private async updateProviderRating(providerId: string): Promise<void> {
    try {
      const stats = await this.getReviewStatistics(providerId);
      
      await ServiceProvider.findByIdAndUpdate(providerId, {
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to update provider rating:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Get top rated providers with caching
   */
  @Log('Getting top rated providers')
  @Cached(15 * 60 * 1000) // Cache for 15 minutes
  async getTopRatedProviders(limit: number = 10): Promise<ApiResponseDto> {
    try {
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

      return {
        success: true,
        message: 'Top rated providers retrieved successfully',
        data: topProviders
      };
    } catch (error) {
      throw new ValidationError('Failed to get top rated providers');
    }
  }

  /**
   * Flag review for moderation
   */
  @Log('Flagging review for moderation')
  @Retryable(2)
  async flagReview(reviewId: string, reason: string, reportedBy: string): Promise<ApiResponseDto> {
    try {
      const review = await Review.findById(reviewId);
      
      if (!review) {
        throw new NotFoundError('Review not found');
      }

      // Add flag to review
      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        {
          $push: {
            flags: {
              reason,
              reportedBy,
              reportedAt: new Date()
            }
          },
          flagged: true,
          updatedAt: new Date()
        },
        { new: true }
      );

      return {
        success: true,
        message: 'Review flagged for moderation',
        data: updatedReview
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ValidationError('Failed to flag review');
    }
  }
}

