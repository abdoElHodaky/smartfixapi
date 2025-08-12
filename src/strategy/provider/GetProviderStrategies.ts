/**
 * Get Provider Strategy Implementations
 * 
 * Strategy classes for retrieving provider information
 */

import { AsyncStrategy } from '../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../utils/service-optimization/CommandBase';
import { AggregationBuilder } from '../../utils/aggregation/AggregationBuilder';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ProviderOperationInput } from '../interfaces/ServiceStrategy';

export class GetProviderByIdStrategy implements AsyncStrategy<ProviderOperationInput, CommandResult> {
  async execute(input: ProviderOperationInput): Promise<CommandResult> {
    try {
      const aggregation = AggregationBuilder.create()
        .match({ _id: input.providerId, isDeleted: { $ne: true } })
        .lookup('users', 'userId', '_id', 'user')
        .lookup('reviews', 'providerId', '_id', 'reviews')
        .lookup('serviceRequests', 'providerId', '_id', 'serviceRequests')
        .addFields({
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $size: '$reviews' },
          completedJobs: {
            $size: {
              $filter: {
                input: '$serviceRequests',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          user: { $arrayElemAt: ['$user', 0] }
        })
        .project({
          'user.password': 0,
          services: 1,
          location: 1,
          availability: 1,
          portfolio: 1,
          isVerified: 1,
          isActive: 1,
          rating: 1,
          totalReviews: 1,
          completedJobs: 1,
          averageRating: 1,
          user: 1,
          createdAt: 1,
          updatedAt: 1
        });

      const providers = await aggregation.execute(ServiceProvider);
      const provider = providers[0];

      if (!provider) {
        return CommandResult.failure('Provider not found');
      }

      return CommandResult.success(provider, 'Provider retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to get provider', [error.message]);
    }
  }
}

export class GetProviderByUserIdStrategy implements AsyncStrategy<ProviderOperationInput, CommandResult> {
  async execute(input: ProviderOperationInput): Promise<CommandResult> {
    try {
      const aggregation = AggregationBuilder.create()
        .match({ userId: input.userId, isDeleted: { $ne: true } })
        .lookup('users', 'userId', '_id', 'user')
        .lookup('reviews', 'providerId', '_id', 'reviews')
        .lookup('serviceRequests', 'providerId', '_id', 'serviceRequests')
        .addFields({
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $size: '$reviews' },
          completedJobs: {
            $size: {
              $filter: {
                input: '$serviceRequests',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          user: { $arrayElemAt: ['$user', 0] }
        })
        .project({
          'user.password': 0,
          services: 1,
          location: 1,
          availability: 1,
          portfolio: 1,
          isVerified: 1,
          isActive: 1,
          rating: 1,
          totalReviews: 1,
          completedJobs: 1,
          averageRating: 1,
          user: 1,
          createdAt: 1,
          updatedAt: 1
        });

      const providers = await aggregation.execute(ServiceProvider);
      const provider = providers[0];

      if (!provider) {
        return CommandResult.failure('Provider not found for this user');
      }

      return CommandResult.success(provider, 'Provider retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to get provider by user ID', [error.message]);
    }
  }
}

