/**
 * Modern CQRS Admin Command Implementations
 * 
 * Enhanced admin commands using the new CQRS core architecture
 * with optimized execution, validation, and event sourcing capabilities.
 */

// Removed unused class-validator and class-transformer imports
import { 
  BaseCommand, 
  ICommand, 
  ICommandHandler, 
  CommandResult, 
  CommandMetadata
} from '../core';
import { IUserService, IProviderService } from '../../interfaces/services';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';
import { AggregationBuilder } from '../../utils/aggregation/AggregationBuilder';
import { StrategyRegistry, AsyncStrategyRegistry } from '../../utils/conditions/StrategyPatterns';
import { FilterBuilder } from '../../utils/service-optimization/FilterBuilder';
// Removed unused OptionsBuilder import
import { PaginationOptions } from '../../utils/service-optimization/PaginationOptions';
import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequest } from '../../models/ServiceRequest';

// Admin command enums
enum ProviderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  ACTIVE = 'active'
}

// Removed unused UserRole enum

// Admin Events
export class ProviderApprovedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    payload: { providerId: string; adminId: string; notes?: string },
    metadata: EventMetadata
  ) {
    super('PROVIDER_APPROVED', aggregateId, 'Provider', 1, payload, metadata);
  }
}

export class ProviderRejectedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    payload: { providerId: string; adminId: string; reason: string },
    metadata: EventMetadata
  ) {
    super('PROVIDER_REJECTED', aggregateId, 'Provider', 1, payload, metadata);
  }
}

export class ProviderSuspendedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    payload: { providerId: string; adminId: string; reason: string; suspensionDetails?: any },
    metadata: EventMetadata
  ) {
    super('PROVIDER_SUSPENDED', aggregateId, 'Provider', 1, payload, metadata);
  }
}

export class UserDeletedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    payload: { userId: string; adminId: string; reason?: string },
    metadata: EventMetadata
  ) {
    super('USER_DELETED', aggregateId, 'User', 1, payload, metadata);
  }
}

export class ReportGeneratedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    payload: { reportType: string; adminId: string; reportData: any },
    metadata: EventMetadata
  ) {
    super('REPORT_GENERATED', aggregateId, 'Report', 1, payload, metadata);
  }
}

// Admin Commands
export class ApproveProviderCommand extends BaseCommand {
  constructor(
    payload: {
      adminId: string;
      providerId: string;
      notes?: string;
    },
    metadata: CommandMetadata
  ) {
    super('APPROVE_PROVIDER', payload, metadata, payload.providerId);
  }
}

export class RejectProviderCommand extends BaseCommand {
  constructor(
    payload: {
      adminId: string;
      providerId: string;
      reason: string;
    },
    metadata: CommandMetadata
  ) {
    super('REJECT_PROVIDER', payload, metadata, payload.providerId);
  }
}

export class SuspendProviderCommand extends BaseCommand {
  constructor(
    payload: {
      adminId: string;
      providerId: string;
      reason: string;
      suspensionDetails?: any;
    },
    metadata: CommandMetadata
  ) {
    super('SUSPEND_PROVIDER', payload, metadata, payload.providerId);
  }
}

export class DeleteUserCommand extends BaseCommand {
  constructor(
    payload: {
      adminId: string;
      userId: string;
      reason?: string;
    },
    metadata: CommandMetadata
  ) {
    super('DELETE_USER', payload, metadata, payload.userId);
  }
}

export class GenerateReportCommand extends BaseCommand {
  constructor(
    payload: {
      adminId: string;
      reportType: string;
      dateRange?: { from: Date; to: Date };
      filters?: Record<string, any>;
      paginationOptions?: PaginationOptions;
    },
    metadata: CommandMetadata
  ) {
    super('GENERATE_REPORT', payload, metadata);
  }
}

export class BulkUpdateUserRolesCommand extends BaseCommand {
  constructor(
    payload: {
      adminId: string;
      userRoleUpdates: { userId: string; newRole: string }[];
      reason?: string;
    },
    metadata: CommandMetadata
  ) {
    super('BULK_UPDATE_USER_ROLES', payload, metadata);
  }
}

// Command Handlers
export class ApproveProviderHandler implements ICommandHandler<ApproveProviderCommand> {
  constructor(
    private providerService: IProviderService,
    private userService: IUserService
  ) {}

  canHandle(command: ICommand): boolean {
    return command.type === 'APPROVE_PROVIDER';
  }

  async handle(command: ApproveProviderCommand): Promise<CommandResult> {
    try {
      // Validate admin permissions
      await this.validateAdminPermissions(command.payload.adminId);

      // Approve provider
      await this.providerService.updateProviderStatus(
        command.payload.providerId,
        ProviderStatus.APPROVED
      );

      // Create event
      const event = new ProviderApprovedEvent(
        command.payload.providerId,
        {
          providerId: command.payload.providerId,
          adminId: command.payload.adminId,
          notes: command.payload.notes
        },
        CQRSUtils.createEventMetadata(
          command.payload.adminId,
          command.metadata.correlationId,
          command.id
        )
      );

      return {
        success: true,
        data: {
          providerId: command.payload.providerId,
          status: ProviderStatus.APPROVED,
          approvedBy: command.payload.adminId,
          approvedAt: new Date(),
          notes: command.payload.notes
        },
        events: [event]
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async validateAdminPermissions(adminId: string): Promise<void> {
    const admin = await this.userService.getUserById(adminId);
    
    if (!admin) {
      throw new Error('Admin user not found');
    }

    const roleCheck = ConditionalHelpers.validateUserRole(admin, {
      allowedRoles: ['admin', 'super_admin'],
      requireActive: true,
      requireEmailVerified: true
    });

    if (!roleCheck.isValid) {
      throw new Error(`Insufficient admin permissions: ${roleCheck.errors.join(', ')}`);
    }
  }
}

export class RejectProviderHandler implements ICommandHandler<RejectProviderCommand> {
  constructor(
    private providerService: IProviderService,
    private userService: IUserService
  ) {}

  canHandle(command: ICommand): boolean {
    return command.type === 'REJECT_PROVIDER';
  }

  async handle(command: RejectProviderCommand): Promise<CommandResult> {
    try {
      // Validate admin permissions
      await this.validateAdminPermissions(command.payload.adminId);

      // Reject provider
      await this.providerService.updateProviderStatus(
        command.payload.providerId,
        ProviderStatus.REJECTED
      );

      // Create event
      const event = new ProviderRejectedEvent(
        command.payload.providerId,
        {
          providerId: command.payload.providerId,
          adminId: command.payload.adminId,
          reason: command.payload.reason
        },
        CQRSUtils.createEventMetadata(
          command.payload.adminId,
          command.metadata.correlationId,
          command.id
        )
      );

      return {
        success: true,
        data: {
          providerId: command.payload.providerId,
          status: ProviderStatus.REJECTED,
          rejectedBy: command.payload.adminId,
          rejectedAt: new Date(),
          reason: command.payload.reason
        },
        events: [event]
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async validateAdminPermissions(adminId: string): Promise<void> {
    const admin = await this.userService.getUserById(adminId);
    
    if (!admin) {
      throw new Error('Admin user not found');
    }

    const roleCheck = ConditionalHelpers.validateUserRole(admin, {
      allowedRoles: ['admin', 'super_admin'],
      requireActive: true,
      requireEmailVerified: true
    });

    if (!roleCheck.isValid) {
      throw new Error(`Insufficient admin permissions: ${roleCheck.errors.join(', ')}`);
    }
  }
}

export class SuspendProviderHandler implements ICommandHandler<SuspendProviderCommand> {
  constructor(
    private providerService: IProviderService,
    private userService: IUserService
  ) {}

  canHandle(command: ICommand): boolean {
    return command.type === 'SUSPEND_PROVIDER';
  }

  async handle(command: SuspendProviderCommand): Promise<CommandResult> {
    try {
      // Validate admin permissions
      await this.validateAdminPermissions(command.payload.adminId);

      // Suspend provider
      await this.providerService.updateProviderStatus(
        command.payload.providerId,
        ProviderStatus.SUSPENDED
      );

      // Create event
      const event = new ProviderSuspendedEvent(
        command.payload.providerId,
        {
          providerId: command.payload.providerId,
          adminId: command.payload.adminId,
          reason: command.payload.reason,
          suspensionDetails: command.payload.suspensionDetails
        },
        CQRSUtils.createEventMetadata(
          command.payload.adminId,
          command.metadata.correlationId,
          command.id
        )
      );

      return {
        success: true,
        data: {
          providerId: command.payload.providerId,
          status: ProviderStatus.SUSPENDED,
          suspendedBy: command.payload.adminId,
          suspendedAt: new Date(),
          reason: command.payload.reason,
          suspensionDetails: command.payload.suspensionDetails
        },
        events: [event]
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async validateAdminPermissions(adminId: string): Promise<void> {
    const admin = await this.userService.getUserById(adminId);
    
    if (!admin) {
      throw new Error('Admin user not found');
    }

    const roleCheck = ConditionalHelpers.validateUserRole(admin, {
      allowedRoles: ['admin', 'super_admin'],
      requireActive: true,
      requireEmailVerified: true
    });

    if (!roleCheck.isValid) {
      throw new Error(`Insufficient admin permissions: ${roleCheck.errors.join(', ')}`);
    }
  }
}

export class GenerateReportHandler implements ICommandHandler<GenerateReportCommand> {
  constructor(
    private userService: IUserService
  ) {}

  canHandle(command: ICommand): boolean {
    return command.type === 'GENERATE_REPORT';
  }

  async handle(command: GenerateReportCommand): Promise<CommandResult> {
    try {
      // Validate admin permissions
      await this.validateAdminPermissions(command.payload.adminId);

      // Generate report based on type
      const reportStrategies = new AsyncStrategyRegistry<any, any>();

      // Register report strategies
      reportStrategies.register('user_activity', {
        execute: async (input: any) => this.generateUserActivityReport(input)
      });

      reportStrategies.register('provider_performance', {
        execute: async (input: any) => this.generateProviderPerformanceReport(input)
      });

      reportStrategies.register('service_requests', {
        execute: async (input: any) => this.generateServiceRequestReport(input)
      });

      reportStrategies.register('revenue', {
        execute: async (input: any) => this.generateRevenueReport(input)
      });

      if (!reportStrategies.has(command.payload.reportType)) {
        throw new Error(`Unsupported report type: ${command.payload.reportType}`);
      }

      const reportInput = {
        dateRange: command.payload.dateRange,
        filters: command.payload.filters,
        pagination: command.payload.paginationOptions,
        adminId: command.payload.adminId
      };

      const reportData = await reportStrategies.execute(command.payload.reportType, reportInput);

      // Create event
      const event = new ReportGeneratedEvent(
        `report_${Date.now()}`,
        {
          reportType: command.payload.reportType,
          adminId: command.payload.adminId,
          reportData
        },
        CQRSUtils.createEventMetadata(
          command.payload.adminId,
          command.metadata.correlationId,
          command.id
        )
      );

      return {
        success: true,
        data: {
          reportType: command.payload.reportType,
          data: reportData,
          generatedBy: command.payload.adminId,
          generatedAt: new Date(),
          dateRange: command.payload.dateRange,
          filters: command.payload.filters,
          pagination: command.payload.paginationOptions
        },
        events: [event]
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async validateAdminPermissions(adminId: string): Promise<void> {
    const admin = await this.userService.getUserById(adminId);
    
    if (!admin) {
      throw new Error('Admin user not found');
    }

    const roleCheck = ConditionalHelpers.validateUserRole(admin, {
      allowedRoles: ['admin', 'super_admin'],
      requireActive: true,
      requireEmailVerified: true
    });

    if (!roleCheck.isValid) {
      throw new Error(`Insufficient admin permissions: ${roleCheck.errors.join(', ')}`);
    }
  }

  private async generateUserActivityReport(input: any): Promise<any> {
    const filterBuilder = new FilterBuilder();

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

    const aggregation = AggregationBuilder.create()
      .match(filterBuilder.build())
      .buildUserActivityReport(input.dateRange);

    if (input.pagination) {
      aggregation.skip(input.pagination.skip).limit(input.pagination.limit);
    }
    
    return await aggregation.execute(User);
  }

  private async generateProviderPerformanceReport(input: any): Promise<any> {
    const filterBuilder = new FilterBuilder();

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
}

// Modern Command Factory using CQRS Core
export class ModernAdminCommandFactory {
  private static commandRegistry: StrategyRegistry<any, any> = new StrategyRegistry<any, any>();

  static {
    ModernAdminCommandFactory.initializeCommandStrategies();
  }

  private static initializeCommandStrategies(): void {
    this.commandRegistry.register('approve_provider', {
      execute: (params: any) => new ApproveProviderCommand(
        {
          adminId: params.adminId,
          providerId: params.providerId,
          notes: params.notes
        },
        params.metadata
      )
    });

    this.commandRegistry.register('reject_provider', {
      execute: (params: any) => new RejectProviderCommand(
        {
          adminId: params.adminId,
          providerId: params.providerId,
          reason: params.reason
        },
        params.metadata
      )
    });

    this.commandRegistry.register('suspend_provider', {
      execute: (params: any) => new SuspendProviderCommand(
        {
          adminId: params.adminId,
          providerId: params.providerId,
          reason: params.reason,
          suspensionDetails: params.suspensionDetails
        },
        params.metadata
      )
    });

    this.commandRegistry.register('delete_user', {
      execute: (params: any) => new DeleteUserCommand(
        {
          adminId: params.adminId,
          userId: params.userId,
          reason: params.reason
        },
        params.metadata
      )
    });

    this.commandRegistry.register('generate_report', {
      execute: (params: any) => new GenerateReportCommand(
        {
          adminId: params.adminId,
          reportType: params.reportType,
          dateRange: params.dateRange,
          filters: params.filters,
          paginationOptions: params.paginationOptions
        },
        params.metadata
      )
    });

    this.commandRegistry.register('bulk_update_roles', {
      execute: (params: any) => new BulkUpdateUserRolesCommand(
        {
          adminId: params.adminId,
          userRoleUpdates: params.userRoleUpdates,
          reason: params.reason
        },
        params.metadata
      )
    });
  }

  static createCommand<T extends BaseCommand>(commandType: string, params: any): T {
    if (!this.commandRegistry.has(commandType)) {
      throw new Error(`Unsupported command type: ${commandType}`);
    }
    return this.commandRegistry.execute(commandType, params);
  }

  static getAvailableCommandTypes(): string[] {
    return this.commandRegistry.getAvailableKeys();
  }

  // Convenience methods
  static createApproveProviderCommand(
    adminId: string,
    providerId: string,
    notes?: string,
    metadata?: CommandMetadata
  ): ApproveProviderCommand {
    return this.createCommand('approve_provider', {
      adminId,
      providerId,
      notes,
      metadata: metadata || CQRSUtils.createCommandMetadata(adminId)
    });
  }

  static createRejectProviderCommand(
    adminId: string,
    providerId: string,
    reason: string,
    metadata?: CommandMetadata
  ): RejectProviderCommand {
    return this.createCommand('reject_provider', {
      adminId,
      providerId,
      reason,
      metadata: metadata || CQRSUtils.createCommandMetadata(adminId)
    });
  }

  static createGenerateReportCommand(
    adminId: string,
    reportType: string,
    options?: {
      dateRange?: { from: Date; to: Date };
      filters?: Record<string, any>;
      paginationOptions?: PaginationOptions;
    },
    metadata?: CommandMetadata
  ): GenerateReportCommand {
    return this.createCommand('generate_report', {
      adminId,
      reportType,
      dateRange: options?.dateRange,
      filters: options?.filters,
      paginationOptions: options?.paginationOptions,
      metadata: metadata || CQRSUtils.createCommandMetadata(adminId)
    });
  }
}

// Handler Factory
export class AdminHandlerFactory {
  static createApproveProviderHandler(
    providerService: IProviderService,
    userService: IUserService
  ): ApproveProviderHandler {
    return new ApproveProviderHandler(providerService, userService);
  }

  static createRejectProviderHandler(
    providerService: IProviderService,
    userService: IUserService
  ): RejectProviderHandler {
    return new RejectProviderHandler(providerService, userService);
  }

  static createSuspendProviderHandler(
    providerService: IProviderService,
    userService: IUserService
  ): SuspendProviderHandler {
    return new SuspendProviderHandler(providerService, userService);
  }

  static createGenerateReportHandler(
    userService: IUserService
  ): GenerateReportHandler {
    return new GenerateReportHandler(userService);
  }
}
