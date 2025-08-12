/**
 * Service Request Matching Strategies
 * 
 * Strategy implementations for matching service requests with providers
 */

import { AsyncStrategy } from '../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../utils/service-optimization/CommandBase';
import { AggregationBuilder } from '../../utils/aggregation/AggregationBuilder';
import { ServiceRequest } from '../../models/ServiceRequest';
import { ServiceProvider } from '../../models/ServiceProvider';
import { MatchingInput } from '../interfaces/ServiceStrategy';

export class FindMatchingProvidersStrategy implements AsyncStrategy<MatchingInput, CommandResult> {
  async execute(input: MatchingInput): Promise<CommandResult> {
    try {
      // Get the service request
      const request = await ServiceRequest.findById(input.requestId);
      if (!request) {
        return CommandResult.failure('Service request not found');
      }

      const criteria = input.criteria || {};
      const maxDistance = criteria.maxDistance || 50000; // 50km default
      const minRating = criteria.minRating || 3.0;
      const maxProviders = criteria.maxProviders || 10;

      // Build matching criteria
      const matchCriteria: any = {
        isDeleted: { $ne: true },
        isActive: true,
        isVerified: true
      };

      // Match by service category
      if (request.category) {
        matchCriteria['services.category'] = request.category;
      }

      // Location-based matching
      if (request.location) {
        matchCriteria.location = {
          $near: {
            $geometry: request.location,
            $maxDistance: maxDistance
          }
        };
      }

      const aggregation = AggregationBuilder.create()
        .match(matchCriteria)
        .lookup('users', 'userId', '_id', 'user')
        .lookup('reviews', 'providerId', '_id', 'reviews')
        .addFields({
          user: { $arrayElemAt: ['$user', 0] },
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $size: '$reviews' },
          distance: {
            $multiply: [
              {
                $acos: {
                  $add: [
                    {
                      $multiply: [
                        { $sin: { $degreesToRadians: { $arrayElemAt: ['$location.coordinates', 1] } } },
                        { $sin: { $degreesToRadians: { $arrayElemAt: [request.location.coordinates, 1] } } }
                      ]
                    },
                    {
                      $multiply: [
                        { $cos: { $degreesToRadians: { $arrayElemAt: ['$location.coordinates', 1] } } },
                        { $cos: { $degreesToRadians: { $arrayElemAt: [request.location.coordinates, 1] } } },
                        { $cos: { $degreesToRadians: { $subtract: [{ $arrayElemAt: ['$location.coordinates', 0] }, { $arrayElemAt: [request.location.coordinates, 0] }] } } }
                      ]
                    }
                  ]
                }
              },
              6371000 // Earth's radius in meters
            ]
          }
        })
        .match({
          averageRating: { $gte: minRating }
        })
        .project({
          'user.password': 0,
          'user.email': 1,
          'user.name': 1,
          'user.profileImage': 1,
          services: 1,
          location: 1,
          isVerified: 1,
          rating: 1,
          averageRating: 1,
          totalReviews: 1,
          distance: 1,
          portfolio: { $slice: ['$portfolio', 3] },
          user: 1
        })
        .sort({ 
          averageRating: -1, 
          totalReviews: -1, 
          distance: 1 
        })
        .limit(maxProviders);

      const matchingProviders = await aggregation.execute(ServiceProvider);

      return CommandResult.success(
        {
          requestId: input.requestId,
          matchingProviders,
          matchCriteria: {
            category: request.category,
            location: request.location,
            maxDistance,
            minRating,
            maxProviders
          }
        },
        'Matching providers found successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to find matching providers', [error.message]);
    }
  }
}
