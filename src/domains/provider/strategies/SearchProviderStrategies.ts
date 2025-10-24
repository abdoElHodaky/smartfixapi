/**
 * Search Provider Strategy Implementations
 * 
 * Strategy classes for searching and filtering providers
 */

import { AsyncStrategy } from '../../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../../utils/service-optimization/CommandBase';
import { AggregationBuilder } from '../../../utils/aggregation/AggregationBuilder';
import { ServiceProvider } from '../../../models/ServiceProvider';
import { ProviderSearchInput } from '../interfaces/ServiceStrategy';

export class SearchProvidersStrategy implements AsyncStrategy<ProviderSearchInput, CommandResult> {
  async execute(input: ProviderSearchInput): Promise<CommandResult> {
    try {
      const { filters } = input;
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 10, 100); // Cap at 100
      const skip = (page - 1) * limit;

      // Build search criteria
      const matchCriteria: any = { isDeleted: { $ne: true } };
      
      if (!input.includeInactive) {
        matchCriteria.isActive = true;
      }

      if (filters.services && filters.services.length > 0) {
        matchCriteria['services.category'] = { $in: filters.services };
      }

      if (filters.location) {
        matchCriteria.location = {
          $near: {
            $geometry: filters.location,
            $maxDistance: filters.radius || 10000 // 10km default
          }
        };
      }

      if (filters.minRating) {
        matchCriteria.rating = { $gte: filters.minRating };
      }

      if (filters.isVerified !== undefined) {
        matchCriteria.isVerified = filters.isVerified;
      }

      // Build aggregation pipeline
      const aggregation = AggregationBuilder.create()
        .match(matchCriteria)
        .lookup('users', 'userId', '_id', 'user')
        .lookup('reviews', 'providerId', '_id', 'reviews')
        .addFields({
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $size: '$reviews' },
          user: { $arrayElemAt: ['$user', 0] }
        })
        .project({
          'user.password': 0,
          'user.email': 1,
          'user.name': 1,
          'user.profileImage': 1,
          services: 1,
          location: 1,
          isVerified: 1,
          isActive: 1,
          rating: 1,
          averageRating: 1,
          totalReviews: 1,
          portfolio: { $slice: ['$portfolio', 3] }, // Show first 3 portfolio items
          createdAt: 1
        })
        .sort({ rating: -1, totalReviews: -1 })
        .skip(skip)
        .limit(limit);

      const [providers, totalCount] = await Promise.all([
        aggregation.execute(ServiceProvider),
        ServiceProvider.countDocuments(matchCriteria)
      ]);

      const result = {
        data: providers,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };

      return CommandResult.success(result, 'Providers retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to search providers', [error.message]);
    }
  }
}

