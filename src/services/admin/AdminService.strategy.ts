/**
 * Strategy-Based AdminService Implementation
 * 
 * Enhanced AdminService using Strategy Patterns and AggregationBuilder
 * for optimized performance and maintainable conditional logic.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { NotFoundError, ValidationError, AuthenticationError } from '../../middleware/errorHandler';
import { IAdminService, IUserService, IProviderService, IServiceRequestService, IReviewService } from '../../interfaces/services';
import {
  AdminDashboardDto,
  PlatformStatisticsDto,
  UserManagementDto,
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

// Import strategy implementations
import {
  ApproveProviderStrategy,
  RejectProviderStrategy,
  SuspendProviderStrategy,
  UserActivityReportStrategy,
  ProviderPerformanceReportStrategy,
  ServiceRequestReportStrategy,
  RevenueReportStrategy,
  OverviewDataStrategy,
  StatisticsDataStrategy
} from '../../strategy/admin/AdminStrategies';

// Import strategy interfaces
import {
  ProviderActionInput,
  ReportGenerationInput,
  DashboardDataInput
} from '../../strategy/interfaces/ServiceStrategy';

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

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 10
})
export class AdminServiceStrategy implements IAdminService {
  private providerActionRegistry: AsyncStrategyRegistry<ProviderActionInput, CommandResult>;
  private reportGenerationRegistry: AsyncStrategyRegistry<ReportGenerationInput, any>;
  private dashboardDataRegistry: AsyncStrategyRegistry<DashboardDataInput, any>;

  constructor(
    @Inject('UserService') private userService: IUserService,
    @Inject('ProviderService') private providerService: IProviderService,
    @Inject('ServiceRequestService') private serviceRequestService: IServiceRequestService,
    @Inject('ReviewService') private reviewService: IReviewService
  ) {
    this.initializeStrategies();
  }

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('🚀 Strategy-based AdminService initialized with optimized patterns');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('🚀 Strategy-based AdminService cleanup completed');
  }

  /**
   * Initialize all strategy registries
   */
  private initializeStrategies(): void {
    // Provider action strategies
    this.providerActionRegistry = new AsyncStrategyRegistry<ProviderActionInput, CommandResult>();
    this.providerActionRegistry.register('approve', new ApproveProviderStrategy(this.providerService));
    this.providerActionRegistry.register('reject', new RejectProviderStrategy(this.providerService));
    this.providerActionRegistry.register('suspend', new SuspendProviderStrategy(this.providerService));

    // Report generation strategies
    this.reportGenerationRegistry = new AsyncStrategyRegistry<ReportGenerationInput, any>();
    this.reportGenerationRegistry.register('user_activity', new UserActivityReportStrategy());
    this.reportGenerationRegistry.register('provider_performance', new ProviderPerformanceReportStrategy());
    this.reportGenerationRegistry.register('service_requests', new ServiceRequestReportStrategy());
    this.reportGenerationRegistry.register('revenue', new RevenueReportStrategy());

    // Dashboard data strategies
    this.dashboardDataRegistry = new AsyncStrategyRegistry<DashboardDataInput, any>();
    this.dashboardDataRegistry.register('overview', new OverviewDataStrategy());
    this.dashboardDataRegistry.register('statistics', new StatisticsDataStrategy());
  }

  /**
   * Optimized admin permissions verification using ConditionalHelpers
   */
  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    
    const roleCheck = ConditionalHelpers.validateUserRole(user, {
      allowedRoles: ['admin', 'super_admin'],
      requireActive: true,
      requireEmailVerified: true
    });

    if (!roleCheck.isValid) {
      throw new AuthenticationError(`Insufficient permissions: ${roleCheck.errors.join(', ')}`);
    }
  }

  /**
   * Strategy-based provider action handling
   */
  @Log({
    message: 'Executing provider action with strategy pattern',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  })
  async handleProviderAction(
    providerId: string,
    action: string,
    adminId: string,
    reason?: string
  ): Promise<CommandResult> {
    await this.verifyAdminPermissions(adminId);

    if (!this.providerActionRegistry.has(action)) {
      return CommandResult.failure(`Unsupported provider action: ${action}`);
    }

    const input: ProviderActionInput = {
      providerId,
      adminId,
      reason,
      metadata: { timestamp: new Date(), action }
    };

    return await this.providerActionRegistry.execute(action, input);
  }

  /**
   * Strategy-based report generation using AggregationBuilder
   */
  @Log({
    message: 'Generating report with strategy pattern and aggregation builder',
    includeExecutionTime: true
  })
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async generateReport(
    type: string,
    adminId: string,
    dateRange?: { from: Date; to: Date },
    filters?: Record<string, any>
  ): Promise<any> {
    await this.verifyAdminPermissions(adminId);

    if (!this.reportGenerationRegistry.has(type)) {
      throw new ValidationError(`Unsupported report type: ${type}`);
    }

    const input: ReportGenerationInput = {
      type,
      dateRange,
      filters,
      adminId
    };

    return await this.reportGenerationRegistry.execute(type, input);
  }

  /**
   * Optimized dashboard data retrieval with strategy patterns
   */
  @Log({
    message: 'Getting optimized admin dashboard data with strategies',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'linear'
  })
  async getAdminDashboard(adminId: string): Promise<AdminDashboardDto> {
    await this.verifyAdminPermissions(adminId);

    try {
      const input: DashboardDataInput = {
        adminId,
        includeDetails: true
      };

      const [overview, statistics] = await Promise.all([
        this.dashboardDataRegistry.execute('overview', input),
        this.dashboardDataRegistry.execute('statistics', input)
      ]);

      return {
        overview,
        recentActivity: await this.getRecentActivity(),
        statistics
      };
    } catch (error) {
      throw new ValidationError('Failed to get admin dashboard data');
    }
  }

  /**
   * Get recent activity using AggregationBuilder
   */
  private async getRecentActivity(): Promise<any> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [recentUsers, recentRequests, recentReviews] = await Promise.all([
      AggregationBuilder.create()
        .match({ createdAt: { $gte: sevenDaysAgo } })
        .sort({ createdAt: -1 })
        .limit(10)
        .execute(User),
      AggregationBuilder.create()
        .match({ createdAt: { $gte: sevenDaysAgo } })
        .sort({ createdAt: -1 })
        .limit(10)
        .execute(ServiceRequest),
      AggregationBuilder.create()
        .match({ createdAt: { $gte: sevenDaysAgo } })
        .sort({ createdAt: -1 })
        .limit(10)
        .execute(Review)
    ]);

    return {
      recentUsers,
      recentRequests,
      recentReviews
    };
  }

  /**
   * Get platform statistics using optimized aggregations
   */
  @Cached(15 * 60 * 1000) // Cache for 15 minutes
  async getPlatformStatistics(): Promise<PlatformStatisticsDto> {
    const [
      userRoleStats,
      providerServiceStats,
      requestStatusStats,
      averageRating
    ] = await Promise.all([
      AggregationBuilder.create().buildUserRoleStatistics().execute(User),
      AggregationBuilder.create().buildProviderServiceStatistics(15).execute(ServiceProvider),
      AggregationBuilder.create().buildStatusStatistics('status').execute(ServiceRequest),
      AggregationBuilder.create().buildAverageRating().execute(Review)
    ]);

    return {
      userRoleStats,
      providerServiceStats,
      requestStatusStats,
      averageRating: averageRating[0]?.avgRating || 0
    };
  }

  /**
   * Get users with optimized filtering and pagination
   */
  async getUsers(
    page: number = 1,
    limit: number = 10,
    filters?: any
  ): Promise<PaginatedResponseDto<UserManagementDto>> {
    const aggregation = AggregationBuilder.create();

    if (filters) {
      if (filters.role) {
        aggregation.match({ role: filters.role });
      }
      if (filters.status) {
        aggregation.match({ status: filters.status });
      }
      if (filters.search) {
        const searchMatch = AggregationUtils.createTextSearchMatch(
          filters.search,
          ['name', 'email', 'phone']
        );
        aggregation.match(searchMatch);
      }
    }

    const [users, totalCount] = await Promise.all([
      aggregation
        .clone()
        .skip((page - 1) * limit)
        .limit(limit)
        .execute(User),
      aggregation
        .clone()
        .group({ _id: null, count: { $sum: 1 } })
        .execute(User)
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        pages: Math.ceil((totalCount[0]?.count || 0) / limit)
      }
    };
  }

  /**
   * Legacy method implementations for backward compatibility
   */
  async approveProvider(providerId: string, adminId: string): Promise<ApiResponseDto> {
    const result = await this.handleProviderAction(providerId, 'approve', adminId);
    return {
      success: result.success,
      message: result.message,
      data: result.data
    };
  }

  async rejectProvider(providerId: string, adminId: string, reason: string): Promise<ApiResponseDto> {
    const result = await this.handleProviderAction(providerId, 'reject', adminId, reason);
    return {
      success: result.success,
      message: result.message,
      data: result.data
    };
  }

  async suspendProvider(providerId: string, adminId: string, reason: string): Promise<ApiResponseDto> {
    const result = await this.handleProviderAction(providerId, 'suspend', adminId, reason);
    return {
      success: result.success,
      message: result.message,
      data: result.data
    };
  }

  async deleteUser(userId: string, adminId: string): Promise<ApiResponseDto> {
    await this.verifyAdminPermissions(adminId);
    
    try {
      await this.userService.deleteUser(userId);
      return {
        success: true,
        message: 'User deleted successfully',
        data: { userId }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete user',
        data: null
      };
    }
  }
}
