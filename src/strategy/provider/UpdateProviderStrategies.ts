/**
 * Update Provider Strategy Implementations
 * 
 * Strategy classes for updating provider information
 */

import { AsyncStrategy } from '../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../utils/service-optimization/CommandBase';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';
import { ServiceProvider } from '../../models/ServiceProvider';
import { User } from '../../models/User';
import { ProviderOperationInput } from '../interfaces/ServiceStrategy';
import { UpdateProviderDto } from '../../dtos';

export class UpdateProviderProfileStrategy implements AsyncStrategy<ProviderOperationInput, CommandResult> {
  async execute(input: ProviderOperationInput): Promise<CommandResult> {
    try {
      const updateData = input.data as UpdateProviderDto;
      if (!updateData || Object.keys(updateData).length === 0) {
        return CommandResult.failure('No update data provided');
      }

      // Check if provider exists
      const existingProvider = await ServiceProvider.findOne({ 
        _id: input.providerId, 
        isDeleted: { $ne: true } 
      });

      if (!existingProvider) {
        return CommandResult.failure('Provider not found');
      }

      // Validate permissions (provider can only update their own profile unless admin)
      if (input.requesterId && input.requesterId !== existingProvider.userId.toString()) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Insufficient permissions to update provider profile');
        }
      }

      // Update provider profile
      const updatedProvider = await ServiceProvider.findByIdAndUpdate(
        input.providerId,
        { 
          ...updateData, 
          updatedAt: new Date(),
          ...(input.metadata && { metadata: input.metadata })
        },
        { new: true, runValidators: true }
      ).populate('userId', '-password');

      return CommandResult.success(updatedProvider, 'Provider profile updated successfully');
    } catch (error) {
      return CommandResult.failure('Failed to update provider profile', [error.message]);
    }
  }
}

export class UpdateProviderStatusStrategy implements AsyncStrategy<ProviderOperationInput, CommandResult> {
  async execute(input: ProviderOperationInput): Promise<CommandResult> {
    try {
      // Validate admin permissions
      if (input.requesterId) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Insufficient permissions to update provider status');
        }
      }

      const updatedProvider = await ServiceProvider.findByIdAndUpdate(
        input.providerId,
        { 
          isActive: input.data.status === 'active',
          status: input.data.status,
          updatedAt: new Date(),
          updatedBy: input.requesterId
        },
        { new: true, runValidators: true }
      ).populate('userId', '-password');

      if (!updatedProvider) {
        return CommandResult.failure('Provider not found');
      }

      return CommandResult.success(updatedProvider, 'Provider status updated successfully');
    } catch (error) {
      return CommandResult.failure('Failed to update provider status', [error.message]);
    }
  }
}

