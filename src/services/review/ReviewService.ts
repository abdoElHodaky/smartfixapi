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
  PaginatedResponseDto
} from '../../dtos';

export class ReviewService implements IReviewService {
  constructor(
    private serviceRequestService: IServiceRequestService,
    private providerService: IProviderService
  ) {}

  /**
   * Create a new review
   */
  async createReview(userId: string, reviewData: CreateReviewDto): Promise<ApiResponseDto> {
    // Verify service request exists and is completed
    const serviceRequest = await this.serviceRequestService.getServiceRequestById(reviewData.serviceRequestId);
    
    if (serviceRequest.userId.toString() !== userId) {
      throw new ValidationError('You can only review your own service requests');
    }

    if (serviceRequest.status !== 'approved') {
      throw new ValidationError('You can only review approved service requests');
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
      providerId: serviceRequest.providerId
    });

    await review.save();

    // Update provider rating
    await this.providerService.updateProviderRating(serviceRequest.providerId);

    return {
      success: true,
      message: 'Review created successfully',
      data: review
    };
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: string): Promise<any> {
    const review = await Review.findById(reviewId)
      .populate('userId', 'firstName lastName profileImage')
      .populate('providerId', 'businessName')
      .populate('serviceRequestId', 'title category');
    
    if (!review) {
      throw new NotFoundError('Review not found');
    }
    
    return review;
  }

  /**
   * Update review
   */
  async updateReview(reviewId: string, userId: string, updateData: UpdateReviewDto): Promise<ApiResponseDto> {
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName profileImage')
     .populate('providerId', 'businessName')
     .populate('serviceRequestId', 'title category');

    if (!review) {
      throw new NotFoundError('Review not found or you do not have permission to update it');
    }

    // Update provider rating
    await this.providerService.updateProviderRating(review.providerId);

    return {
      success: true,
      message: 'Review updated successfully',
      data: review
    };
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId: string, userId: string): Promise<ApiResponseDto> {
    const review = await Review.findOneAndDelete({ _id: reviewId, userId });

    if (!review) {
      throw new NotFoundError('Review not found or you do not have permission to delete it');
    }

    // Update provider rating
    await this.providerService.updateProviderRating(review.providerId);

    return {
      success: true,
      message: 'Review deleted successfully'
    };
  }

  /**
   * Search reviews with filters
   */
  async searchReviews(filters: ReviewFiltersDto): Promise<PaginatedResponseDto<any>> {
    const { 
      providerId, 
      userId, 
      serviceRequestId,
      minRating, 
      maxRating,
      page = 1, 
      limit = 10 
    } = filters;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (providerId) {
      filter.providerId = providerId;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (serviceRequestId) {
      filter.serviceRequestId = serviceRequestId;
    }

    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = minRating;
      if (maxRating) filter.rating.$lte = maxRating;
    }

    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName profileImage')
      .populate('providerId', 'businessName')
      .populate('serviceRequestId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    return {
      data: reviews,
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
   * Get reviews by provider
   */
  async getReviewsByProvider(
    providerId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ providerId })
      .populate('userId', 'firstName lastName profileImage')
      .populate('serviceRequestId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ providerId });

    return {
      data: reviews,
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
   * Get reviews by user
   */
  async getReviewsByUser(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ userId })
      .populate('providerId', 'businessName')
      .populate('serviceRequestId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ userId });

    return {
      data: reviews,
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
   * Respond to review (provider)
   */
  async respondToReview(reviewId: string, providerId: string, response: string): Promise<ApiResponseDto> {
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, providerId },
      { 
        providerResponse: response,
        respondedAt: new Date()
      },
      { new: true }
    );

    if (!review) {
      throw new NotFoundError('Review not found or you do not have permission to respond');
    }

    return {
      success: true,
      message: 'Response added to review successfully',
      data: review
    };
  }

  /**
   * Flag review as inappropriate
   */
  async flagReview(reviewId: string, userId: string, reason: string): Promise<ApiResponseDto> {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { 
        $push: { 
          flags: {
            userId,
            reason,
            flaggedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return {
      success: true,
      message: 'Review flagged successfully'
    };
  }

  /**
   * Get review statistics for provider
   */
  async getProviderReviewStatistics(providerId: string): Promise<any> {
    const stats = await Review.aggregate([
      { $match: { providerId } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const stat = stats[0];
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    stat.ratingDistribution.forEach((rating: number) => {
      distribution[rating as keyof typeof distribution]++;
    });

    return {
      totalReviews: stat.totalReviews,
      averageRating: Math.round(stat.averageRating * 10) / 10,
      ratingDistribution: distribution
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
        verifiedAt: new Date()
      },
      { new: true }
    );

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return {
      success: true,
      message: 'Review verified successfully'
    };
  }

  /**
   * Get pending reviews for moderation
   */
  async getPendingReviews(page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ 
      $or: [
        { flags: { $exists: true, $ne: [] } },
        { isVerified: false }
      ]
    })
      .populate('userId', 'firstName lastName profileImage')
      .populate('providerId', 'businessName')
      .populate('serviceRequestId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ 
      $or: [
        { flags: { $exists: true, $ne: [] } },
        { isVerified: false }
      ]
    });

    return {
      data: reviews,
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
   * Calculate provider rating from reviews
   */
  async calculateProviderRating(providerId: string): Promise<{ average: number; count: number }> {
    const stats = await Review.aggregate([
      { $match: { providerId } },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (stats.length === 0) {
      return { average: 0, count: 0 };
    }

    return {
      average: Math.round(stats[0].average * 10) / 10,
      count: stats[0].count
    };
  }
}

