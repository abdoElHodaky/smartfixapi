/**
 * Strategy-Based ReviewService Implementation
 * 
 * Enhanced ReviewService using Strategy Patterns for review operations
 * with optimized performance and maintainable conditional logic.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { Review } from '../../../models/Review';
import { ServiceRequest } from '../../../models/ServiceRequest';
import { ServiceProvider } from '../../../models/ServiceProvider';
import { User } from '../../../models/User';
import { ValidationError, AuthenticationError, NotFoundError } from '../../common/middleware/errorHandler';
import { IReviewService, IUserService, IProviderService, IServiceRequestService } from '../../common/interfaces/services/index';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

// Import optimization utilities
import { 
  AsyncStrategyRegistry
} from '../../utils/conditions/StrategyPatterns';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';

// Import strategy interfaces
import {
  ReviewOperationInput,
  ReviewSearchInput,
  ReviewModerationInput
} from '../../strategy/interfaces/ServiceStrategy';

// Import service decorators
import {
  Singleton,
  Service,
  Cached,
  Retryable,
  Log,
  PostConstruct,
  PreDestroy
} from '../../../decorators/service';

@Injectable()
@Singleton()
@Service({
  name: 'ReviewService',
  lazy: false,
  priority: 6
})
export class ReviewServiceStrategy implements IReviewService {
  private reviewActionRegistry: AsyncStrategyRegistry<ReviewOperationInput, any>;
  private moderationRegistry: AsyncStrategyRegistry<ReviewModerationInput, any>;
  private searchRegistry: AsyncStrategyRegistry<ReviewSearchInput, any>;

  constructor(
    @Inject('UserService') private userService: IUserService,
    @Inject('ProviderService') private providerService: IProviderService
  ) {
    this.initializeStrategies();
  }

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('🚀 Strategy-based ReviewService initialized with optimized patterns');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('🚀 Strategy-based ReviewService cleanup completed');
  }

  /**
   * Initialize all strategy registries
   */
  private initializeStrategies(): void {
    // Review action strategies
    this.reviewActionRegistry = new AsyncStrategyRegistry<ReviewOperationInput, any>();
    
    // Moderation strategies
    this.moderationRegistry = new AsyncStrategyRegistry<ReviewModerationInput, any>();
    
    // Search strategies
    this.searchRegistry = new AsyncStrategyRegistry<ReviewSearchInput, any>();
  }

  /**
   * Verify user permissions for review operations
   */
  private async verifyUserPermissions(userId: string, reviewId?: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('User account is inactive');
    }

    // If review is specified, verify user has access
    if (reviewId) {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new NotFoundError('Review not found');
      }

      const hasAccess = review.userId.toString() === userId || 
                       user.role === 'admin';
      
      if (!hasAccess) {
        throw new AuthenticationError('Access denied to review');
      }
    }
  }

  /**
   * Validate service request exists and user can review it
   */
  async validateServiceRequest(serviceRequestId: string): Promise<boolean> {
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    return serviceRequest !== null && serviceRequest.status === 'approved';
  }

  /**
   * Create a new review
   */
  @Log({
    message: 'Creating new review',
    includeExecutionTime: true
  })
  async createReview(userId: string, reviewData: CreateReviewDto): Promise<ApiResponseDto> {
    try {
      await this.verifyUserPermissions(userId);

      // Validate service request exists and is completed
      const serviceRequest = await ServiceRequest.findById(reviewData.serviceRequestId);
      if (!serviceRequest) {
        throw new NotFoundError('Service request not found');
      }

      if (serviceRequest.status !== 'approved') {
        throw new ValidationError('Can only review approved service requests');
      }

      if (serviceRequest.userId.toString() !== userId) {
        throw new AuthenticationError('Can only review your own service requests');
      }

      // Check if review already exists
      const existingReview = await Review.findOne({
        serviceRequestId: reviewData.serviceRequestId,
        userId
      });

      if (existingReview) {
        throw new ValidationError('Review already exists for this service request');
      }

      // Validate rating
      if (reviewData.rating < 1 || reviewData.rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
      }

      const review = new Review({
        userId,
        providerId: serviceRequest.assignedProvider,
        serviceRequestId: reviewData.serviceRequestId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await review.save();

      // Update provider's average rating
      await this.updateProviderRating(serviceRequest.assignedProvider.toString());

      return {
        success: true,
        message: 'Review created successfully',
        data: review
      };
    } catch (error: any) {
      throw new ValidationError(`Failed to create review: ${error.message}`);
    }
  }

  /**
   * Get review by ID
   */
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getReviewById(reviewId: string): Promise<any> {
    const review = await Review.findById(reviewId)
      .populate('userId', 'firstName lastName profilePicture')
      .populate('providerId', 'businessName')
      .populate('serviceRequestId', 'title serviceType')
      .lean();

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return review;
  }

  /**
   * Update review
   */
  @Log({
    message: 'Updating review',
    includeExecutionTime: true
  })
  async updateReview(reviewId: string, userId: string, updateData: UpdateReviewDto): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(userId, reviewId);

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.userId.toString() !== userId) {
      throw new AuthenticationError('Can only update your own reviews');
    }

    // Validate rating if provided
    if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    );

    // Update provider's average rating if rating changed
    if (updateData.rating && updateData.rating !== review.rating) {
      await this.updateProviderRating(review.providerId.toString());
    }

    return {
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    };
  }

  /**
   * Delete review
   */
  @Log({
    message: 'Deleting review',
    includeExecutionTime: true
  })
  async deleteReview(reviewId: string, userId: string): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(userId, reviewId);

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    const user = await this.userService.getUserById(userId);
    if (review.userId.toString() !== userId && user.role !== 'admin') {
      throw new AuthenticationError('Can only delete your own reviews or admin can delete any review');
    }

    const providerId = review.providerId.toString();
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
   * Search reviews with filters
   */
  async searchReviews(filters: ReviewFiltersDto): Promise<PaginatedResponseDto<any>> {
    const query: any = {};

    if (filters.providerId) {
      query.providerId = filters.providerId;
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.serviceRequestId) {
      query.serviceRequestId = filters.serviceRequestId;
    }

    if (filters.minRating || filters.maxRating) {
      query.rating = {};
      if (filters.minRating) query.rating.$gte = filters.minRating;
      if (filters.maxRating) query.rating.$lte = filters.maxRating;
    }

    if (filters.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }

    if (filters.searchTerm) {
      query.comment = { $regex: filters.searchTerm, $options: 'i' };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const [reviews, totalCount] = await Promise.all([
      Review.find(query)
        .populate('userId', 'firstName lastName profilePicture')
        .populate('providerId', 'businessName')
        .populate('serviceRequestId', 'title serviceType')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Get reviews by provider
   */
  async getReviewsByProvider(
    providerId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    return this.searchReviews({
      providerId,
      page,
      limit
    });
  }

  /**
   * Get reviews by user
   */
  async getReviewsByUser(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    return this.searchReviews({
      userId,
      page,
      limit
    });
  }

  /**
   * Get reviews by service request
   */
  async getReviewsByServiceRequest(
    serviceRequestId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    return this.searchReviews({
      serviceRequestId,
      page,
      limit
    });
  }

  /**
   * Respond to review (provider)
   */
  async respondToReview(reviewId: string, providerId: string, response: string): Promise<ApiResponseDto> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.providerId.toString() !== providerId) {
      throw new AuthenticationError('Can only respond to reviews for your services');
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        providerResponse: response,
        responseDate: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    return {
      success: true,
      message: 'Response added to review successfully',
      data: updatedReview
    };
  }

  /**
   * Flag review as inappropriate
   */
  async flagReview(reviewId: string, userId: string, reason: string): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(userId);

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (!review.flags) {
      review.flags = [];
    }

    // Check if user already flagged this review
    const existingFlag = review.flags.find(flag => flag.userId.toString() === userId);
    if (existingFlag) {
      throw new ValidationError('You have already flagged this review');
    }

    review.flags.push({
      userId,
      reason,
      flaggedAt: new Date()
    });

    await review.save();

    return {
      success: true,
      message: 'Review flagged successfully',
      data: null
    };
  }

  /**
   * Get review statistics for provider - Optimized aggregation
   */
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getProviderReviewStatistics(providerId: string): Promise<any> {
    // Optimized aggregation with facet for multiple statistics in single query
    const stats = await Review.aggregate([
      { $match: { 
        providerId: providerId,
        rating: { $exists: true, $gte: 1, $lte: 5 } // Valid ratings only
      }},
      {
        $facet: {
          overallStats: [
            {
              $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                minRating: { $min: '$rating' },
                maxRating: { $max: '$rating' }
              }
            }
          ],
          ratingDistribution: [
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ],
          recentTrends: [
            { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
            {
              $group: {
                _id: null,
                recentAverageRating: { $avg: '$rating' },
                recentReviewCount: { $sum: 1 }
              }
            }
          ],
          monthlyBreakdown: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 } // Last 12 months
          ]
        }
      }
    ]);

    if (!stats.length || !stats[0].overallStats.length) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentTrends: { recentAverageRating: 0, recentReviewCount: 0 },
        monthlyBreakdown: []
      };
    }

    const result = stats[0];
    const overallStats = result.overallStats[0];
    
    // Build rating distribution with all ratings 1-5
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.ratingDistribution.forEach((item: any) => {
      ratingDistribution[item._id] = item.count;
    });

    const recentTrends = result.recentTrends[0] || { 
      recentAverageRating: 0, 
      recentReviewCount: 0 
    };

    return {
      averageRating: Math.round(overallStats.averageRating * 100) / 100,
      totalReviews: overallStats.totalReviews,
      minRating: overallStats.minRating,
      maxRating: overallStats.maxRating,
      ratingDistribution,
      recentTrends: {
        recentAverageRating: Math.round(recentTrends.recentAverageRating * 100) / 100,
        recentReviewCount: recentTrends.recentReviewCount,
        trend: recentTrends.recentAverageRating > overallStats.averageRating ? 'improving' : 
               recentTrends.recentAverageRating < overallStats.averageRating ? 'declining' : 'stable'
      },
      monthlyBreakdown: result.monthlyBreakdown.map((month: any) => ({
        year: month._id.year,
        month: month._id.month,
        averageRating: Math.round(month.averageRating * 100) / 100,
        reviewCount: month.reviewCount
      }))
    };
  }

  /**
   * Verify review (admin)
   */
  async verifyReview(reviewId: string): Promise<ApiResponseDto> {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        isVerified: true,
        verifiedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return {
      success: true,
      message: 'Review verified successfully',
      data: review
    };
  }

  /**
   * Get pending reviews for moderation
   */
  async getPendingReviews(page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<any>> {
    return this.searchReviews({
      isVerified: false,
      page,
      limit
    });
  }

  /**
   * Calculate provider rating from reviews
   */
  async calculateProviderRating(providerId: string): Promise<{ average: number; count: number }> {
    const stats = await Review.aggregate([
      { $match: { providerId: providerId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (!stats.length) {
      return { average: 0, count: 0 };
    }

    return {
      average: Math.round(stats[0].averageRating * 100) / 100,
      count: stats[0].count
    };
  }

  /**
   * Update provider's average rating
   */
  private async updateProviderRating(providerId: string): Promise<void> {
    const { average, count } = await this.calculateProviderRating(providerId);
    
    await ServiceProvider.findByIdAndUpdate(providerId, {
      rating: average,
      reviewCount: count
    });
  }

  /**
   * Get all reviews (admin function)
   */
  async getAllReviews(filters: ReviewFiltersDto): Promise<PaginatedResponseDto<any>> {
    return this.searchReviews(filters);
  }

  /**
   * Moderate review (admin function)
   */
  async moderateReview(reviewId: string, action: string, reason?: string): Promise<ApiResponseDto> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    let updateData: any = {
      updatedAt: new Date()
    };

    switch (action) {
      case 'approve':
        updateData.isVerified = true;
        updateData.verifiedAt = new Date();
        break;
      case 'reject':
        updateData.isVerified = false;
        updateData.moderationReason = reason;
        updateData.moderatedAt = new Date();
        break;
      case 'hide':
        updateData.isHidden = true;
        updateData.moderationReason = reason;
        updateData.moderatedAt = new Date();
        break;
      case 'unhide':
        updateData.isHidden = false;
        break;
      default:
        throw new ValidationError('Invalid moderation action');
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      updateData,
      { new: true }
    );

    return {
      success: true,
      message: `Review ${action}ed successfully`,
      data: updatedReview
    };
  }

  /**
   * Get reviews by user ID (alias for getReviewsByUser)
   */
  async getReviewsByUserId(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    return this.getReviewsByUser(userId, page, limit);
  }

  /**
   * Get reviews by provider ID (alias for getReviewsByProvider)
   */
  async getReviewsByProviderId(
    providerId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    return this.getReviewsByProvider(providerId, page, limit);
  }

  /**
   * Get reviews by service request ID (alias for getReviewsByServiceRequest)
   */
  async getReviewsByServiceRequestId(
    serviceRequestId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    return this.getReviewsByServiceRequest(serviceRequestId, page, limit);
  }

  /**
   * Get review statistics (alias for getProviderReviewStatistics)
   */
  async getReviewStatistics(providerId: string): Promise<any> {
    return this.getProviderReviewStatistics(providerId);
  }
}
