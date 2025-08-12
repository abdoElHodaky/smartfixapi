/**
 * Service Request Operation Strategies
 * 
 * Strategy implementations for service request CRUD operations
 */

import { AsyncStrategy } from '../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../utils/service-optimization/CommandBase';
import { AggregationBuilder } from '../../utils/aggregation/AggregationBuilder';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';
import { ServiceRequest } from '../../models/ServiceRequest';
import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequestOperationInput } from '../interfaces/ServiceStrategy';

export class CreateServiceRequestStrategy implements AsyncStrategy<ServiceRequestOperationInput, CommandResult> {
  async execute(input: ServiceRequestOperationInput): Promise<CommandResult> {
    try {
      if (!input.data) {
        return CommandResult.failure('Service request data is required');
      }

      // Validate user exists
      const user = await User.findById(input.userId);
      if (!user) {
        return CommandResult.failure('User not found');
      }

      // Create service request
      const serviceRequest = new ServiceRequest({
        ...input.data,
        userId: input.userId,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await serviceRequest.save();

      // Populate user data
      await serviceRequest.populate('userId', '-password');

      return CommandResult.success(serviceRequest, 'Service request created successfully');
    } catch (error) {
      return CommandResult.failure('Failed to create service request', [error.message]);
    }
  }
}

export class GetServiceRequestByIdStrategy implements AsyncStrategy<ServiceRequestOperationInput, CommandResult> {
  async execute(input: ServiceRequestOperationInput): Promise<CommandResult> {
    try {
      const aggregation = AggregationBuilder.create()
        .match({ _id: input.requestId, isDeleted: { $ne: true } })
        .lookup('users', 'userId', '_id', 'user')
        .lookup('serviceProviders', 'providerId', '_id', 'provider')
        .lookup('reviews', 'serviceRequestId', '_id', 'reviews')
        .addFields({
          user: { $arrayElemAt: ['$user', 0] },
          provider: { $arrayElemAt: ['$provider', 0] },
          reviewCount: { $size: '$reviews' },
          averageRating: { $avg: '$reviews.rating' }
        })
        .project({
          'user.password': 0,
          title: 1,
          description: 1,
          category: 1,
          location: 1,
          price: 1,
          status: 1,
          urgency: 1,
          images: 1,
          user: 1,
          provider: 1,
          reviewCount: 1,
          averageRating: 1,
          createdAt: 1,
          updatedAt: 1
        });

      const requests = await aggregation.execute(ServiceRequest);
      const request = requests[0];

      if (!request) {
        return CommandResult.failure('Service request not found');
      }

      return CommandResult.success(request, 'Service request retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to get service request', [error.message]);
    }
  }
}

export class UpdateServiceRequestStrategy implements AsyncStrategy<ServiceRequestOperationInput, CommandResult> {
  async execute(input: ServiceRequestOperationInput): Promise<CommandResult> {
    try {
      if (!input.data || Object.keys(input.data).length === 0) {
        return CommandResult.failure('No update data provided');
      }

      // Check if request exists
      const existingRequest = await ServiceRequest.findOne({ 
        _id: input.requestId, 
        isDeleted: { $ne: true } 
      });

      if (!existingRequest) {
        return CommandResult.failure('Service request not found');
      }

      // Validate permissions (user can only update their own requests unless admin/provider)
      if (input.requesterId && input.requesterId !== existingRequest.userId.toString()) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin', 'provider'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Insufficient permissions to update service request');
        }
      }

      // Update service request
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        input.requestId,
        { 
          ...input.data, 
          updatedAt: new Date(),
          ...(input.metadata && { metadata: input.metadata })
        },
        { new: true, runValidators: true }
      ).populate('userId', '-password');

      return CommandResult.success(updatedRequest, 'Service request updated successfully');
    } catch (error) {
      return CommandResult.failure('Failed to update service request', [error.message]);
    }
  }
}

export class DeleteServiceRequestStrategy implements AsyncStrategy<ServiceRequestOperationInput, CommandResult> {
  async execute(input: ServiceRequestOperationInput): Promise<CommandResult> {
    try {
      const request = await ServiceRequest.findById(input.requestId);
      if (!request) {
        return CommandResult.failure('Service request not found');
      }

      // Validate permissions
      if (input.requesterId && input.requesterId !== request.userId.toString()) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Insufficient permissions to delete service request');
        }
      }

      // Soft delete service request
      await ServiceRequest.findByIdAndUpdate(input.requestId, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: input.requesterId || input.userId
      });

      return CommandResult.success(
        { requestId: input.requestId, deleted: true },
        'Service request deleted successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to delete service request', [error.message]);
    }
  }
}
