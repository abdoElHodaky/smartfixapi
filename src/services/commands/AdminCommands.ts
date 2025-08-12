/**
 * Admin Command Implementations
 * 
 * Command pattern implementations for admin operations using CommandBase
 * for standardized execution, validation, and error handling.
 */

import { IsString, IsOptional, IsObject, IsEnum, IsNotEmpty } from 'class-validator';
import { CommandBase, CommandResult, CommandContext } from '../../utils/service-optimization/CommandBase';
import { IUserService, IProviderService, IServiceRequestService } from '../../interfaces/services';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';
import { AggregationBuilder } from '../../utils/aggregation/AggregationBuilder';
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
 * Command to generate admin reports using AggregationBuilder
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

  constructor(
    context: CommandContext,
    adminId: string,
    reportType: string,
    dateRange?: { from: Date; to: Date },
    filters?: Record<string, any>,
    private userService?: IUserService
  ) {
    super(context, adminId);
    this.reportType = reportType;
    this.dateRange = dateRange;
    this.filters = filters;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Validate admin permissions
      await this.validateAdminPermissions(this.userService!);

      let reportData: any;

      // Generate report based on type using AggregationBuilder
      switch (this.reportType) {
        case 'user_activity':
          reportData = await this.generateUserActivityReport();
          break;
        case 'provider_performance':
          reportData = await this.generateProviderPerformanceReport();
          break;
        case 'service_requests':
          reportData = await this.generateServiceRequestReport();
          break;
        case 'revenue':
          reportData = await this.generateRevenueReport();
          break;
        default:
          return CommandResult.failure(`Unsupported report type: ${this.reportType}`);
      }

      return CommandResult.success(
        {
          reportType: this.reportType,
          data: reportData,
          generatedBy: this.adminId,
          generatedAt: new Date(),
          dateRange: this.dateRange,
          filters: this.filters
        },
        'Report generated successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to generate report', [error.message]);
    }
  }

  private async generateUserActivityReport(): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .buildUserActivityReport(this.dateRange);
    
    return await aggregation.execute(User);
  }

  private async generateProviderPerformanceReport(): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .buildTopProviders(5, 4.0, 20);
    
    return await aggregation.execute(ServiceProvider);
  }

  private async generateServiceRequestReport(): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .buildServiceRequestStatistics(this.dateRange);
    
    return await aggregation.execute(ServiceRequest);
  }

  private async generateRevenueReport(): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .match({ status: 'completed' })
      .buildStatistics({
        dateField: 'completedAt',
        groupBy: 'completedAt',
        sumField: 'budget',
        countField: 'totalRequests'
      });
    
    return await aggregation.execute(ServiceRequest);
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
 * Command factory for creating admin commands
 */
export class AdminCommandFactory {
  static createApproveProviderCommand(
    context: CommandContext,
    adminId: string,
    providerId: string,
    notes?: string,
    providerService?: IProviderService,
    userService?: IUserService
  ): ApproveProviderCommand {
    return new ApproveProviderCommand(context, adminId, providerId, notes, providerService, userService);
  }

  static createRejectProviderCommand(
    context: CommandContext,
    adminId: string,
    providerId: string,
    reason: string,
    providerService?: IProviderService,
    userService?: IUserService
  ): RejectProviderCommand {
    return new RejectProviderCommand(context, adminId, providerId, reason, providerService, userService);
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
    return new SuspendProviderCommand(context, adminId, providerId, reason, suspensionDetails, providerService, userService);
  }

  static createDeleteUserCommand(
    context: CommandContext,
    adminId: string,
    userId: string,
    reason?: string,
    userService?: IUserService
  ): DeleteUserCommand {
    return new DeleteUserCommand(context, adminId, userId, reason, userService);
  }

  static createGenerateReportCommand(
    context: CommandContext,
    adminId: string,
    reportType: string,
    dateRange?: { from: Date; to: Date },
    filters?: Record<string, any>,
    userService?: IUserService
  ): GenerateReportCommand {
    return new GenerateReportCommand(context, adminId, reportType, dateRange, filters, userService);
  }

  static createBulkUpdateUserRolesCommand(
    context: CommandContext,
    adminId: string,
    userRoleUpdates: { userId: string; newRole: string }[],
    reason?: string,
    userService?: IUserService
  ): BulkUpdateUserRolesCommand {
    return new BulkUpdateUserRolesCommand(context, adminId, userRoleUpdates, reason, userService);
  }
}
