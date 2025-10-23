/**
 * Service Request Search Strategies
 * 
 * Strategy implementations for service request search and filtering
 */

import { AsyncStrategy } from '../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../utils/service-optimization/CommandBase';
import { AggregationBuilder } from '../../utils/aggregation/AggregationBuilder';
import { ServiceRequest } from '../../models/ServiceRequest';
import { ServiceRequestSearchInput } from '../interfaces/ServiceStrategy';

export class SearchServiceRequestsStrategy implements AsyncStrategy<ServiceRequestSearchInput, CommandResult> {
  async execute(input: ServiceRequestSearchInput): Promise<CommandResult> {
    try {
      const { filters } = input;
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 10, 100);
      const skip = (page - 1) * limit;

      // Build search criteria
      const matchCriteria: any = { isDeleted: { $ne: true } };
      
      if (!input.includeInactive) {
        matchCriteria.status = { $ne: 'cancelled' };
      }

      if (filters.status) {
        matchCriteria.status = filters.status;
      }

      if (filters.category) {
        matchCriteria.category = filters.category;
      }

      if (filters.location) {
        matchCriteria.location = {
          $near: {
            $geometry: filters.location,
            $maxDistance: filters.radius || 10000
          }
        };
      }

      if (filters.priceRange) {
        matchCriteria.price = {
          $gte: filters.priceRange.min,
          $lte: filters.priceRange.max
        };
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
        .addFields({
          user: { $arrayElemAt: ['$user', 0] },
          provider: { $arrayElemAt: ['$provider', 0] }
        })
        .project({
          'user.password': 0,
          title: 1,
          description: 1,
          category: 1,
          location: 1,
          price: 1,
          status: 1,
          urgency: 1,
          images: { $slice: ['$images', 3] },
          user: 1,
          provider: 1,
          createdAt: 1
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const [requests, totalCount] = await Promise.all([
        aggregation.execute(ServiceRequest),
        ServiceRequest.countDocuments(matchCriteria)
      ]);

      const result = {
        data: requests,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };

      return CommandResult.success(result, 'Service requests retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to search service requests', [error.message]);
    }
  }
}
