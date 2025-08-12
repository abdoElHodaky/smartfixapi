/**
 * Admin Command Handlers for CQRS Pattern
 * 
 * Handlers for admin write operations
 */

import { Injectable, Inject } from '@decorators/di';
import { CommandHandler, CommandResult } from '../../types';
import {
  ManageProviderCommand,
  ApproveProviderCommand,
  RejectProviderCommand,
  SuspendProviderCommand,
  ReactivateProviderCommand,
  ManageUserCommand,
  SuspendUserCommand,
  FlagContentCommand,
  UnflagContentCommand,
  UpdateSystemConfigCommand,
  SendNotificationCommand
} from '../../commands/admin.commands';

import { ServiceProvider } from '../../../models/ServiceProvider';
import { User } from '../../../models/User';
import { Review } from '../../../models/Review';
import { NotFoundError, ValidationError, AuthenticationError } from '../../../middleware/errorHandler';
import { IUserService, IProviderService, INotificationService } from '../../../interfaces/services';

@Injectable()
export class ManageProviderCommandHandler implements CommandHandler<ManageProviderCommand> {
  constructor(
    @Inject('UserService') private userService: IUserService,
    @Inject('ProviderService') private providerService: IProviderService
  ) {}

  async handle(command: ManageProviderCommand): Promise<CommandResult> {
    const { adminId, providerId, action, data, reason } = command.payload;

    try {
      // Verify admin permissions
      await this.verifyAdminPermissions(adminId);

      // Check if provider exists
      const provider = await ServiceProvider.findById(providerId);
      if (!provider) {
        throw new NotFoundError('Provider not found');
      }

      let result;
      const updateData = this.buildUpdateData(action, adminId, data, reason);

      switch (action) {
        case 'approve':
          result = await this.approveProvider(providerId, updateData);
          break;
        case 'reject':
          result = await this.rejectProvider(providerId, updateData);
          break;
        case 'suspend':
          result = await this.suspendProvider(providerId, updateData);
          break;
        case 'reactivate':
          result = await this.reactivateProvider(providerId, updateData);
          break;
        default:
          throw new ValidationError(`Invalid action: ${action}`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          action,
          providerId,
          adminId,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          action,
          providerId,
          adminId,
          timestamp: new Date()
        }
      };
    }
  }

  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AuthenticationError('Insufficient permissions');
    }
  }

  private buildUpdateData(action: string, adminId: string, data?: any, reason?: string) {
    const baseUpdate = {
      updatedAt: new Date(),
      updatedBy: adminId
    };

    switch (action) {
      case 'approve':
        return {
          ...baseUpdate,
          status: 'active',
          approvedAt: new Date(),
          approvedBy: adminId
        };
      case 'reject':
        return {
          ...baseUpdate,
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: adminId,
          rejectionReason: reason || 'Administrative decision'
        };
      case 'suspend':
        return {
          ...baseUpdate,
          status: 'suspended',
          suspendedAt: new Date(),
          suspendedBy: adminId,
          suspensionReason: reason || 'Administrative action',
          suspensionDuration: data?.duration
        };
      case 'reactivate':
        return {
          ...baseUpdate,
          status: 'active',
          reactivatedAt: new Date(),
          reactivatedBy: adminId
        };
      default:
        return baseUpdate;
    }
  }

  private async approveProvider(providerId: string, updateData: any) {
    return await ServiceProvider.findByIdAndUpdate(
      providerId,
      updateData,
      { new: true }
    ).populate('userId', 'firstName lastName email');
  }

  private async rejectProvider(providerId: string, updateData: any) {
    return await ServiceProvider.findByIdAndUpdate(
      providerId,
      updateData,
      { new: true }
    ).populate('userId', 'firstName lastName email');
  }

  private async suspendProvider(providerId: string, updateData: any) {
    return await ServiceProvider.findByIdAndUpdate(
      providerId,
      updateData,
      { new: true }
    ).populate('userId', 'firstName lastName email');
  }

  private async reactivateProvider(providerId: string, updateData: any) {
    return await ServiceProvider.findByIdAndUpdate(
      providerId,
      updateData,
      { new: true }
    ).populate('userId', 'firstName lastName email');
  }
}

@Injectable()
export class ApproveProviderCommandHandler implements CommandHandler<ApproveProviderCommand> {
  constructor(
    @Inject('UserService') private userService: IUserService
  ) {}

  async handle(command: ApproveProviderCommand): Promise<CommandResult> {
    const { adminId, providerId, reason } = command.payload;

    try {
      await this.verifyAdminPermissions(adminId);

      const provider = await ServiceProvider.findById(providerId);
      if (!provider) {
        throw new NotFoundError('Provider not found');
      }

      const result = await ServiceProvider.findByIdAndUpdate(
        providerId,
        {
          status: 'active',
          approvedAt: new Date(),
          approvedBy: adminId,
          approvalReason: reason,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('userId', 'firstName lastName email');

      return {
        success: true,
        data: result,
        metadata: {
          action: 'approve',
          providerId,
          adminId,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AuthenticationError('Insufficient permissions');
    }
  }
}

@Injectable()
export class SuspendUserCommandHandler implements CommandHandler<SuspendUserCommand> {
  constructor(
    @Inject('UserService') private userService: IUserService
  ) {}

  async handle(command: SuspendUserCommand): Promise<CommandResult> {
    const { adminId, userId, reason, duration } = command.payload;

    try {
      await this.verifyAdminPermissions(adminId);

      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const result = await User.findByIdAndUpdate(
        userId,
        {
          status: 'suspended',
          suspendedAt: new Date(),
          suspendedBy: adminId,
          suspensionReason: reason,
          suspensionDuration: duration,
          updatedAt: new Date()
        },
        { new: true }
      ).select('-password');

      return {
        success: true,
        data: result,
        metadata: {
          action: 'suspend',
          userId,
          adminId,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AuthenticationError('Insufficient permissions');
    }
  }
}

@Injectable()
export class FlagContentCommandHandler implements CommandHandler<FlagContentCommand> {
  constructor(
    @Inject('UserService') private userService: IUserService
  ) {}

  async handle(command: FlagContentCommand): Promise<CommandResult> {
    const { adminId, contentType, contentId, reason, severity } = command.payload;

    try {
      await this.verifyAdminPermissions(adminId);

      let result;
      const flagData = {
        flagged: true,
        flaggedAt: new Date(),
        flaggedBy: adminId,
        flagReason: reason,
        flagSeverity: severity,
        updatedAt: new Date()
      };

      switch (contentType) {
        case 'review':
          result = await Review.findByIdAndUpdate(
            contentId,
            flagData,
            { new: true }
          );
          break;
        case 'user':
          result = await User.findByIdAndUpdate(
            contentId,
            flagData,
            { new: true }
          ).select('-password');
          break;
        case 'provider':
          result = await ServiceProvider.findByIdAndUpdate(
            contentId,
            flagData,
            { new: true }
          );
          break;
        default:
          throw new ValidationError(`Invalid content type: ${contentType}`);
      }

      if (!result) {
        throw new NotFoundError(`${contentType} not found`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          action: 'flag',
          contentType,
          contentId,
          adminId,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AuthenticationError('Insufficient permissions');
    }
  }
}

@Injectable()
export class UnflagContentCommandHandler implements CommandHandler<UnflagContentCommand> {
  constructor(
    @Inject('UserService') private userService: IUserService
  ) {}

  async handle(command: UnflagContentCommand): Promise<CommandResult> {
    const { adminId, contentType, contentId, reason } = command.payload;

    try {
      await this.verifyAdminPermissions(adminId);

      let result;
      const unflagData = {
        flagged: false,
        unflaggedAt: new Date(),
        unflaggedBy: adminId,
        unflagReason: reason,
        updatedAt: new Date()
      };

      switch (contentType) {
        case 'review':
          result = await Review.findByIdAndUpdate(
            contentId,
            unflagData,
            { new: true }
          );
          break;
        case 'user':
          result = await User.findByIdAndUpdate(
            contentId,
            unflagData,
            { new: true }
          ).select('-password');
          break;
        case 'provider':
          result = await ServiceProvider.findByIdAndUpdate(
            contentId,
            unflagData,
            { new: true }
          );
          break;
        default:
          throw new ValidationError(`Invalid content type: ${contentType}`);
      }

      if (!result) {
        throw new NotFoundError(`${contentType} not found`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          action: 'unflag',
          contentType,
          contentId,
          adminId,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AuthenticationError('Insufficient permissions');
    }
  }
}

@Injectable()
export class SendNotificationCommandHandler implements CommandHandler<SendNotificationCommand> {
  constructor(
    @Inject('UserService') private userService: IUserService,
    @Inject('NotificationService') private notificationService: INotificationService
  ) {}

  async handle(command: SendNotificationCommand): Promise<CommandResult> {
    const { adminId, recipientType, recipientIds, title, message, type } = command.payload;

    try {
      await this.verifyAdminPermissions(adminId);

      let recipients: string[] = [];

      switch (recipientType) {
        case 'user':
          recipients = recipientIds || [];
          break;
        case 'provider':
          recipients = recipientIds || [];
          break;
        case 'all':
          // Get all user IDs
          const allUsers = await User.find({ status: 'active' }).select('_id');
          recipients = allUsers.map(user => user._id.toString());
          break;
        default:
          throw new ValidationError(`Invalid recipient type: ${recipientType}`);
      }

      // Send notifications (assuming notification service exists)
      const results = await Promise.allSettled(
        recipients.map(recipientId =>
          this.notificationService.sendNotification({
            recipientId,
            title,
            message,
            type,
            senderId: adminId
          })
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      return {
        success: true,
        data: {
          totalRecipients: recipients.length,
          successful,
          failed,
          results
        },
        metadata: {
          action: 'send_notification',
          recipientType,
          adminId,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AuthenticationError('Insufficient permissions');
    }
  }
}

