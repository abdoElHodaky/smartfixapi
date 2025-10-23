/**
 * Review Search Strategies
 * 
 * Strategy implementations for review search and filtering
 */

import { AsyncStrategy } from '../../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../../utils/service-optimization/CommandBase';
import { AggregationBuilder } from '../../../utils/aggregation/AggregationBuilder';
import { Review } from '../../../models/Review';
import { ReviewSearchInput } from '../interfaces/ServiceStrategy';

export class SearchReviewsStrategy implements AsyncStrategy<ReviewSearchInput, CommandResult> {
  async execute(input: ReviewSearchInput): Promise<CommandResult> {
    try {
      const { filters } = input;
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 10, 100);
      const skip = (page - 1) * limit;

      // Build search criteria
      const matchCriteria: any = { isDeleted: { $ne: true }, status: 'active' };
      
      if (filters.userId) {
        matchCriteria.userId = filters.userId;
      }

      if (filters.providerId) {
        matchCriteria.providerId = filters.providerId;
      }

      if (filters.rating) {
        matchCriteria.rating = filters.rating;
      }

      if (filters.minRating) {
        matchCriteria.rating = { $gte: filters.minRating };
      }

      if (filters.maxRating) {
        matchCriteria.rating = { ...matchCriteria.rating, $lte: filters.maxRating };
      }

      if (filters.dateRange) {
        matchCriteria.createdAt = {
          $gte: filters.dateRange.from,
          $lte: filters.dateRange.to
        };
      }

      const aggregation = AggregationBuilder.create()
        .match(matchCriteria)
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
          user: 1,
          provider: 1,
          serviceRequest: 1,
          createdAt: 1
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const [reviews, totalCount] = await Promise.all([
        aggregation.execute(Review),
        Review.countDocuments(matchCriteria)
      ]);

      const result = {
        data: reviews,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };

      return CommandResult.success(result, 'Reviews retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to search reviews', [error.message]);
    }
  }
}
