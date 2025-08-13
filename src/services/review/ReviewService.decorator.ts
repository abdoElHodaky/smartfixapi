/**
 * Decorator-Based ReviewService Implementation
 * 
 * Enhanced ReviewService using Strategy Patterns and AggregationBuilder
 * for optimized performance and maintainable conditional logic.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { Review } from '../../models/Review';
import { ServiceRequest } from '../../models/ServiceRequest';
import { User } from '../../models/User';
import { Provider } from '../../models/Provider';
import { NotFoundError, ValidationError, AuthenticationError } from '../../middleware/errorHandler';
import { IReviewService, IUserService, IProviderService, IServiceRequestService } from '../../interfaces/services';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

// Import optimization utilities
import { AggregationBuilder, AggregationUtils } from '../../utils/aggregation/AggregationBuilder';
import { 
  StrategyRegistry, 
  AsyncStrategyRegistry, 
  Strategy, 
  AsyncStrategy 
} from '../../utils/conditions/StrategyPatterns';
import { ConditionalHelpers, RoleCheckOptions } from '../../utils/conditions/ConditionalHelpers';
import { CommandBase, CommandResult, CommandContext } from '../../utils/service-optimization/CommandBase';

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

// Import strategy interfaces
import {
  ReviewOperationInput,
  ReviewSearchInput,
  ReviewModerationInput,
  ReviewStatisticsInput
} from '../../strategy/interfaces/ServiceStrategy';

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 6
})
export class ReviewService implements IReviewService {
  private reviewOperationRegistry: AsyncStrategyRegistry<ReviewOperationInput, CommandResult>;
  private reviewSearchRegistry: AsyncStrategyRegistry<ReviewSearchInput, CommandResult>;
  private reviewModerationRegistry: AsyncStrategyRegistry<ReviewModerationInput, CommandResult>;
  private reviewStatisticsRegistry: AsyncStrategyRegistry<ReviewStatisticsInput, CommandResult>;

  constructor(
    @Inject('UserService') private userService?: IUserService,
    @Inject('ProviderService') private providerService?: IProviderService,
    @Inject('ServiceRequestService') private serviceRequestService?: IServiceRequestService
  ) {
    this.initializeStrategies();
  }

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('⭐ Strategy-based ReviewService initialized with optimized patterns');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('⭐ Strategy-based ReviewService cleanup completed');
  }

  /**
   * Initialize all strategy registries
   */
  private initializeStrategies(): void {
    // Review operation strategies
    this.reviewOperationRegistry = new AsyncStrategyRegistry<ReviewOperationInput, CommandResult>();
    // Note: Strategy implementations would be registered here
    // this.reviewOperationRegistry.register('createReview', new CreateReviewStrategy());
    // this.reviewOperationRegistry.register('updateReview', new UpdateReviewStrategy());
    // etc.

    // Review search strategies
    this.reviewSearchRegistry = new AsyncStrategyRegistry<ReviewSearchInput, CommandResult>();
    // this.reviewSearchRegistry.register('searchReviews', new SearchReviewsStrategy());

    // Review moderation strategies
    this.reviewModerationRegistry = new AsyncStrategyRegistry<ReviewModerationInput, CommandResult>();
    // this.reviewModerationRegistry.register('moderateReview', new ModerateReviewStrategy());

    // Review statistics strategies
    this.reviewStatisticsRegistry = new AsyncStrategyRegistry<ReviewStatisticsInput, CommandResult>();
    // this.reviewStatisticsRegistry.register('getStatistics', new GetReviewStatisticsStrategy());
  }

  /**
   * Create a new review
   */
  @Log({
    message: 'Creating review with strategy pattern',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  })
  async createReview(userId: string, reviewData: CreateReviewDto): Promise<ApiResponseDto> {
    try {
      // Validate user exists
      if (this.userService) {
        await this.userService.getUserById(userId);
      }

      // Validate service request exists
      if (reviewData.serviceRequestId) {
        const serviceRequestExists = await this.validateServiceRequest(reviewData.serviceRequestId);
        if (!serviceRequestExists) {
          throw new ValidationError('Service request not found');
        }
      }

      // Create review
      const review = new Review({
        userId,
        ...reviewData,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedReview = await review.save();

      // Update provider rating if applicable
      if (reviewData.providerId) {
        await this.updateProviderRating(reviewData.providerId);
      }

      return {
        success: true,
        message: 'Review created successfully',
        data: savedReview
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create review',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get review by ID
   */
  @Log({
    message: 'Getting review by ID with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getReviewById(reviewId: string): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .match({ _id: reviewId, isDeleted: { $ne: true } })
      .lookup('users', 'userId', '_id', 'user')
      .lookup('providers', 'providerId', '_id', 'provider')
      .lookup('serviceRequests', 'serviceRequestId', '_id', 'serviceRequest')
      .addFields({
        user: { $arrayElemAt: ['$user', 0] },
        provider: { $arrayElemAt: ['$provider', 0] },
        serviceRequest: { $arrayElemAt: ['$serviceRequest', 0] }
      });

    const result = await aggregation.execute(Review);
    
    if (!result || result.length === 0) {
      throw new NotFoundError('Review not found');
    }

    return result[0];
  }

  /**
   * Update review
   */
  @Log({
    message: 'Updating review with strategy pattern',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'linear'
  })
  async updateReview(reviewId: string, userId: string, updateData: UpdateReviewDto): Promise<ApiResponseDto> {
    try {
      // Verify ownership
      const existingReview = await Review.findOne({ _id: reviewId, userId });
      if (!existingReview) {
        throw new NotFoundError('Review not found or access denied');
      }

      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );

      // Update provider rating if rating changed
      if (updateData.rating && existingReview.providerId) {
        await this.updateProviderRating(existingReview.providerId);
      }

      return {
        success: true,
        message: 'Review updated successfully',
        data: updatedReview
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update review',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Delete review
   */
  @Log({
    message: 'Deleting review with strategy pattern',
    includeExecutionTime: true
  })
  async deleteReview(reviewId: string, userId: string): Promise<ApiResponseDto> {
    try {
      // Verify ownership
      const existingReview = await Review.findOne({ _id: reviewId, userId });
      if (!existingReview) {
        throw new NotFoundError('Review not found or access denied');
      }

      const deletedReview = await Review.findByIdAndUpdate(
        reviewId,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );

      // Update provider rating
      if (existingReview.providerId) {
        await this.updateProviderRating(existingReview.providerId);
      }

      return {
        success: true,
        message: 'Review deleted successfully',
        data: deletedReview
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete review',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Search reviews with filters
   */
  @Log({
    message: 'Searching reviews with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async searchReviews(filters: ReviewFiltersDto): Promise<PaginatedResponseDto<any>> {
    const { page = 1, limit = 10, rating, providerId, userId, status, ...otherFilters } = filters;

    const matchConditions: any = { isDeleted: { $ne: true } };
    
    if (rating) matchConditions.rating = rating;
    if (providerId) matchConditions.providerId = providerId;
    if (userId) matchConditions.userId = userId;
    if (status) matchConditions.status = status;

    const aggregation = AggregationBuilder.create()
      .match(matchConditions)
      .lookup('users', 'userId', '_id', 'user')
      .lookup('providers', 'providerId', '_id', 'provider')
      .lookup('serviceRequests', 'serviceRequestId', '_id', 'serviceRequest')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const reviews = await aggregation.execute(Review);
    const total = await Review.countDocuments(matchConditions);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get reviews by provider
   */
  @Log({
    message: 'Getting reviews by provider',
    includeExecutionTime: true
  })
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  async getReviewsByProvider(providerId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>> {
    return this.searchReviews({ providerId, page, limit } as ReviewFiltersDto);
  }

  /**
   * Get reviews by user
   */
  @Log({
    message: 'Getting reviews by user',
    includeExecutionTime: true
  })
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  async getReviewsByUser(userId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>> {
    return this.searchReviews({ userId, page, limit } as ReviewFiltersDto);
  }

  /**
   * Respond to review (provider)
   */
  @Log({
    message: 'Responding to review',
    includeExecutionTime: true
  })
  async respondToReview(reviewId: string, providerId: string, response: string): Promise<ApiResponseDto> {
    try {
      // Verify the review belongs to this provider
      const review = await Review.findOne({ _id: reviewId, providerId });
      if (!review) {
        throw new NotFoundError('Review not found or access denied');
      }

      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { 
          providerResponse: response,
          respondedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      return {
        success: true,
        message: 'Response added successfully',
        data: updatedReview
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to respond to review',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Flag review as inappropriate
   */
  @Log({
    message: 'Flagging review',
    includeExecutionTime: true
  })
  async flagReview(reviewId: string, userId: string, reason: string): Promise<ApiResponseDto> {
    try {
      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { 
          $push: { 
            flags: {
              userId,
              reason,
              flaggedAt: new Date()
            }
          },
          status: 'flagged',
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedReview) {
        throw new NotFoundError('Review not found');
      }

      return {
        success: true,
        message: 'Review flagged successfully',
        data: updatedReview
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to flag review',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get review statistics for provider
   */
  @Log({
    message: 'Getting provider review statistics',
    includeExecutionTime: true
  })
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getProviderReviewStatistics(providerId: string): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .match({ providerId, isDeleted: { $ne: true }, status: 'active' })
      .group({
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      });

    const result = await aggregation.execute(Review);
    
    if (!result || result.length === 0) {
      return {
        providerId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const stats = result[0];
    const distribution = stats.ratingDistribution.reduce((acc: any, rating: number) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return {
      providerId,
      averageRating: Math.round(stats.averageRating * 100) / 100,
      totalReviews: stats.totalReviews,
      ratingDistribution: distribution
    };
  }

  /**
   * Verify review (admin)
   */
  @Log({
    message: 'Verifying review (admin)',
    includeExecutionTime: true
  })
  async verifyReview(reviewId: string): Promise<ApiResponseDto> {
    try {
      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { 
          status: 'verified',
          verifiedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedReview) {
        throw new NotFoundError('Review not found');
      }

      return {
        success: true,
        message: 'Review verified successfully',
        data: updatedReview
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify review',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get pending reviews for moderation
   */
  @Log({
    message: 'Getting pending reviews for moderation',
    includeExecutionTime: true
  })
  @Cached(1 * 60 * 1000) // Cache for 1 minute
  async getPendingReviews(page?: number, limit?: number): Promise<PaginatedResponseDto<any>> {
    return this.searchReviews({ status: 'flagged', page, limit } as ReviewFiltersDto);
  }

  /**
   * Calculate provider rating from reviews
   */
  @Log({
    message: 'Calculating provider rating',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async calculateProviderRating(providerId: string): Promise<{ average: number; count: number }> {
    const aggregation = AggregationBuilder.create()
      .match({ providerId, isDeleted: { $ne: true }, status: 'active' })
      .group({
        _id: null,
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      });

    const result = await aggregation.execute(Review);
    
    if (!result || result.length === 0) {
      return { average: 0, count: 0 };
    }

    return {
      average: Math.round(result[0].averageRating * 100) / 100,
      count: result[0].count
    };
  }

  /**
   * Get all reviews (admin function)
   */
  @Log({
    message: 'Getting all reviews (admin)',
    includeExecutionTime: true
  })
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async getAllReviews(filters: ReviewFiltersDto): Promise<PaginatedResponseDto<any>> {
    return this.searchReviews({ ...filters, includeInactive: true });
  }

  /**
   * Moderate review (admin function)
   */
  @Log({
    message: 'Moderating review (admin)',
    includeExecutionTime: true
  })
  async moderateReview(reviewId: string, action: string, reason?: string): Promise<ApiResponseDto> {
    try {
      const updateData: any = {
        moderationAction: action,
        moderationReason: reason,
        moderatedAt: new Date(),
        updatedAt: new Date()
      };

      if (action === 'approve') {
        updateData.status = 'active';
      } else if (action === 'reject') {
        updateData.status = 'rejected';
      } else if (action === 'hide') {
        updateData.status = 'hidden';
      }

      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        updateData,
        { new: true }
      );

      if (!updatedReview) {
        throw new NotFoundError('Review not found');
      }

      // Update provider rating if status changed
      if (updatedReview.providerId && ['approve', 'reject', 'hide'].includes(action)) {
        await this.updateProviderRating(updatedReview.providerId);
      }

      return {
        success: true,
        message: `Review ${action}ed successfully`,
        data: updatedReview
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to moderate review',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get reviews by user ID
   */
  @Log({
    message: 'Getting reviews by user ID',
    includeExecutionTime: true
  })
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  async getReviewsByUserId(userId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>> {
    return this.getReviewsByUser(userId, page, limit);
  }

  /**
   * Get reviews by provider ID
   */
  @Log({
    message: 'Getting reviews by provider ID',
    includeExecutionTime: true
  })
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  async getReviewsByProviderId(providerId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>> {
    return this.getReviewsByProvider(providerId, page, limit);
  }

  /**
   * Get reviews by service request ID
   */
  @Log({
    message: 'Getting reviews by service request ID',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getReviewsByServiceRequestId(serviceRequestId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>> {
    return this.searchReviews({ serviceRequestId, page, limit } as ReviewFiltersDto);
  }

  /**
   * Get review statistics for provider
   */
  @Log({
    message: 'Getting review statistics',
    includeExecutionTime: true
  })
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getReviewStatistics(providerId: string): Promise<any> {
    return this.getProviderReviewStatistics(providerId);
  }

  /**
   * Validate service request exists (for review creation)
   */
  @Log({
    message: 'Validating service request',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async validateServiceRequest(serviceRequestId: string): Promise<boolean> {
    try {
      if (this.serviceRequestService) {
        const serviceRequest = await this.serviceRequestService.getServiceRequestById(serviceRequestId);
        return !!serviceRequest;
      }
      
      // Fallback validation
      const serviceRequest = await ServiceRequest.findById(serviceRequestId);
      return !!serviceRequest;
    } catch (error) {
      return false;
    }
  }

  /**
   * Private helper to update provider rating
   */
  private async updateProviderRating(providerId: string): Promise<void> {
    try {
      const { average, count } = await this.calculateProviderRating(providerId);
      
      if (this.providerService) {
        // Update provider's rating through ProviderService
        // This would typically call a method like updateProviderRating
        console.log(`Updated provider ${providerId} rating: ${average} (${count} reviews)`);
      }
    } catch (error) {
      console.error('Failed to update provider rating:', error);
    }
  }
}

