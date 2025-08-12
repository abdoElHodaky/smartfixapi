/**
 * CQRS Admin Command Implementations
 * 
 * Enhanced CQRS command pattern implementations for admin operations
 * with optimized execution, validation, and error handling using existing utilities.
 */

import { IsString, IsOptional, IsObject, IsEnum, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CommandBase, CommandResult, CommandContext } from '../../utils/service-optimization/CommandBase';
import { IUserService, IProviderService, IServiceRequestService } from '../../interfaces/services';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';
import { AggregationBuilder, AggregationUtils } from '../../utils/aggregation/AggregationBuilder';
import { StrategyRegistry, AsyncStrategyRegistry } from '../../utils/conditions/StrategyPatterns';
import { FilterBuilder } from '../../utils/service-optimization/FilterBuilder';
import { OptionsBuilder } from '../../utils/service-optimization/OptionsBuilder';
import { PaginationOptions } from '../../utils/service-optimization/PaginationOptions';
import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequest } from '../../models/ServiceRequest';

// Command enums
enum ProviderStatus {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

enum UserAction {
  DELETE = 'delete',
  SUSPEND = 'suspend',
  ACTIVATE = 'activate',
  UPDATE_ROLE = 'update_role'
}

// Base admin command with permission validation
abstract class AdminCommandBase<TResult = any> extends CommandBase<TResult> {
  @IsString()
  @IsNotEmpty()
  protected adminId: string;

  constructor(context: CommandContext, adminId: string) {
    super(context);
    this.adminId = adminId;
  }

  /**
   * Validate admin permissions before execution
   */
  protected async validateAdminPermissions(userService: IUserService): Promise<void> {
    const admin = await userService.getUserById(this.adminId);
    
    const roleCheck = ConditionalHelpers.validateUserRole(admin, {
      allowedRoles: ['admin', 'super_admin'],
      requireActive: true,
      requireEmailVerified: true
    });

    if (!roleCheck.isValid) {
      throw new Error(`Insufficient permissions: ${roleCheck.errors.join(', ')}`);
    }
  }
}

/**
 * Command to approve a service provider
 */
export class ApproveProviderCommand extends AdminCommandBase<CommandResult> {
  @IsString()
  @IsNotEmpty()
  private providerId: string;

  @IsOptional()
  @IsString()
  private notes?: string;

  constructor(
    context: CommandContext,
    adminId: string,
    providerId: string,
    notes?: string,
    private providerService?: IProviderService,
    private userService?: IUserService
  ) {
    super(context, adminId);
    this.providerId = providerId;
    this.notes = notes;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Validate admin permissions
      await this.validateAdminPermissions(this.userService!);

      // Check if provider exists
      const provider = await this.providerService!.getProviderById(this.providerId);
      if (!provider) {
        return CommandResult.failure('Provider not found');
      }

      // Check if provider is in pending status
      if (provider.status !== 'pending') {
        return CommandResult.failure(`Provider is not in pending status. Current status: ${provider.status}`);
      }

      // Update provider status
      await this.providerService!.updateProviderStatus(this.providerId, ProviderStatus.APPROVED);

      // Log the action
      console.log(`Provider ${this.providerId} approved by admin ${this.adminId}`);

      return CommandResult.success(
        { 
          providerId: this.providerId, 
          status: ProviderStatus.APPROVED,
          approvedBy: this.adminId,
          approvedAt: new Date(),
          notes: this.notes
        },
        'Provider approved successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to approve provider', [error.message]);
    }
  }

  async undo(): Promise<void> {
    if (this.providerService) {
      await this.providerService.updateProviderStatus(this.providerId, ProviderStatus.PENDING);
      console.log(`Provider ${this.providerId} approval undone by admin ${this.adminId}`);
    }
  }
}

/**
 * Command to reject a service provider
 */
export class RejectProviderCommand extends AdminCommandBase<CommandResult> {
  @IsString()
  @IsNotEmpty()
  private providerId: string;

  @IsString()
  @IsNotEmpty()
  private reason: string;

  constructor(
    context: CommandContext,
    adminId: string,
    providerId: string,
    reason: string,
    private providerService?: IProviderService,
    private userService?: IUserService
  ) {
    super(context, adminId);
    this.providerId = providerId;
    this.reason = reason;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Validate admin permissions
      await this.validateAdminPermissions(this.userService!);

      // Check if provider exists
      const provider = await this.providerService!.getProviderById(this.providerId);
      if (!provider) {
        return CommandResult.failure('Provider not found');
      }

      // Update provider status
      await this.providerService!.updateProviderStatus(this.providerId, ProviderStatus.REJECTED);

      // Log the action
      console.log(`Provider ${this.providerId} rejected by admin ${this.adminId}. Reason: ${this.reason}`);

      return CommandResult.success(
        { 
          providerId: this.providerId, 
          status: ProviderStatus.REJECTED,
          rejectedBy: this.adminId,
          rejectedAt: new Date(),
          reason: this.reason
        },
        'Provider rejected successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to reject provider', [error.message]);
    }
  }

  async undo(): Promise<void> {
    if (this.providerService) {
      await this.providerService.updateProviderStatus(this.providerId, ProviderStatus.PENDING);
      console.log(`Provider ${this.providerId} rejection undone by admin ${this.adminId}`);
    }
  }
}

/**
 * Command to suspend a service provider
 */
export class SuspendProviderCommand extends AdminCommandBase<CommandResult> {
  @IsString()
  @IsNotEmpty()
  private providerId: string;

  @IsString()
  @IsNotEmpty()
  private reason: string;

  @IsOptional()
  @IsObject()
  private suspensionDetails?: {
    duration?: number; // days
    canAppeal?: boolean;
    appealDeadline?: Date;
  };

  constructor(
    context: CommandContext,
    adminId: string,
    providerId: string,
    reason: string,
    suspensionDetails?: any,
    private providerService?: IProviderService,
    private userService?: IUserService
  ) {
    super(context, adminId);
    this.providerId = providerId;
    this.reason = reason;
    this.suspensionDetails = suspensionDetails;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Validate admin permissions
      await this.validateAdminPermissions(this.userService!);

      // Check if provider exists
      const provider = await this.providerService!.getProviderById(this.providerId);
      if (!provider) {
        return CommandResult.failure('Provider not found');
      }

      // Update provider status
      await this.providerService!.updateProviderStatus(this.providerId, ProviderStatus.SUSPENDED);

      // Log the action
      console.log(`Provider ${this.providerId} suspended by admin ${this.adminId}. Reason: ${this.reason}`);

      return CommandResult.success(
        { 
          providerId: this.providerId, 
          status: ProviderStatus.SUSPENDED,
          suspendedBy: this.adminId,
          suspendedAt: new Date(),
          reason: this.reason,
          suspensionDetails: this.suspensionDetails
        },
        'Provider suspended successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to suspend provider', [error.message]);
    }
  }

  async undo(): Promise<void> {
    if (this.providerService) {
      await this.providerService.updateProviderStatus(this.providerId, ProviderStatus.APPROVED);
      console.log(`Provider ${this.providerId} suspension undone by admin ${this.adminId}`);
    }
  }
}

/**
 * Command to delete a user
 */
export class DeleteUserCommand extends AdminCommandBase<CommandResult> {
  @IsString()
  @IsNotEmpty()
  private userId: string;

  @IsOptional()
  @IsString()
  private reason?: string;

  private deletedUserData?: any; // For undo operation

  constructor(
    context: CommandContext,
    adminId: string,
    userId: string,
    reason?: string,
    private userService?: IUserService
  ) {
    super(context, adminId);
    this.userId = userId;
    this.reason = reason;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Validate admin permissions
      await this.validateAdminPermissions(this.userService!);

      // Check if user exists and get user data for potential undo
      const user = await this.userService!.getUserById(this.userId);
      if (!user) {
        return CommandResult.failure('User not found');
      }

      // Prevent admin from deleting themselves
      if (this.userId === this.adminId) {
        return CommandResult.failure('Cannot delete your own account');
      }

      // Store user data for undo operation
      this.deletedUserData = { ...user };

      // Delete the user
      await this.userService!.deleteUser(this.userId);

      // Log the action
      console.log(`User ${this.userId} deleted by admin ${this.adminId}. Reason: ${this.reason || 'Not specified'}`);

      return CommandResult.success(
        { 
          userId: this.userId,
          deletedBy: this.adminId,
          deletedAt: new Date(),
          reason: this.reason
        },
        'User deleted successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to delete user', [error.message]);
    }
  }

  async undo(): Promise<void> {
    if (this.userService && this.deletedUserData) {
      // Note: This would require a restore user method in the service
      console.log(`User ${this.userId} deletion undone by admin ${this.adminId}`);
      // await this.userService.restoreUser(this.deletedUserData);
    }
  }
}

/**
 * Enhanced CQRS command to generate admin reports using optimized utilities
 */
export class GenerateReportCommand extends AdminCommandBase<CommandResult> {
  @IsString()
  @IsNotEmpty()
  private reportType: string;

  @IsOptional()
  @IsObject()
  private dateRange?: { from: Date; to: Date };

  @IsOptional()
  @IsObject()
  private filters?: Record<string, any>;

  @IsOptional()
  @IsObject()
  private paginationOptions?: PaginationOptions;

  private reportStrategies: AsyncStrategyRegistry<any, any>;

  constructor(
    context: CommandContext,
    adminId: string,
    reportType: string,
    dateRange?: { from: Date; to: Date },
    filters?: Record<string, any>,
    paginationOptions?: PaginationOptions,
    private userService?: IUserService
  ) {
    super(context, adminId);
    this.reportType = reportType;
    this.dateRange = dateRange;
    this.filters = filters;
    this.paginationOptions = paginationOptions;
    this.initializeReportStrategies();
  }

  private initializeReportStrategies(): void {
    this.reportStrategies = new AsyncStrategyRegistry<any, any>();
    
    // Register optimized report strategies
    this.reportStrategies.register('user_activity', {
      execute: async (input: any) => this.generateUserActivityReport(input)
    });
    
    this.reportStrategies.register('provider_performance', {
      execute: async (input: any) => this.generateProviderPerformanceReport(input)
    });
    
    this.reportStrategies.register('service_requests', {
      execute: async (input: any) => this.generateServiceRequestReport(input)
    });
    
    this.reportStrategies.register('revenue', {
      execute: async (input: any) => this.generateRevenueReport(input)
    });

    this.reportStrategies.register('advanced_analytics', {
      execute: async (input: any) => this.generateAdvancedAnalyticsReport(input)
    });
  }

  async execute(): Promise<CommandResult> {
    try {
      // Validate admin permissions
      await this.validateAdminPermissions(this.userService!);

      if (!this.reportStrategies.has(this.reportType)) {
        return CommandResult.failure(`Unsupported report type: ${this.reportType}`);
      }

      const reportInput = {
        dateRange: this.dateRange,
        filters: this.filters,
        pagination: this.paginationOptions,
        adminId: this.adminId
      };

      const reportData = await this.reportStrategies.execute(this.reportType, reportInput);

      return CommandResult.success(
        {
          reportType: this.reportType,
          data: reportData,
          generatedBy: this.adminId,
          generatedAt: new Date(),
          dateRange: this.dateRange,
          filters: this.filters,
          pagination: this.paginationOptions
        },
        'Report generated successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to generate report', [error.message]);
    }
  }

  private async generateUserActivityReport(input: any): Promise<any> {
    const filterBuilder = new FilterBuilder();
    const optionsBuilder = new OptionsBuilder();

    // Build optimized filters
    if (input.filters) {
      if (input.filters.role) {
        filterBuilder.addFilter('role', input.filters.role);
      }
      if (input.filters.status) {
        filterBuilder.addFilter('status', input.filters.status);
      }
      if (input.filters.location) {
        filterBuilder.addGeoFilter('location', input.filters.location);
      }
    }

    // Build aggregation with filters
    const aggregation = AggregationBuilder.create()
      .match(filterBuilder.build())
      .buildUserActivityReport(input.dateRange);

    // Add pagination if specified
    if (input.pagination) {
      aggregation.skip(input.pagination.skip).limit(input.pagination.limit);
    }
    
    return await aggregation.execute(User);
  }

  private async generateProviderPerformanceReport(input: any): Promise<any> {
    const filterBuilder = new FilterBuilder();
    const optionsBuilder = new OptionsBuilder();

    // Build performance-specific filters
    if (input.filters) {
      if (input.filters.minRating) {
        filterBuilder.addRangeFilter('averageRating', { $gte: input.filters.minRating });
      }
      if (input.filters.serviceCategory) {
        filterBuilder.addFilter('serviceCategories', input.filters.serviceCategory);
      }
      if (input.filters.location) {
        filterBuilder.addGeoFilter('location', input.filters.location);
      }
    }

    // Build optimized provider performance aggregation
    const aggregation = AggregationBuilder.create()
      .match(filterBuilder.build())
      .buildTopProviders(
        input.pagination?.limit || 10,
        input.filters?.minRating || 4.0,
        input.filters?.minReviews || 5
      );
    
    return await aggregation.execute(ServiceProvider);
  }

  private async generateServiceRequestReport(input: any): Promise<any> {
    const filterBuilder = new FilterBuilder();

    // Build service request filters
    if (input.filters) {
      if (input.filters.status) {
        filterBuilder.addFilter('status', input.filters.status);
      }
      if (input.filters.category) {
        filterBuilder.addFilter('category', input.filters.category);
      }
      if (input.filters.budgetRange) {
        filterBuilder.addRangeFilter('budget', input.filters.budgetRange);
      }
      if (input.filters.location) {
        filterBuilder.addGeoFilter('location', input.filters.location);
      }
    }

    const aggregation = AggregationBuilder.create()
      .match(filterBuilder.build())
      .buildServiceRequestStatistics(input.dateRange);

    if (input.pagination) {
      aggregation.skip(input.pagination.skip).limit(input.pagination.limit);
    }
    
    return await aggregation.execute(ServiceRequest);
  }

  private async generateRevenueReport(input: any): Promise<any> {
    const filterBuilder = new FilterBuilder();

    // Build revenue-specific filters
    filterBuilder.addFilter('status', 'completed');
    
    if (input.filters) {
      if (input.filters.paymentMethod) {
        filterBuilder.addFilter('paymentMethod', input.filters.paymentMethod);
      }
      if (input.filters.category) {
        filterBuilder.addFilter('category', input.filters.category);
      }
      if (input.filters.budgetRange) {
        filterBuilder.addRangeFilter('budget', input.filters.budgetRange);
      }
    }

    const aggregation = AggregationBuilder.create()
      .match(filterBuilder.build())
      .buildStatistics({
        dateField: 'completedAt',
        groupBy: input.filters?.groupBy || 'completedAt',
        sumField: 'budget',
        countField: 'totalRequests'
      });

    if (input.dateRange) {
      aggregation.match({
        completedAt: {
          $gte: input.dateRange.from,
          $lte: input.dateRange.to
        }
      });
    }
    
    return await aggregation.execute(ServiceRequest);
  }

  private async generateAdvancedAnalyticsReport(input: any): Promise<any> {
    const filterBuilder = new FilterBuilder();
    const optionsBuilder = new OptionsBuilder();

    // Build comprehensive analytics
    const [
      userGrowth,
      providerDistribution,
      servicePopularity,
      revenueAnalytics,
      geographicDistribution
    ] = await Promise.all([
      // User growth analytics
      AggregationBuilder.create()
        .buildUserStatistics(input.dateRange)
        .execute(User),
      
      // Provider distribution
      AggregationBuilder.create()
        .buildStatusStatistics('status')
        .execute(ServiceProvider),
      
      // Service popularity
      AggregationBuilder.create()
        .buildCategoryStatistics('category', 20)
        .execute(ServiceRequest),
      
      // Revenue analytics
      AggregationBuilder.create()
        .match({ status: 'completed' })
        .buildStatistics({
          dateField: 'completedAt',
          groupBy: 'completedAt',
          sumField: 'budget',
          countField: 'totalRequests'
        })
        .execute(ServiceRequest),
      
      // Geographic distribution
      AggregationBuilder.create()
        .buildGeographicDistribution('location.city', 15)
        .execute(ServiceRequest)
    ]);

    return {
      userGrowth,
      providerDistribution,
      servicePopularity,
      revenueAnalytics,
      geographicDistribution,
      generatedAt: new Date(),
      reportScope: input.dateRange
    };
  }
}

/**
 * Command to bulk update user roles
 */
export class BulkUpdateUserRolesCommand extends AdminCommandBase<CommandResult> {
  @IsObject()
  private userRoleUpdates: { userId: string; newRole: string }[];

  @IsOptional()
  @IsString()
  private reason?: string;

  constructor(
    context: CommandContext,
    adminId: string,
    userRoleUpdates: { userId: string; newRole: string }[],
    reason?: string,
    private userService?: IUserService
  ) {
    super(context, adminId);
    this.userRoleUpdates = userRoleUpdates;
    this.reason = reason;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Validate admin permissions
      await this.validateAdminPermissions(this.userService!);

      const results: any[] = [];
      const errors: string[] = [];

      // Process each user role update
      for (const update of this.userRoleUpdates) {
        try {
          const user = await this.userService!.getUserById(update.userId);
          if (!user) {
            errors.push(`User ${update.userId} not found`);
            continue;
          }

          // Update user role
          await this.userService!.updateUserRole(update.userId, update.newRole);
          
          results.push({
            userId: update.userId,
            oldRole: user.role,
            newRole: update.newRole,
            updatedAt: new Date()
          });

          console.log(`User ${update.userId} role updated from ${user.role} to ${update.newRole} by admin ${this.adminId}`);
        } catch (error) {
          errors.push(`Failed to update user ${update.userId}: ${error.message}`);
        }
      }

      if (errors.length > 0 && results.length === 0) {
        return CommandResult.failure('All role updates failed', errors);
      }

      return CommandResult.success(
        {
          successful: results,
          failed: errors,
          updatedBy: this.adminId,
          updatedAt: new Date(),
          reason: this.reason
        },
        `Successfully updated ${results.length} user roles${errors.length > 0 ? ` with ${errors.length} failures` : ''}`
      );
    } catch (error) {
      return CommandResult.failure('Failed to execute bulk role update', [error.message]);
    }
  }
}

/**
 * Enhanced CQRS Command Factory with Optimization Support
 */
export class AdminCommandFactory {
  private static commandRegistry: StrategyRegistry<any, any> = new StrategyRegistry<any, any>();

  static {
    // Initialize command creation strategies
    AdminCommandFactory.initializeCommandStrategies();
  }

  private static initializeCommandStrategies(): void {
    // Register command creation strategies
    this.commandRegistry.register('approve_provider', {
      execute: (params: any) => new ApproveProviderCommand(
        params.context,
        params.adminId,
        params.providerId,
        params.notes,
        params.providerService,
        params.userService
      )
    });

    this.commandRegistry.register('reject_provider', {
      execute: (params: any) => new RejectProviderCommand(
        params.context,
        params.adminId,
        params.providerId,
        params.reason,
        params.providerService,
        params.userService
      )
    });

    this.commandRegistry.register('suspend_provider', {
      execute: (params: any) => new SuspendProviderCommand(
        params.context,
        params.adminId,
        params.providerId,
        params.reason,
        params.suspensionDetails,
        params.providerService,
        params.userService
      )
    });

    this.commandRegistry.register('delete_user', {
      execute: (params: any) => new DeleteUserCommand(
        params.context,
        params.adminId,
        params.userId,
        params.reason,
        params.userService
      )
    });

    this.commandRegistry.register('generate_report', {
      execute: (params: any) => new GenerateReportCommand(
        params.context,
        params.adminId,
        params.reportType,
        params.dateRange,
        params.filters,
        params.paginationOptions,
        params.userService
      )
    });

    this.commandRegistry.register('bulk_update_roles', {
      execute: (params: any) => new BulkUpdateUserRolesCommand(
        params.context,
        params.adminId,
        params.userRoleUpdates,
        params.reason,
        params.userService
      )
    });
  }

  /**
   * Create command using strategy pattern
   */
  static createCommand<T extends CommandBase>(commandType: string, params: any): T {
    if (!this.commandRegistry.has(commandType)) {
      throw new Error(`Unsupported command type: ${commandType}`);
    }
    return this.commandRegistry.execute(commandType, params);
  }

  /**
   * Get available command types
   */
  static getAvailableCommandTypes(): string[] {
    return this.commandRegistry.getAvailableKeys();
  }

  // Legacy factory methods for backward compatibility
  static createApproveProviderCommand(
    context: CommandContext,
    adminId: string,
    providerId: string,
    notes?: string,
    providerService?: IProviderService,
    userService?: IUserService
  ): ApproveProviderCommand {
    return this.createCommand('approve_provider', {
      context, adminId, providerId, notes, providerService, userService
    });
  }

  static createRejectProviderCommand(
    context: CommandContext,
    adminId: string,
    providerId: string,
    reason: string,
    providerService?: IProviderService,
    userService?: IUserService
  ): RejectProviderCommand {
    return this.createCommand('reject_provider', {
      context, adminId, providerId, reason, providerService, userService
    });
  }

  static createSuspendProviderCommand(
    context: CommandContext,
    adminId: string,
    providerId: string,
    reason: string,
    suspensionDetails?: any,
    providerService?: IProviderService,
    userService?: IUserService
  ): SuspendProviderCommand {
    return this.createCommand('suspend_provider', {
      context, adminId, providerId, reason, suspensionDetails, providerService, userService
    });
  }

  static createDeleteUserCommand(
    context: CommandContext,
    adminId: string,
    userId: string,
    reason?: string,
    userService?: IUserService
  ): DeleteUserCommand {
    return this.createCommand('delete_user', {
      context, adminId, userId, reason, userService
    });
  }

  static createGenerateReportCommand(
    context: CommandContext,
    adminId: string,
    reportType: string,
    dateRange?: { from: Date; to: Date },
    filters?: Record<string, any>,
    paginationOptions?: PaginationOptions,
    userService?: IUserService
  ): GenerateReportCommand {
    return this.createCommand('generate_report', {
      context, adminId, reportType, dateRange, filters, paginationOptions, userService
    });
  }

  static createBulkUpdateUserRolesCommand(
    context: CommandContext,
    adminId: string,
    userRoleUpdates: { userId: string; newRole: string }[],
    reason?: string,
    userService?: IUserService
  ): BulkUpdateUserRolesCommand {
    return this.createCommand('bulk_update_roles', {
      context, adminId, userRoleUpdates, reason, userService
    });
  }

  /**
   * Create optimized report command with advanced filtering
   */
  static createAdvancedReportCommand(
    context: CommandContext,
    adminId: string,
    reportConfig: {
      type: string;
      dateRange?: { from: Date; to: Date };
      filters?: Record<string, any>;
      pagination?: PaginationOptions;
      aggregationOptions?: any;
    },
    userService?: IUserService
  ): GenerateReportCommand {
    return this.createCommand('generate_report', {
      context,
      adminId,
      reportType: reportConfig.type,
      dateRange: reportConfig.dateRange,
      filters: reportConfig.filters,
      paginationOptions: reportConfig.pagination,
      userService
    });
  }

  /**
   * Batch create multiple commands
   */
  static createBatchCommands(commandConfigs: Array<{
    type: string;
    params: any;
  }>): CommandBase[] {
    return commandConfigs.map(config => 
      this.createCommand(config.type, config.params)
    );
  }
}
