/**
 * Service Request Status Strategies
 * 
 * Strategy implementations for managing service request status changes
 */

import { AsyncStrategy } from '../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../utils/service-optimization/CommandBase';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';
import { ServiceRequest } from '../../models/ServiceRequest';
import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequestOperationInput } from '../interfaces/ServiceStrategy';

export class AcceptServiceRequestStrategy implements AsyncStrategy<ServiceRequestOperationInput, CommandResult> {
  async execute(input: ServiceRequestOperationInput): Promise<CommandResult> {
    try {
      const request = await ServiceRequest.findById(input.requestId);
      if (!request) {
        return CommandResult.failure('Service request not found');
      }

      if (request.status !== 'open') {
        return CommandResult.failure('Service request is not available for acceptance');
      }

      // Validate provider exists and is active
      const provider = await ServiceProvider.findById(input.providerId);
      if (!provider || !provider.isActive) {
        return CommandResult.failure('Provider not found or inactive');
      }

      // Update request status
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        input.requestId,
        {
          providerId: input.providerId,
          status: 'accepted',
          acceptedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).populate(['userId', 'providerId']);

      return CommandResult.success(updatedRequest, 'Service request accepted successfully');
    } catch (error) {
      return CommandResult.failure('Failed to accept service request', [error.message]);
    }
  }
}

export class CompleteServiceRequestStrategy implements AsyncStrategy<ServiceRequestOperationInput, CommandResult> {
  async execute(input: ServiceRequestOperationInput): Promise<CommandResult> {
    try {
      const request = await ServiceRequest.findById(input.requestId);
      if (!request) {
        return CommandResult.failure('Service request not found');
      }

      if (request.status !== 'in_progress') {
        return CommandResult.failure('Service request must be in progress to complete');
      }

      // Validate permissions (only provider or admin can complete)
      if (input.requesterId) {
        if (input.requesterId !== request.providerId?.toString()) {
          const requester = await User.findById(input.requesterId);
          const roleCheck = ConditionalHelpers.validateUserRole(requester, {
            allowedRoles: ['admin', 'super_admin'],
            requireActive: true
          });

          if (!roleCheck.isValid) {
            return CommandResult.failure('Only the assigned provider or admin can complete this request');
          }
        }
      }

      // Update request status
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        input.requestId,
        {
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).populate(['userId', 'providerId']);

      // Update provider's completed jobs count
      if (request.providerId) {
        await ServiceProvider.findByIdAndUpdate(request.providerId, {
          $inc: { completedJobs: 1 },
          updatedAt: new Date()
        });
      }

      return CommandResult.success(updatedRequest, 'Service request completed successfully');
    } catch (error) {
      return CommandResult.failure('Failed to complete service request', [error.message]);
    }
  }
}

export class CancelServiceRequestStrategy implements AsyncStrategy<ServiceRequestOperationInput, CommandResult> {
  async execute(input: ServiceRequestOperationInput): Promise<CommandResult> {
    try {
      const request = await ServiceRequest.findById(input.requestId);
      if (!request) {
        return CommandResult.failure('Service request not found');
      }

      if (['completed', 'cancelled'].includes(request.status)) {
        return CommandResult.failure('Cannot cancel a completed or already cancelled request');
      }

      // Validate permissions (user, provider, or admin can cancel)
      if (input.requesterId) {
        const isOwner = input.requesterId === request.userId.toString();
        const isProvider = input.requesterId === request.providerId?.toString();
        
        if (!isOwner && !isProvider) {
          const requester = await User.findById(input.requesterId);
          const roleCheck = ConditionalHelpers.validateUserRole(requester, {
            allowedRoles: ['admin', 'super_admin'],
            requireActive: true
          });

          if (!roleCheck.isValid) {
            return CommandResult.failure('Insufficient permissions to cancel this request');
          }
        }
      }

      // Update request status
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        input.requestId,
        {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: input.requesterId,
          cancelReason: input.data?.reason || 'No reason provided',
          updatedAt: new Date()
        },
        { new: true }
      ).populate(['userId', 'providerId']);

      return CommandResult.success(updatedRequest, 'Service request cancelled successfully');
    } catch (error) {
      return CommandResult.failure('Failed to cancel service request', [error.message]);
    }
  }
}

export class StartServiceRequestStrategy implements AsyncStrategy<ServiceRequestOperationInput, CommandResult> {
  async execute(input: ServiceRequestOperationInput): Promise<CommandResult> {
    try {
      const request = await ServiceRequest.findById(input.requestId);
      if (!request) {
        return CommandResult.failure('Service request not found');
      }

      if (request.status !== 'accepted') {
        return CommandResult.failure('Service request must be accepted before starting');
      }

      // Validate permissions (only assigned provider can start)
      if (input.requesterId && input.requesterId !== request.providerId?.toString()) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Only the assigned provider can start this request');
        }
      }

      // Update request status
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        input.requestId,
        {
          status: 'in_progress',
          startedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).populate(['userId', 'providerId']);

      return CommandResult.success(updatedRequest, 'Service request started successfully');
    } catch (error) {
      return CommandResult.failure('Failed to start service request', [error.message]);
    }
  }
}
