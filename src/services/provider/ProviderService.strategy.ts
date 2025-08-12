/**
 * Strategy-Based ProviderService Implementation
 * 
 * Enhanced ProviderService using Strategy Patterns and AggregationBuilder
 * for optimized performance and maintainable conditional logic.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { ServiceProvider } from '../../models/ServiceProvider';
import { User } from '../../models/User';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { NotFoundError, ValidationError, AuthenticationError } from '../../middleware/errorHandler';
import { IProviderService, IReviewService, IServiceRequestService } from '../../interfaces/services';
import {
  UpdateProviderDto,
  ProviderFiltersDto,
  PortfolioItemDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

// Import optimization utilities
import { AggregationBuilder, AggregationUtils } from '../../utils/aggregation/AggregationBuilder';
import { 
  StrategyRegistry, 
  AsyncStrategyRegistry, 
  Strategy, 
  AsyncStrategy 
} from '../../utils/conditions/StrategyPatterns';
import { ConditionalHelpers, RoleCheckOptions } from '../../utils/conditions/ConditionalHelpers';
import { CommandBase, CommandResult, CommandContext } from '../../utils/service-optimization/CommandBase';

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

// Strategy interfaces
interface ProviderOperationInput {
  providerId: string;
  userId?: string;
  requesterId?: string;
  data?: any;
  metadata?: Record<string, any>;
}

interface ProviderSearchInput {
  filters: ProviderFiltersDto;
  requesterId?: string;
  includeInactive?: boolean;
}

interface PortfolioOperationInput {
  providerId: string;
  itemId?: string;
  portfolioItem?: PortfolioItemDto;
  updateData?: Partial<PortfolioItemDto>;
  requesterId?: string;
}

interface ProviderStatisticsInput {
  providerId: string;
  dateRange?: { from: Date; to: Date };
  includeDetails?: boolean;
}

// Provider operation strategies
class GetProviderByIdStrategy implements AsyncStrategy<ProviderOperationInput, CommandResult> {
  async execute(input: ProviderOperationInput): Promise<CommandResult> {
    try {
      const aggregation = AggregationBuilder.create()
        .match({ _id: input.providerId, isDeleted: { $ne: true } })
        .lookup('users', 'userId', '_id', 'user')
        .lookup('reviews', 'providerId', '_id', 'reviews')
        .lookup('serviceRequests', 'providerId', '_id', 'serviceRequests')
        .addFields({
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $size: '$reviews' },
          completedJobs: {
            $size: {
              $filter: {
                input: '$serviceRequests',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          user: { $arrayElemAt: ['$user', 0] }
        })
        .project({
          'user.password': 0,
          services: 1,
          location: 1,
          availability: 1,
          portfolio: 1,
          isVerified: 1,
          isActive: 1,
          rating: 1,
          totalReviews: 1,
          completedJobs: 1,
          averageRating: 1,
          user: 1,
          createdAt: 1,
          updatedAt: 1
        });

      const providers = await aggregation.execute(ServiceProvider);
      const provider = providers[0];

      if (!provider) {
        return CommandResult.failure('Provider not found');
      }

      return CommandResult.success(provider, 'Provider retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to get provider', [error.message]);
    }
  }
}

class GetProviderByUserIdStrategy implements AsyncStrategy<ProviderOperationInput, CommandResult> {
  async execute(input: ProviderOperationInput): Promise<CommandResult> {
    try {
      const aggregation = AggregationBuilder.create()
        .match({ userId: input.userId, isDeleted: { $ne: true } })
        .lookup('users', 'userId', '_id', 'user')
        .lookup('reviews', 'providerId', '_id', 'reviews')
        .addFields({
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $size: '$reviews' },
          user: { $arrayElemAt: ['$user', 0] }
        })
        .project({
          'user.password': 0,
          services: 1,
          location: 1,
          availability: 1,
          portfolio: 1,
          isVerified: 1,
          isActive: 1,
          rating: 1,
          totalReviews: 1,
          averageRating: 1,
          user: 1,
          createdAt: 1,
          updatedAt: 1
        });

      const providers = await aggregation.execute(ServiceProvider);
      const provider = providers[0];

      if (!provider) {
        return CommandResult.failure('Provider not found for this user');
      }

      return CommandResult.success(provider, 'Provider retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to get provider by user ID', [error.message]);
    }
  }
}

class UpdateProviderProfileStrategy implements AsyncStrategy<ProviderOperationInput, CommandResult> {
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

class UpdateProviderStatusStrategy implements AsyncStrategy<ProviderOperationInput, CommandResult> {
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

// Provider search strategies
class SearchProvidersStrategy implements AsyncStrategy<ProviderSearchInput, CommandResult> {
  async execute(input: ProviderSearchInput): Promise<CommandResult> {
    try {
      const { filters } = input;
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 10, 100); // Cap at 100
      const skip = (page - 1) * limit;

      // Build search criteria
      const matchCriteria: any = { isDeleted: { $ne: true } };
      
      if (!input.includeInactive) {
        matchCriteria.isActive = true;
      }

      if (filters.services && filters.services.length > 0) {
        matchCriteria['services.category'] = { $in: filters.services };
      }

      if (filters.location) {
        matchCriteria.location = {
          $near: {
            $geometry: filters.location,
            $maxDistance: filters.radius || 10000 // 10km default
          }
        };
      }

      if (filters.minRating) {
        matchCriteria.rating = { $gte: filters.minRating };
      }

      if (filters.isVerified !== undefined) {
        matchCriteria.isVerified = filters.isVerified;
      }

      // Build aggregation pipeline
      const aggregation = AggregationBuilder.create()
        .match(matchCriteria)
        .lookup('users', 'userId', '_id', 'user')
        .lookup('reviews', 'providerId', '_id', 'reviews')
        .addFields({
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $size: '$reviews' },
          user: { $arrayElemAt: ['$user', 0] }
        })
        .project({
          'user.password': 0,
          'user.email': 1,
          'user.name': 1,
          'user.profileImage': 1,
          services: 1,
          location: 1,
          isVerified: 1,
          isActive: 1,
          rating: 1,
          averageRating: 1,
          totalReviews: 1,
          portfolio: { $slice: ['$portfolio', 3] }, // Show first 3 portfolio items
          createdAt: 1
        })
        .sort({ rating: -1, totalReviews: -1 })
        .skip(skip)
        .limit(limit);

      const [providers, totalCount] = await Promise.all([
        aggregation.execute(ServiceProvider),
        ServiceProvider.countDocuments(matchCriteria)
      ]);

      const result = {
        data: providers,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };

      return CommandResult.success(result, 'Providers retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to search providers', [error.message]);
    }
  }
}

// Portfolio operation strategies
class AddPortfolioItemStrategy implements AsyncStrategy<PortfolioOperationInput, CommandResult> {
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

class UpdatePortfolioItemStrategy implements AsyncStrategy<PortfolioOperationInput, CommandResult> {
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

class DeletePortfolioItemStrategy implements AsyncStrategy<PortfolioOperationInput, CommandResult> {
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

// Provider statistics strategies
class GetProviderStatisticsStrategy implements AsyncStrategy<ProviderStatisticsInput, CommandResult> {
  async execute(input: ProviderStatisticsInput): Promise<CommandResult> {
    try {
      const dateRange = input.dateRange || {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date()
      };

      const [
        providerStats,
        reviewStats,
        serviceRequestStats,
        revenueStats
      ] = await Promise.all([
        // Provider basic stats
        AggregationBuilder.create()
          .match({ _id: input.providerId })
          .lookup('reviews', 'providerId', '_id', 'reviews')
          .lookup('serviceRequests', 'providerId', '_id', 'serviceRequests')
          .addFields({
            totalReviews: { $size: '$reviews' },
            averageRating: { $avg: '$reviews.rating' },
            totalServiceRequests: { $size: '$serviceRequests' },
            completedRequests: {
              $size: {
                $filter: {
                  input: '$serviceRequests',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              }
            }
          })
          .project({
            totalReviews: 1,
            averageRating: 1,
            totalServiceRequests: 1,
            completedRequests: 1,
            completionRate: {
              $cond: {
                if: { $gt: ['$totalServiceRequests', 0] },
                then: { $divide: ['$completedRequests', '$totalServiceRequests'] },
                else: 0
              }
            },
            isVerified: 1,
            rating: 1
          })
          .execute(ServiceProvider),

        // Review statistics
        AggregationBuilder.create()
          .match({
            providerId: input.providerId,
            createdAt: { $gte: dateRange.from, $lte: dateRange.to }
          })
          .group({
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            ratingDistribution: {
              $push: '$rating'
            }
          })
          .execute(Review),

        // Service request statistics
        AggregationBuilder.create()
          .match({
            providerId: input.providerId,
            createdAt: { $gte: dateRange.from, $lte: dateRange.to }
          })
          .group({
            _id: '$status',
            count: { $sum: 1 }
          })
          .execute(ServiceRequest),

        // Revenue statistics (if available)
        AggregationBuilder.create()
          .match({
            providerId: input.providerId,
            status: 'completed',
            createdAt: { $gte: dateRange.from, $lte: dateRange.to }
          })
          .group({
            _id: null,
            totalRevenue: { $sum: '$price' },
            averageJobValue: { $avg: '$price' },
            totalJobs: { $sum: 1 }
          })
          .execute(ServiceRequest)
      ]);

      const statistics = {
        provider: providerStats[0] || {},
        reviews: reviewStats[0] || { totalReviews: 0, averageRating: 0 },
        serviceRequests: serviceRequestStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        revenue: revenueStats[0] || { totalRevenue: 0, averageJobValue: 0, totalJobs: 0 },
        dateRange
      };

      return CommandResult.success(statistics, 'Provider statistics retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to get provider statistics', [error.message]);
    }
  }
}

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 7
})
export class ProviderServiceStrategy implements IProviderService {
  private providerOperationRegistry: AsyncStrategyRegistry<ProviderOperationInput, CommandResult>;
  private providerSearchRegistry: AsyncStrategyRegistry<ProviderSearchInput, CommandResult>;
  private portfolioOperationRegistry: AsyncStrategyRegistry<PortfolioOperationInput, CommandResult>;
  private providerStatisticsRegistry: AsyncStrategyRegistry<ProviderStatisticsInput, CommandResult>;

  constructor(
    @Inject('ReviewService') private reviewService?: IReviewService,
    @Inject('ServiceRequestService') private serviceRequestService?: IServiceRequestService
  ) {
    this.initializeStrategies();
  }

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('🏢 Strategy-based ProviderService initialized with optimized patterns');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('🏢 Strategy-based ProviderService cleanup completed');
  }

  /**
   * Initialize all strategy registries
   */
  private initializeStrategies(): void {
    // Provider operation strategies
    this.providerOperationRegistry = new AsyncStrategyRegistry<ProviderOperationInput, CommandResult>();
    this.providerOperationRegistry.register('getById', new GetProviderByIdStrategy());
    this.providerOperationRegistry.register('getByUserId', new GetProviderByUserIdStrategy());
    this.providerOperationRegistry.register('updateProfile', new UpdateProviderProfileStrategy());
    this.providerOperationRegistry.register('updateStatus', new UpdateProviderStatusStrategy());

    // Provider search strategies
    this.providerSearchRegistry = new AsyncStrategyRegistry<ProviderSearchInput, CommandResult>();
    this.providerSearchRegistry.register('searchProviders', new SearchProvidersStrategy());

    // Portfolio operation strategies
    this.portfolioOperationRegistry = new AsyncStrategyRegistry<PortfolioOperationInput, CommandResult>();
    this.portfolioOperationRegistry.register('addItem', new AddPortfolioItemStrategy());
    this.portfolioOperationRegistry.register('updateItem', new UpdatePortfolioItemStrategy());
    this.portfolioOperationRegistry.register('deleteItem', new DeletePortfolioItemStrategy());

    // Provider statistics strategies
    this.providerStatisticsRegistry = new AsyncStrategyRegistry<ProviderStatisticsInput, CommandResult>();
    this.providerStatisticsRegistry.register('getStatistics', new GetProviderStatisticsStrategy());
  }

  /**
   * Get provider by ID with optimized aggregation
   */
  @Log({
    message: 'Getting provider by ID with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  })
  async getProviderById(providerId: string): Promise<any> {
    const input: ProviderOperationInput = { providerId };
    const result = await this.providerOperationRegistry.execute('getById', input);
    
    if (!result.success) {
      throw new NotFoundError(result.message);
    }

    return result.data;
  }

  /**
   * Get provider by user ID with strategy pattern
   */
  @Log({
    message: 'Getting provider by user ID with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getProviderByUserId(userId: string): Promise<any> {
    const input: ProviderOperationInput = { providerId: '', userId };
    const result = await this.providerOperationRegistry.execute('getByUserId', input);
    
    if (!result.success) {
      throw new NotFoundError(result.message);
    }

    return result.data;
  }

  /**
   * Get provider profile (alias for getProviderById)
   */
  @Log({
    message: 'Getting provider profile with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getProviderProfile(providerId: string): Promise<any> {
    return await this.getProviderById(providerId);
  }

  /**
   * Update provider profile with strategy pattern
   */
  @Log({
    message: 'Updating provider profile with strategy pattern',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'linear'
  })
  async updateProviderProfile(providerId: string, updateData: UpdateProviderDto): Promise<ApiResponseDto> {
    const input: ProviderOperationInput = {
      providerId,
      data: updateData,
      metadata: { timestamp: new Date(), operation: 'updateProfile' }
    };

    const result = await this.providerOperationRegistry.execute('updateProfile', input);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  /**
   * Search providers with optimized aggregation
   */
  @Log({
    message: 'Searching providers with strategy pattern and aggregation',
    includeExecutionTime: true
  })
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async searchProviders(filters: ProviderFiltersDto): Promise<PaginatedResponseDto<any>> {
    const input: ProviderSearchInput = { filters };
    const result = await this.providerSearchRegistry.execute('searchProviders', input);
    
    if (!result.success) {
      throw new ValidationError(result.message);
    }

    return result.data;
  }

  // Portfolio management methods
  async addPortfolioItem(providerId: string, portfolioItem: PortfolioItemDto): Promise<ApiResponseDto> {
    const input: PortfolioOperationInput = { providerId, portfolioItem };
    const result = await this.portfolioOperationRegistry.execute('addItem', input);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  async updatePortfolioItem(providerId: string, itemId: string, updateData: Partial<PortfolioItemDto>): Promise<ApiResponseDto> {
    const input: PortfolioOperationInput = { providerId, itemId, updateData };
    const result = await this.portfolioOperationRegistry.execute('updateItem', input);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  async deletePortfolioItem(providerId: string, itemId: string): Promise<ApiResponseDto> {
    const input: PortfolioOperationInput = { providerId, itemId };
    const result = await this.portfolioOperationRegistry.execute('deleteItem', input);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  async getProviderPortfolio(providerId: string): Promise<PortfolioItemDto[]> {
    const provider = await this.getProviderById(providerId);
    return provider.portfolio || [];
  }

  // Additional methods with basic implementations
  async updateProviderAvailability(providerId: string, availability: any): Promise<ApiResponseDto> {
    const input: ProviderOperationInput = {
      providerId,
      data: { availability },
      metadata: { timestamp: new Date(), operation: 'updateAvailability' }
    };

    const result = await this.providerOperationRegistry.execute('updateProfile', input);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  async getProviderStatistics(providerId: string): Promise<any> {
    const input: ProviderStatisticsInput = { providerId };
    const result = await this.providerStatisticsRegistry.execute('getStatistics', input);
    
    if (!result.success) {
      throw new ValidationError(result.message);
    }

    return result.data;
  }

  async verifyProvider(providerId: string): Promise<ApiResponseDto> {
    const input: ProviderOperationInput = {
      providerId,
      data: { isVerified: true },
      metadata: { timestamp: new Date(), operation: 'verify' }
    };

    const result = await this.providerOperationRegistry.execute('updateProfile', input);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  // Delegated methods
  async getProviderReviews(providerId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>> {
    if (this.reviewService) {
      return await this.reviewService.getReviewsByProvider(providerId, page, limit);
    }
    
    // Fallback aggregation
    const aggregation = AggregationBuilder.create()
      .match({ providerId, isDeleted: { $ne: true } })
      .lookup('users', 'userId', '_id', 'user')
      .lookup('serviceRequests', 'serviceRequestId', '_id', 'serviceRequest')
      .sort({ createdAt: -1 })
      .skip(((page || 1) - 1) * (limit || 10))
      .limit(limit || 10);

    const reviews = await aggregation.execute(Review);
    const total = await Review.countDocuments({ providerId });

    return {
      data: reviews,
      pagination: {
        page: page || 1,
        limit: limit || 10,
        total,
        pages: Math.ceil(total / (limit || 10))
      }
    };
  }

  async getProviderServiceRequests(providerId: string, filters?: any): Promise<PaginatedResponseDto<any>> {
    if (this.serviceRequestService) {
      return await this.serviceRequestService.getServiceRequestsByProvider(providerId, filters);
    }
    
    // Fallback aggregation
    const matchCriteria: any = { providerId, isDeleted: { $ne: true } };
    if (filters?.status) matchCriteria.status = filters.status;

    const aggregation = AggregationBuilder.create()
      .match(matchCriteria)
      .lookup('users', 'userId', '_id', 'user')
      .sort({ createdAt: -1 })
      .skip(((filters?.page || 1) - 1) * (filters?.limit || 10))
      .limit(filters?.limit || 10);

    const requests = await aggregation.execute(ServiceRequest);
    const total = await ServiceRequest.countDocuments(matchCriteria);

    return {
      data: requests,
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        total,
        pages: Math.ceil(total / (filters?.limit || 10))
      }
    };
  }

  async getAvailableServiceRequests(providerId: string, filters?: any): Promise<PaginatedResponseDto<any>> {
    // Get available requests that match provider's services
    const provider = await this.getProviderById(providerId);
    const providerServices = provider.services?.map((s: any) => s.category) || [];

    const matchCriteria: any = {
      status: 'open',
      providerId: { $exists: false },
      isDeleted: { $ne: true }
    };

    if (providerServices.length > 0) {
      matchCriteria.category = { $in: providerServices };
    }

    if (filters?.location && provider.location) {
      matchCriteria.location = {
        $near: {
          $geometry: provider.location,
          $maxDistance: filters.radius || 50000 // 50km default
        }
      };
    }

    const aggregation = AggregationBuilder.create()
      .match(matchCriteria)
      .lookup('users', 'userId', '_id', 'user')
      .sort({ createdAt: -1 })
      .skip(((filters?.page || 1) - 1) * (filters?.limit || 10))
      .limit(filters?.limit || 10);

    const requests = await aggregation.execute(ServiceRequest);
    const total = await ServiceRequest.countDocuments(matchCriteria);

    return {
      data: requests,
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        total,
        pages: Math.ceil(total / (filters?.limit || 10))
      }
    };
  }

  async getAvailableRequests(providerId: string, filters?: any): Promise<PaginatedResponseDto<any>> {
    return await this.getAvailableServiceRequests(providerId, filters);
  }

  async submitProposal(providerId: string, requestId: string, proposalData: any): Promise<ApiResponseDto> {
    try {
      // This would typically create a proposal record
      // For now, we'll update the service request with the proposal
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        {
          $push: {
            proposals: {
              providerId,
              ...proposalData,
              submittedAt: new Date()
            }
          }
        },
        { new: true }
      );

      if (!updatedRequest) {
        throw new NotFoundError('Service request not found');
      }

      return {
        success: true,
        message: 'Proposal submitted successfully',
        data: { requestId, providerId, proposal: proposalData }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to submit proposal',
        errors: [error.message]
      };
    }
  }

  async getProviderDashboard(providerId: string): Promise<any> {
    const [
      provider,
      statistics,
      recentRequests,
      recentReviews
    ] = await Promise.all([
      this.getProviderById(providerId),
      this.getProviderStatistics(providerId),
      this.getProviderServiceRequests(providerId, { limit: 5 }),
      this.getProviderReviews(providerId, 1, 5)
    ]);

    return {
      provider,
      statistics,
      recentRequests: recentRequests.data,
      recentReviews: recentReviews.data
    };
  }

  async updateProviderRating(providerId: string): Promise<void> {
    const aggregation = AggregationBuilder.create()
      .match({ providerId })
      .group({
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      });

    const result = await aggregation.execute(Review);
    const stats = result[0];

    if (stats) {
      await ServiceProvider.findByIdAndUpdate(providerId, {
        rating: Math.round(stats.averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: stats.totalReviews,
        updatedAt: new Date()
      });
    }
  }

  async updateProviderStatus(providerId: string, status: string): Promise<ApiResponseDto> {
    const input: ProviderOperationInput = {
      providerId,
      data: { status },
      metadata: { timestamp: new Date(), operation: 'updateStatus' }
    };

    const result = await this.providerOperationRegistry.execute('updateStatus', input);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  async deleteProvider(providerId: string): Promise<ApiResponseDto> {
    try {
      const provider = await ServiceProvider.findByIdAndUpdate(
        providerId,
        {
          isDeleted: true,
          isActive: false,
          deletedAt: new Date()
        },
        { new: true }
      );

      if (!provider) {
        throw new NotFoundError('Provider not found');
      }

      return {
        success: true,
        message: 'Provider deleted successfully',
        data: { providerId, deleted: true }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete provider',
        errors: [error.message]
      };
    }
  }

  async getAllProviders(filters: ProviderFiltersDto): Promise<PaginatedResponseDto<any>> {
    const input: ProviderSearchInput = { filters, includeInactive: true };
    const result = await this.providerSearchRegistry.execute('searchProviders', input);
    
    if (!result.success) {
      throw new ValidationError(result.message);
    }

    return result.data;
  }

  async incrementCompletedJobs(providerId: string): Promise<void> {
    await ServiceProvider.findByIdAndUpdate(providerId, {
      $inc: { completedJobs: 1 },
      updatedAt: new Date()
    });
  }
}
