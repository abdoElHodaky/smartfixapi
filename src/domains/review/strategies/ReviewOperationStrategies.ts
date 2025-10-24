/**
 * Review Operation Strategies
 * 
 * Strategy implementations for review CRUD operations
 */

import { AsyncStrategy } from '../../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../../utils/service-optimization/CommandBase';
import { AggregationBuilder } from '../../../utils/aggregation/AggregationBuilder';
import { ConditionalHelpers } from '../../../utils/conditions/ConditionalHelpers';
import { Review } from '../../../models/Review';
import { User } from '../../../models/User';
import { ServiceRequest } from '../../../models/ServiceRequest';
import { ServiceProvider } from '../../../models/ServiceProvider';
import { ReviewOperationInput } from '../interfaces/ServiceStrategy';

export class CreateReviewStrategy implements AsyncStrategy<ReviewOperationInput, CommandResult> {
  async execute(input: ReviewOperationInput): Promise<CommandResult> {
    try {
      if (!input.data) {
        return CommandResult.failure('Review data is required');
      }

      // Validate service request exists and is completed
      const serviceRequest = await ServiceRequest.findById(input.serviceRequestId);
      if (!serviceRequest) {
        return CommandResult.failure('Service request not found');
      }

      if (serviceRequest.status !== 'completed') {
        return CommandResult.failure('Can only review completed service requests');
      }

      // Validate user is the requester
      if (input.userId !== serviceRequest.userId.toString()) {
        return CommandResult.failure('Only the service requester can leave a review');
      }

      // Check if review already exists
      const existingReview = await Review.findOne({
        userId: input.userId,
        serviceRequestId: input.serviceRequestId
      });

      if (existingReview) {
        return CommandResult.failure('Review already exists for this service request');
      }

      // Create review
      const review = new Review({
        ...input.data,
        userId: input.userId,
        providerId: input.providerId || serviceRequest.providerId,
        serviceRequestId: input.serviceRequestId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await review.save();

      // Populate related data
      await review.populate(['userId', 'providerId', 'serviceRequestId']);

      // Update provider rating
      await this.updateProviderRating(review.providerId.toString());

      return CommandResult.success(review, 'Review created successfully');
    } catch (error) {
      return CommandResult.failure('Failed to create review', [error.message]);
    }
  }

  private async updateProviderRating(providerId: string): Promise<void> {
    const aggregation = AggregationBuilder.create()
      .match({ providerId, status: 'active' })
      .group({
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      });

    const result = await aggregation.execute(Review);
    const stats = result[0];

    if (stats) {
      await ServiceProvider.findByIdAndUpdate(providerId, {
        rating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews,
        updatedAt: new Date()
      });
    }
  }
}

export class GetReviewByIdStrategy implements AsyncStrategy<ReviewOperationInput, CommandResult> {
  async execute(input: ReviewOperationInput): Promise<CommandResult> {
    try {
      const aggregation = AggregationBuilder.create()
        .match({ _id: input.reviewId, isDeleted: { $ne: true } })
        .lookup('users', 'userId', '_id', 'user')
        .lookup('serviceProviders', 'providerId', '_id', 'provider')
        .lookup('serviceRequests', 'serviceRequestId', '_id', 'serviceRequest')
        .addFields({
          user: { $arrayElemAt: ['$user', 0] },
          provider: { $arrayElemAt: ['$provider', 0] },
          serviceRequest: { $arrayElemAt: ['$serviceRequest', 0] }
        })
        .project({
          'user.password': 0,
          rating: 1,
          comment: 1,
          images: 1,
          status: 1,
          user: 1,
          provider: 1,
          serviceRequest: 1,
          createdAt: 1,
          updatedAt: 1
        });

      const reviews = await aggregation.execute(Review);
      const review = reviews[0];

      if (!review) {
        return CommandResult.failure('Review not found');
      }

      return CommandResult.success(review, 'Review retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to get review', [error.message]);
    }
  }
}

export class UpdateReviewStrategy implements AsyncStrategy<ReviewOperationInput, CommandResult> {
  async execute(input: ReviewOperationInput): Promise<CommandResult> {
    try {
      if (!input.data || Object.keys(input.data).length === 0) {
        return CommandResult.failure('No update data provided');
      }

      // Check if review exists
      const existingReview = await Review.findOne({ 
        _id: input.reviewId, 
        isDeleted: { $ne: true } 
      });

      if (!existingReview) {
        return CommandResult.failure('Review not found');
      }

      // Validate permissions (user can only update their own reviews unless admin)
      if (input.requesterId && input.requesterId !== existingReview.userId.toString()) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Insufficient permissions to update review');
        }
      }

      // Update review
      const updatedReview = await Review.findByIdAndUpdate(
        input.reviewId,
        { 
          ...input.data, 
          updatedAt: new Date(),
          ...(input.metadata && { metadata: input.metadata })
        },
        { new: true, runValidators: true }
      ).populate(['userId', 'providerId', 'serviceRequestId']);

      // Update provider rating if rating changed
      if (input.data.rating && input.data.rating !== existingReview.rating) {
        await this.updateProviderRating(existingReview.providerId.toString());
      }

      return CommandResult.success(updatedReview, 'Review updated successfully');
    } catch (error) {
      return CommandResult.failure('Failed to update review', [error.message]);
    }
  }

  private async updateProviderRating(providerId: string): Promise<void> {
    const aggregation = AggregationBuilder.create()
      .match({ providerId, status: 'active' })
      .group({
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      });

    const result = await aggregation.execute(Review);
    const stats = result[0];

    if (stats) {
      await ServiceProvider.findByIdAndUpdate(providerId, {
        rating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews,
        updatedAt: new Date()
      });
    }
  }
}

export class DeleteReviewStrategy implements AsyncStrategy<ReviewOperationInput, CommandResult> {
  async execute(input: ReviewOperationInput): Promise<CommandResult> {
    try {
      const review = await Review.findById(input.reviewId);
      if (!review) {
        return CommandResult.failure('Review not found');
      }

      // Validate permissions
      if (input.requesterId && input.requesterId !== review.userId.toString()) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Insufficient permissions to delete review');
        }
      }

      // Soft delete review
      await Review.findByIdAndUpdate(input.reviewId, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: input.requesterId || input.userId
      });

      // Update provider rating
      await this.updateProviderRating(review.providerId.toString());

      return CommandResult.success(
        { reviewId: input.reviewId, deleted: true },
        'Review deleted successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to delete review', [error.message]);
    }
  }

  private async updateProviderRating(providerId: string): Promise<void> {
    const aggregation = AggregationBuilder.create()
      .match({ providerId, status: 'active', isDeleted: { $ne: true } })
      .group({
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      });

    const result = await aggregation.execute(Review);
    const stats = result[0];

    if (stats) {
      await ServiceProvider.findByIdAndUpdate(providerId, {
        rating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews,
        updatedAt: new Date()
      });
    } else {
      // No reviews left, reset rating
      await ServiceProvider.findByIdAndUpdate(providerId, {
        rating: 0,
        totalReviews: 0,
        updatedAt: new Date()
      });
    }
  }
}
