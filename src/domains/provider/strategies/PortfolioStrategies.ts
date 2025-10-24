/**
 * Portfolio Strategy Implementations
 * 
 * Strategy classes for managing provider portfolio items
 */

import { AsyncStrategy } from '../../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../../utils/service-optimization/CommandBase';
import { ConditionalHelpers } from '../../../utils/conditions/ConditionalHelpers';
import { ServiceProvider } from '../../../models/ServiceProvider';
import { User } from '../../../models/User';
import { PortfolioOperationInput } from '../interfaces/ServiceStrategy';

export class AddPortfolioItemStrategy implements AsyncStrategy<PortfolioOperationInput, CommandResult> {
  async execute(input: PortfolioOperationInput): Promise<CommandResult> {
    try {
      if (!input.portfolioItem) {
        return CommandResult.failure('Portfolio item data is required');
      }

      const provider = await ServiceProvider.findById(input.providerId);
      if (!provider) {
        return CommandResult.failure('Provider not found');
      }

      // Validate permissions
      if (input.requesterId && input.requesterId !== provider.userId.toString()) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Insufficient permissions to add portfolio item');
        }
      }

      const portfolioItem = {
        ...input.portfolioItem,
        id: new Date().getTime().toString(),
        createdAt: new Date()
      };

      const updatedProvider = await ServiceProvider.findByIdAndUpdate(
        input.providerId,
        { 
          $push: { portfolio: portfolioItem },
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      return CommandResult.success(
        { provider: updatedProvider, portfolioItem },
        'Portfolio item added successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to add portfolio item', [error.message]);
    }
  }
}

export class UpdatePortfolioItemStrategy implements AsyncStrategy<PortfolioOperationInput, CommandResult> {
  async execute(input: PortfolioOperationInput): Promise<CommandResult> {
    try {
      if (!input.itemId || !input.updateData) {
        return CommandResult.failure('Item ID and update data are required');
      }

      const provider = await ServiceProvider.findById(input.providerId);
      if (!provider) {
        return CommandResult.failure('Provider not found');
      }

      // Validate permissions
      if (input.requesterId && input.requesterId !== provider.userId.toString()) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Insufficient permissions to update portfolio item');
        }
      }

      const updatedProvider = await ServiceProvider.findOneAndUpdate(
        { _id: input.providerId, 'portfolio.id': input.itemId },
        { 
          $set: {
            'portfolio.$.title': input.updateData.title,
            'portfolio.$.description': input.updateData.description,
            'portfolio.$.images': input.updateData.images,
            'portfolio.$.updatedAt': new Date()
          },
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!updatedProvider) {
        return CommandResult.failure('Portfolio item not found');
      }

      return CommandResult.success(updatedProvider, 'Portfolio item updated successfully');
    } catch (error) {
      return CommandResult.failure('Failed to update portfolio item', [error.message]);
    }
  }
}

export class DeletePortfolioItemStrategy implements AsyncStrategy<PortfolioOperationInput, CommandResult> {
  async execute(input: PortfolioOperationInput): Promise<CommandResult> {
    try {
      if (!input.itemId) {
        return CommandResult.failure('Item ID is required');
      }

      const provider = await ServiceProvider.findById(input.providerId);
      if (!provider) {
        return CommandResult.failure('Provider not found');
      }

      // Validate permissions
      if (input.requesterId && input.requesterId !== provider.userId.toString()) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Insufficient permissions to delete portfolio item');
        }
      }

      const updatedProvider = await ServiceProvider.findByIdAndUpdate(
        input.providerId,
        { 
          $pull: { portfolio: { id: input.itemId } },
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      return CommandResult.success(updatedProvider, 'Portfolio item deleted successfully');
    } catch (error) {
      return CommandResult.failure('Failed to delete portfolio item', [error.message]);
    }
  }
}

