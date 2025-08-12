/**
 * Admin Service Strategy Implementations
 * 
 * Strategy classes for admin operations extracted from AdminService
 */

import { AsyncStrategy } from '../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../utils/service-optimization/CommandBase';
import { AggregationBuilder } from '../../utils/aggregation/AggregationBuilder';
import { IProviderService } from '../../interfaces/services';
import { User } from '../../models/User';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';

// Import strategy interfaces from centralized location
import {
  ProviderActionInput,
  ReportGenerationInput,
  DashboardDataInput
} from '../interfaces/ServiceStrategy';

// Provider action strategies
export class ApproveProviderStrategy implements AsyncStrategy<ProviderActionInput, CommandResult> {
  constructor(private providerService: IProviderService) {}

  async execute(input: ProviderActionInput): Promise<CommandResult> {
    try {
      const provider = await this.providerService.getProviderById(input.providerId);
      if (!provider) {
        return CommandResult.failure('Provider not found');
      }

      await this.providerService.updateProviderStatus(input.providerId, 'approved');
      
      return CommandResult.success(
        { providerId: input.providerId, status: 'approved' },
        'Provider approved successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to approve provider', [error.message]);
    }
  }
}

export class RejectProviderStrategy implements AsyncStrategy<ProviderActionInput, CommandResult> {
  constructor(private providerService: IProviderService) {}

  async execute(input: ProviderActionInput): Promise<CommandResult> {
    try {
      const provider = await this.providerService.getProviderById(input.providerId);
      if (!provider) {
        return CommandResult.failure('Provider not found');
      }

      await this.providerService.updateProviderStatus(input.providerId, 'rejected');
      
      return CommandResult.success(
        { providerId: input.providerId, status: 'rejected', reason: input.reason },
        'Provider rejected successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to reject provider', [error.message]);
    }
  }
}

export class SuspendProviderStrategy implements AsyncStrategy<ProviderActionInput, CommandResult> {
  constructor(private providerService: IProviderService) {}

  async execute(input: ProviderActionInput): Promise<CommandResult> {
    try {
      const provider = await this.providerService.getProviderById(input.providerId);
      if (!provider) {
        return CommandResult.failure('Provider not found');
      }

      await this.providerService.updateProviderStatus(input.providerId, 'suspended');
      
      return CommandResult.success(
        { providerId: input.providerId, status: 'suspended', reason: input.reason },
        'Provider suspended successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to suspend provider', [error.message]);
    }
  }
}

// Report generation strategies
export class UserActivityReportStrategy implements AsyncStrategy<ReportGenerationInput, any> {
  async execute(input: ReportGenerationInput): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .buildUserActivityReport(input.dateRange);
    
    return await aggregation.execute(User);
  }
}

export class ProviderPerformanceReportStrategy implements AsyncStrategy<ReportGenerationInput, any> {
  async execute(input: ReportGenerationInput): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .buildTopProviders(5, 4.0, 20);
    
    return await aggregation.execute(Review);
  }
}

export class ServiceRequestReportStrategy implements AsyncStrategy<ReportGenerationInput, any> {
  async execute(input: ReportGenerationInput): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .buildServiceRequestTrends(input.dateRange);
    
    return await aggregation.execute(ServiceRequest);
  }
}

export class RevenueReportStrategy implements AsyncStrategy<ReportGenerationInput, any> {
  async execute(input: ReportGenerationInput): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .buildRevenueAnalytics(input.dateRange);
    
    return await aggregation.execute(ServiceRequest);
  }
}

// Dashboard data strategies
export class OverviewDataStrategy implements AsyncStrategy<DashboardDataInput, any> {
  async execute(input: DashboardDataInput): Promise<any> {
    const [
      totalUsers,
      totalProviders,
      totalRequests,
      totalRevenue
    ] = await Promise.all([
      AggregationBuilder.create().buildUserCount().execute(User),
      AggregationBuilder.create().buildProviderCount().execute(User),
      AggregationBuilder.create().buildRequestCount().execute(ServiceRequest),
      AggregationBuilder.create().buildRevenueSum().execute(ServiceRequest)
    ]);

    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalProviders: totalProviders[0]?.count || 0,
      totalRequests: totalRequests[0]?.count || 0,
      totalRevenue: totalRevenue[0]?.total || 0
    };
  }
}

export class StatisticsDataStrategy implements AsyncStrategy<DashboardDataInput, any> {
  async execute(input: DashboardDataInput): Promise<any> {
    const [
      topProviders,
      categoryStats,
      ratingDistribution
    ] = await Promise.all([
      AggregationBuilder.create().buildTopProviders(5, 4.0, 10).execute(Review),
      AggregationBuilder.create().buildCategoryStatistics('category', 10).execute(ServiceRequest),
      AggregationBuilder.create().buildRatingDistribution().execute(Review)
    ]);

    return {
      topProviders,
      categoryStats,
      ratingDistribution
    };
  }
}
