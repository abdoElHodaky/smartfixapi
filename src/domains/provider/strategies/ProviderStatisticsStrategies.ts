/**
 * Provider Statistics Strategy Implementations
 * 
 * Strategy classes for generating provider statistics and analytics
 */

import { AsyncStrategy } from '../../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../../utils/service-optimization/CommandBase';
import { AggregationBuilder } from '../../../utils/aggregation/AggregationBuilder';
import { ServiceProvider } from '../../../models/ServiceProvider';
import { Review } from '../../../models/Review';
import { ServiceRequest } from '../../../models/ServiceRequest';
import { ProviderStatisticsInput } from '../interfaces/ServiceStrategy';

export class GetProviderStatisticsStrategy implements AsyncStrategy<ProviderStatisticsInput, CommandResult> {
  async execute(input: ProviderStatisticsInput): Promise<CommandResult> {
    try {
      const dateRange = input.dateRange || {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date()
      };

      const [
        providerStats,
        reviewStats,
        serviceRequestStats,
        revenueStats
      ] = await Promise.all([
        // Provider basic stats
        AggregationBuilder.create()
          .match({ _id: input.providerId })
          .lookup('reviews', 'providerId', '_id', 'reviews')
          .lookup('serviceRequests', 'providerId', '_id', 'serviceRequests')
          .addFields({
            totalReviews: { $size: '$reviews' },
            averageRating: { $avg: '$reviews.rating' },
            totalServiceRequests: { $size: '$serviceRequests' },
            completedRequests: {
              $size: {
                $filter: {
                  input: '$serviceRequests',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              }
            }
          })
          .project({
            totalReviews: 1,
            averageRating: 1,
            totalServiceRequests: 1,
            completedRequests: 1,
            completionRate: {
              $cond: {
                if: { $gt: ['$totalServiceRequests', 0] },
                then: { $divide: ['$completedRequests', '$totalServiceRequests'] },
                else: 0
              }
            },
            isVerified: 1,
            rating: 1
          })
          .execute(ServiceProvider),

        // Review statistics
        AggregationBuilder.create()
          .match({
            providerId: input.providerId,
            createdAt: { $gte: dateRange.from, $lte: dateRange.to }
          })
          .group({
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            ratingDistribution: {
              $push: '$rating'
            }
          })
          .execute(Review),

        // Service request statistics
        AggregationBuilder.create()
          .match({
            providerId: input.providerId,
            createdAt: { $gte: dateRange.from, $lte: dateRange.to }
          })
          .group({
            _id: '$status',
            count: { $sum: 1 }
          })
          .execute(ServiceRequest),

        // Revenue statistics (if available)
        AggregationBuilder.create()
          .match({
            providerId: input.providerId,
            status: 'completed',
            createdAt: { $gte: dateRange.from, $lte: dateRange.to }
          })
          .group({
            _id: null,
            totalRevenue: { $sum: '$price' },
            averageJobValue: { $avg: '$price' },
            totalJobs: { $sum: 1 }
          })
          .execute(ServiceRequest)
      ]);

      const statistics = {
        provider: providerStats[0] || {},
        reviews: reviewStats[0] || { totalReviews: 0, averageRating: 0 },
        serviceRequests: serviceRequestStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        revenue: revenueStats[0] || { totalRevenue: 0, averageJobValue: 0, totalJobs: 0 },
        dateRange
      };

      return CommandResult.success(statistics, 'Provider statistics retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to get provider statistics', [error.message]);
    }
  }
}

