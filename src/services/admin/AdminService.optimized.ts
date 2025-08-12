/**
 * Optimized AdminService Implementation
 * 
 * Demonstrates the application of service optimization patterns:
 * - Command pattern for complex operations
 * - Structured DTOs instead of multiple parameters
 * - Fluent interfaces for query building
 * - Type-safe pagination and filtering
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

// Import optimization components
import { PaginationOptions, PaginatedResult } from '../../utils/service-optimization/PaginationOptions';
import { FilterBuilder } from '../../utils/service-optimization/FilterBuilder';
import { CommandBase, CommandResult, CommandInvoker } from '../../utils/service-optimization/CommandBase';
import { SearchOptionsBuilder } from '../../utils/service-optimization/OptionsBuilder';

// Import service operation DTOs
import { 
  UserManagementCommand, 
  UserManagementAction,
  UserSuspensionData,
  UserRoleUpdateData 
} from '../../dtos/service-operations/UserManagementCommand.dto';
import { 
  ProviderManagementCommand, 
  ProviderManagementAction,
  ProviderVerificationData 
} from '../../dtos/service-operations/ProviderManagementCommand.dto';
import { 
  ReportGenerationOptions, 
  ReportType,
  ReportFormat 
} from '../../dtos/service-operations/ReportGenerationOptions.dto';
import { SearchOptions, SearchScope } from '../../dtos/service-operations/SearchOptions.dto';

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

/**
 * User Management Command Implementation
 */
class UserManagementCommandImpl extends CommandBase<ApiResponseDto> {
  constructor(
    private command: UserManagementCommand,
    private userService: IUserService
  ) {
    super({
      adminId: command.adminId,
      timestamp: new Date(),
      metadata: command.metadata
    });
  }

  async execute(): Promise<ApiResponseDto> {
    try {
      let result: any;

      switch (this.command.action) {
        case UserManagementAction.ACTIVATE:
          result = await User.findByIdAndUpdate(
            this.command.userId,
            { status: 'active', updatedAt: new Date() },
            { new: true }
          ).select('-password');
          break;

        case UserManagementAction.DEACTIVATE:
          result = await User.findByIdAndUpdate(
            this.command.userId,
            { status: 'inactive', updatedAt: new Date() },
            { new: true }
          ).select('-password');
          break;

        case UserManagementAction.SUSPEND:
          const suspensionData = this.command.getSuspensionData();
          result = await User.findByIdAndUpdate(
            this.command.userId,
            { 
              status: 'suspended',
              suspendedAt: new Date(),
              suspensionReason: suspensionData?.reason || 'Administrative action',
              updatedAt: new Date()
            },
            { new: true }
          ).select('-password');
          break;

        case UserManagementAction.DELETE:
          await User.findByIdAndDelete(this.command.userId);
          result = { deleted: true };
          break;

        case UserManagementAction.UPDATE_ROLE:
          const roleData = this.command.getRoleUpdateData();
          if (!roleData?.role) {
            throw new ValidationError('Role is required');
          }
          result = await User.findByIdAndUpdate(
            this.command.userId,
            { role: roleData.role, updatedAt: new Date() },
            { new: true }
          ).select('-password');
          break;

        default:
          throw new ValidationError('Invalid action');
      }

      return {
        success: true,
        message: `User ${this.command.action} completed successfully`,
        data: result
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || `Failed to ${this.command.action} user`,
        data: null
      };
    }
  }
}

/**
 * Provider Management Command Implementation
 */
class ProviderManagementCommandImpl extends CommandBase<ApiResponseDto> {
  constructor(
    private command: ProviderManagementCommand,
    private providerService: IProviderService
  ) {
    super({
      adminId: command.adminId,
      timestamp: new Date(),
      metadata: command.metadata
    });
  }

  async execute(): Promise<ApiResponseDto> {
    try {
      let result: any;

      switch (this.command.action) {
        case ProviderManagementAction.APPROVE:
          result = await ServiceProvider.findByIdAndUpdate(
            this.command.providerId,
            { 
              status: 'active',
              approvedAt: new Date(),
              approvedBy: this.command.adminId,
              updatedAt: new Date()
            },
            { new: true }
          );
          break;

        case ProviderManagementAction.REJECT:
          result = await ServiceProvider.findByIdAndUpdate(
            this.command.providerId,
            { 
              status: 'rejected',
              rejectedAt: new Date(),
              rejectedBy: this.command.adminId,
              rejectionReason: this.command.reason,
              updatedAt: new Date()
            },
            { new: true }
          );
          break;

        case ProviderManagementAction.UPDATE_VERIFICATION:
          const verificationData = this.command.getVerificationData();
          result = await ServiceProvider.findByIdAndUpdate(
            this.command.providerId,
            { 
              isVerified: verificationData?.isVerified,
              verificationLevel: verificationData?.verificationLevel,
              verifiedDocuments: verificationData?.verifiedDocuments,
              verificationNotes: verificationData?.verificationNotes,
              verifiedBy: verificationData?.verifiedBy || this.command.adminId,
              verifiedAt: new Date(),
              updatedAt: new Date()
            },
            { new: true }
          );
          break;

        default:
          throw new ValidationError('Invalid action');
      }

      return {
        success: true,
        message: `Provider ${this.command.action} completed successfully`,
        data: result
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || `Failed to ${this.command.action} provider`,
        data: null
      };
    }
  }
}

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 6
})
export class OptimizedAdminService implements IAdminService {
  private commandInvoker: CommandInvoker;

  constructor(
    @Inject('UserService') private userService: IUserService,
    @Inject('ProviderService') private providerService: IProviderService,
    @Inject('ServiceRequestService') private serviceRequestService: IServiceRequestService,
    @Inject('ReviewService') private reviewService: IReviewService
  ) {
    this.commandInvoker = new CommandInvoker();
  }

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('🚀 OptimizedAdminService initialized with modern patterns');
  }

  /**
   * OPTIMIZED: User management with Command pattern
   * 
   * Before: manageUser(adminId: string, userId: string, action: string, data?: any)
   * After: manageUser(command: UserManagementCommand)
   */
  @Log('Managing user with command pattern')
  @Retryable(2)
  async manageUser(command: UserManagementCommand): Promise<ApiResponseDto> {
    await this.verifyAdminPermissions(command.adminId);

    if (!command.isValid()) {
      throw new ValidationError('Invalid user management command');
    }

    const commandImpl = new UserManagementCommandImpl(command, this.userService);
    return await this.commandInvoker.execute(commandImpl);
  }

  /**
   * OPTIMIZED: Provider management with Command pattern
   * 
   * Before: manageProvider(adminId: string, providerId: string, action: string, data?: any)
   * After: manageProvider(command: ProviderManagementCommand)
   */
  @Log('Managing provider with command pattern')
  @Retryable(2)
  async manageProvider(command: ProviderManagementCommand): Promise<ApiResponseDto> {
    await this.verifyAdminPermissions(command.adminId);

    if (!command.isValid()) {
      throw new ValidationError('Invalid provider management command');
    }

    const commandImpl = new ProviderManagementCommandImpl(command, this.providerService);
    return await this.commandInvoker.execute(commandImpl);
  }

  /**
   * OPTIMIZED: Report generation with structured options
   * 
   * Before: generateReport(adminId: string, reportType: string, dateRange?: { from: Date; to: Date })
   * After: generateReport(options: ReportGenerationOptions)
   */
  @Log('Generating report with structured options')
  @Cached(30 * 60 * 1000) // Cache for 30 minutes
  async generateReport(options: ReportGenerationOptions): Promise<ApiResponseDto> {
    await this.verifyAdminPermissions(options.adminId);

    if (!options.isValid()) {
      throw new ValidationError('Invalid report generation options');
    }

    try {
      let reportData: any;

      switch (options.reportType) {
        case ReportType.USER_ACTIVITY:
          reportData = await this.generateUserActivityReport(options);
          break;
        case ReportType.PROVIDER_PERFORMANCE:
          reportData = await this.generateProviderPerformanceReport(options);
          break;
        case ReportType.SERVICE_REQUESTS:
          reportData = await this.generateServiceRequestReport(options);
          break;
        case ReportType.REVENUE:
          reportData = await this.generateRevenueReport(options);
          break;
        default:
          throw new ValidationError('Invalid report type');
      }

      return {
        success: true,
        message: `${options.reportType} report generated successfully`,
        data: {
          reportType: options.reportType,
          title: options.title,
          dateRange: options.dateRange,
          format: options.format,
          generatedAt: new Date(),
          data: reportData,
          metadata: options.includeMetadata ? options.metadata : undefined
        }
      };
    } catch (error: any) {
      throw new ValidationError(error.message || 'Failed to generate report');
    }
  }

  /**
   * OPTIMIZED: User search with advanced options
   * 
   * Before: getAllUsers(filters: any, page: number, limit: number, sortBy?: string, sortOrder?: string)
   * After: searchUsers(searchOptions: SearchOptions)
   */
  @Log('Searching users with advanced options')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async searchUsers(searchOptions: SearchOptions): Promise<PaginatedResult<any>> {
    if (!searchOptions.isValid()) {
      throw new ValidationError('Invalid search options');
    }

    try {
      // Build query using FilterBuilder
      const queryBuilder = FilterBuilder.create();
      
      // Add search term if provided
      if (searchOptions.searchTerm) {
        queryBuilder.useOr()
          .contains('firstName', searchOptions.searchTerm)
          .contains('lastName', searchOptions.searchTerm)
          .contains('email', searchOptions.searchTerm);
      }

      // Add user-specific filters
      const userOptions = searchOptions.getUserOptions();
      if (userOptions?.roles && userOptions.roles.length > 0) {
        queryBuilder.in('role', userOptions.roles);
      }

      if (userOptions?.statuses && userOptions.statuses.length > 0) {
        queryBuilder.in('status', userOptions.statuses);
      }

      if (userOptions?.verifiedOnly) {
        queryBuilder.equals('isVerified', true);
      }

      // Add date range filters
      if (userOptions?.registrationDateRange?.isValid()) {
        queryBuilder.dateRange('createdAt', 
          userOptions.registrationDateRange.from, 
          userOptions.registrationDateRange.to
        );
      }

      // Build final query and sort
      const query = queryBuilder.buildMongoQuery();
      const sort = searchOptions.sort?.toMongoSort() || { createdAt: -1 };

      // Execute query with pagination
      const pagination = searchOptions.pagination || new PaginationOptions();
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort(sort)
          .skip(pagination.getSkip())
          .limit(pagination.limit),
        User.countDocuments(query)
      ]);

      return PaginatedResult.create(users, total, pagination, 'Users retrieved successfully');
    } catch (error: any) {
      throw new ValidationError('Failed to search users');
    }
  }

  /**
   * OPTIMIZED: Provider search with location and rating filters
   * 
   * Before: searchProviders(filters: ProviderFiltersDto, page: number, limit: number)
   * After: searchProviders(searchOptions: SearchOptions)
   */
  @Log('Searching providers with advanced filters')
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async searchProviders(searchOptions: SearchOptions): Promise<PaginatedResult<any>> {
    if (!searchOptions.isValid()) {
      throw new ValidationError('Invalid search options');
    }

    try {
      const queryBuilder = FilterBuilder.create();
      
      // Base filter for active providers
      queryBuilder.equals('status', 'active');

      // Add search term
      if (searchOptions.searchTerm) {
        queryBuilder.useOr()
          .contains('businessName', searchOptions.searchTerm)
          .contains('description', searchOptions.searchTerm)
          .contains('services', searchOptions.searchTerm);
      }

      // Add provider-specific filters
      const providerOptions = searchOptions.getProviderOptions();
      
      if (providerOptions?.services && providerOptions.services.length > 0) {
        queryBuilder.in('services', providerOptions.services);
      }

      if (providerOptions?.verifiedOnly) {
        queryBuilder.equals('isVerified', true);
      }

      if (providerOptions?.availableOnly) {
        queryBuilder.equals('acceptingNewRequests', true);
      }

      // Add rating filter
      if (providerOptions?.rating?.minRating) {
        queryBuilder.greaterThanOrEqual('averageRating', providerOptions.rating.minRating);
      }

      // Add price range filter
      if (providerOptions?.priceRange) {
        if (providerOptions.priceRange.min) {
          queryBuilder.greaterThanOrEqual('hourlyRate', providerOptions.priceRange.min);
        }
        if (providerOptions.priceRange.max) {
          queryBuilder.lessThanOrEqual('hourlyRate', providerOptions.priceRange.max);
        }
      }

      // Add location filter (if provided)
      let query = queryBuilder.buildMongoQuery();
      if (providerOptions?.location) {
        query.serviceArea = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [providerOptions.location.longitude, providerOptions.location.latitude]
            },
            $maxDistance: (providerOptions.location.radius || 10) * 1000 // Convert to meters
          }
        };
      }

      // Execute query with pagination
      const pagination = searchOptions.pagination || new PaginationOptions();
      const sort = searchOptions.sort?.toMongoSort() || { averageRating: -1, createdAt: -1 };

      const [providers, total] = await Promise.all([
        ServiceProvider.find(query)
          .populate('userId', '-password')
          .sort(sort)
          .skip(pagination.getSkip())
          .limit(pagination.limit),
        ServiceProvider.countDocuments(query)
      ]);

      return PaginatedResult.create(providers, total, pagination, 'Providers retrieved successfully');
    } catch (error: any) {
      throw new ValidationError('Failed to search providers');
    }
  }

  /**
   * OPTIMIZED: Fluent interface for building admin queries
   * 
   * Example usage:
   * const users = await adminService.query()
   *   .users()
   *   .withRole('customer')
   *   .activeOnly()
   *   .registeredAfter(new Date('2024-01-01'))
   *   .sortBy('createdAt', 'desc')
   *   .paginate(1, 20)
   *   .execute();
   */
  query() {
    return new AdminQueryBuilder(this);
  }

  // Backward compatibility methods (delegate to optimized versions)
  async getAllUsers(filters: any = {}, page: number = 1, limit: number = 10, sortBy?: string, sortOrder?: string): Promise<PaginatedResponseDto> {
    const searchOptions = SearchOptionsBuilder.fromQuery({
      ...filters,
      page,
      limit,
      sortBy,
      sortOrder
    }).build();

    const result = await this.searchUsers(searchOptions);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      pagination: {
        currentPage: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        totalItems: result.pagination.totalItems,
        itemsPerPage: result.pagination.itemsPerPage
      }
    };
  }

  // Legacy method signatures maintained for backward compatibility
  async manageUserLegacy(adminId: string, userId: string, action: string, data?: any): Promise<ApiResponseDto> {
    const command = new UserManagementCommand(adminId, userId, action as UserManagementAction, data);
    return this.manageUser(command);
  }

  async manageProviderLegacy(adminId: string, providerId: string, action: string, data?: any): Promise<ApiResponseDto> {
    const command = new ProviderManagementCommand(adminId, providerId, action as ProviderManagementAction, data);
    return this.manageProvider(command);
  }

  async generateReportLegacy(adminId: string, reportType: string, dateRange?: { from: Date; to: Date }): Promise<ApiResponseDto> {
    const options = new ReportGenerationOptions(adminId, reportType as ReportType, { dateRange });
    return this.generateReport(options);
  }

  // Private helper methods
  private async verifyAdminPermissions(adminId: string): Promise<void> {
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new AuthenticationError('Admin permissions required');
    }
  }

  private async generateUserActivityReport(options: ReportGenerationOptions): Promise<any> {
    // Implementation would use the specific options
    const userOptions = options.getUserActivityOptions();
    // ... implementation
    return { placeholder: 'User activity report data' };
  }

  private async generateProviderPerformanceReport(options: ReportGenerationOptions): Promise<any> {
    const providerOptions = options.getProviderPerformanceOptions();
    // ... implementation
    return { placeholder: 'Provider performance report data' };
  }

  private async generateServiceRequestReport(options: ReportGenerationOptions): Promise<any> {
    const requestOptions = options.getServiceRequestsOptions();
    // ... implementation
    return { placeholder: 'Service request report data' };
  }

  private async generateRevenueReport(options: ReportGenerationOptions): Promise<any> {
    const revenueOptions = options.getRevenueOptions();
    // ... implementation
    return { placeholder: 'Revenue report data' };
  }

  // Required interface methods (simplified implementations)
  async getDashboard(adminId: string): Promise<AdminDashboardDto> {
    // Implementation would use optimized patterns
    return {} as AdminDashboardDto;
  }

  async getPlatformStatistics(): Promise<PlatformStatisticsDto> {
    // Implementation would use optimized patterns
    return {} as PlatformStatisticsDto;
  }
}

/**
 * Fluent query builder for admin operations
 */
class AdminQueryBuilder {
  private searchOptions: SearchOptions;

  constructor(private adminService: OptimizedAdminService) {
    this.searchOptions = new SearchOptions();
  }

  users(): AdminQueryBuilder {
    this.searchOptions.scope = SearchScope.USERS;
    return this;
  }

  providers(): AdminQueryBuilder {
    this.searchOptions.scope = SearchScope.PROVIDERS;
    return this;
  }

  withRole(role: string): AdminQueryBuilder {
    if (!this.searchOptions.specificOptions) {
      this.searchOptions.specificOptions = {};
    }
    (this.searchOptions.specificOptions as any).roles = [role];
    return this;
  }

  activeOnly(): AdminQueryBuilder {
    if (!this.searchOptions.specificOptions) {
      this.searchOptions.specificOptions = {};
    }
    (this.searchOptions.specificOptions as any).statuses = ['active'];
    return this;
  }

  registeredAfter(date: Date): AdminQueryBuilder {
    if (!this.searchOptions.specificOptions) {
      this.searchOptions.specificOptions = {};
    }
    (this.searchOptions.specificOptions as any).registrationDateRange = { from: date };
    return this;
  }

  sortBy(field: string, direction: 'asc' | 'desc' = 'asc'): AdminQueryBuilder {
    this.searchOptions.sort = { field, direction };
    return this;
  }

  paginate(page: number, limit: number): AdminQueryBuilder {
    this.searchOptions.pagination = new PaginationOptions(page, limit);
    return this;
  }

  async execute(): Promise<PaginatedResult<any>> {
    if (this.searchOptions.scope === SearchScope.USERS) {
      return this.adminService.searchUsers(this.searchOptions);
    } else if (this.searchOptions.scope === SearchScope.PROVIDERS) {
      return this.adminService.searchProviders(this.searchOptions);
    }
    throw new Error('Invalid query scope');
  }
}
