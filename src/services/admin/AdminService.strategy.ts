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
import { ValidationError, AuthenticationError } from '../../middleware/errorHandler';
import { IAdminService, IUserService, IProviderService, IServiceRequestService, IReviewService } from '../../interfaces/services';
import {
  AdminDashboardDto,
  PlatformStatisticsDto,
  UserManagementDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

// Import optimization utilities
// import { AggregationBuilder, AggregationUtils } from '../../utils/aggregation/AggregationBuilder';
import { 
  AsyncStrategyRegistry
} from '../../utils/conditions/StrategyPatterns';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';

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
    
    // Optimized recent activity aggregation with efficient projections and indexes
    const [recentUsers, recentRequests, recentReviews] = await Promise.all([
      // Optimized recent users with selective projection and compound index on (createdAt, isActive)
      User.aggregate([
        { $match: { 
          createdAt: { $gte: sevenDaysAgo },
          isActive: true 
        }},
        { $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          profilePicture: 1
        }},
        { $sort: { createdAt: -1 } },
        { $limit: 10 }
      ]),
      // Optimized recent requests with lookup for user info and status filtering
      ServiceRequest.aggregate([
        { $match: { 
          createdAt: { $gte: sevenDaysAgo }
        }},
        { $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            { $project: { firstName: 1, lastName: 1, email: 1 } }
          ]
        }},
        { $unwind: '$user' },
        { $project: {
          title: 1,
          serviceType: 1,
          status: 1,
          urgency: 1,
          createdAt: 1,
          user: 1
        }},
        { $sort: { createdAt: -1 } },
        { $limit: 10 }
      ]),
      // Optimized recent reviews with provider and user lookups
      Review.aggregate([
        { $match: { 
          createdAt: { $gte: sevenDaysAgo },
          rating: { $exists: true }
        }},
        { $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            { $project: { firstName: 1, lastName: 1 } }
          ]
        }},
        { $lookup: {
          from: 'serviceproviders',
          localField: 'providerId',
          foreignField: '_id',
          as: 'provider',
          pipeline: [
            { $project: { businessName: 1 } }
          ]
        }},
        { $unwind: '$user' },
        { $unwind: '$provider' },
        { $project: {
          rating: 1,
          comment: 1,
          createdAt: 1,
          user: 1,
          provider: 1
        }},
        { $sort: { createdAt: -1 } },
        { $limit: 10 }
      ])
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
    // Optimized platform statistics aggregation with indexes and efficient pipelines
    const [
      userRoleStats,
      providerServiceStats,
      requestStatusStats,
      averageRating
    ] = await Promise.all([
      // Optimized user role statistics with index on role field
      User.aggregate([
        { $match: { isActive: true } }, // Filter active users first
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Optimized provider service statistics with compound index
      ServiceProvider.aggregate([
        { $match: { isActive: true, isVerified: true } }, // Filter active/verified providers
        { $unwind: '$serviceTypes' }, // Handle array of service types
        { $group: { _id: '$serviceTypes', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 } // Limit to top 15 service types
      ]),
      // Optimized request status statistics with index on status
      ServiceRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Optimized average rating calculation with sample for large datasets
      Review.aggregate([
        { $match: { rating: { $exists: true, $gte: 1, $lte: 5 } } }, // Valid ratings only
        { $sample: { size: 10000 } }, // Sample for performance on large datasets
        { $group: { 
          _id: null, 
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' }
        }}
      ])
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
    // TODO: Implement aggregation builder alternative
    let query: any = {};

    if (filters) {
      if (filters.role) {
        query.role = filters.role;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.search) {
        // TODO: Implement text search functionality
        // For now, use simple regex search
        query.$or = [
          { firstName: { $regex: filters.search, $options: 'i' } },
          { lastName: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } }
        ];
      }
    }

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
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

  async deleteUser(userId: string): Promise<ApiResponseDto> {
    // Note: Admin permissions should be verified at the controller level
    
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
