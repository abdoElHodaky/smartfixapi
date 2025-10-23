/**
 * Strategy-Based ProviderService Implementation
 * 
 * Enhanced ProviderService using Strategy Patterns and AggregationBuilder
 * for optimized performance and maintainable conditional logic.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { ServiceProvider } from '../../../models/ServiceProvider';
import { User } from '../../../models/User';
import { ServiceRequest } from '../../../models/ServiceRequest';
import { Review } from '../../../models/Review';
import { NotFoundError, ValidationError, AuthenticationError } from '../../common/middleware/errorHandler';
import { IProviderService, IReviewService, IServiceRequestService } from '../../common/interfaces/services/index';
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

// Import strategy implementations
import {
  GetProviderByIdStrategy,
  GetProviderByUserIdStrategy
} from '../../strategy/provider/GetProviderStrategies';
import {
  UpdateProviderProfileStrategy,
  UpdateProviderStatusStrategy
} from '../../strategy/provider/UpdateProviderStrategies';
import {
  SearchProvidersStrategy
} from '../../strategy/provider/SearchProviderStrategies';
import {
  AddPortfolioItemStrategy,
  UpdatePortfolioItemStrategy,
  DeletePortfolioItemStrategy
} from '../../strategy/provider/PortfolioStrategies';
import {
  GetProviderStatisticsStrategy
} from '../../strategy/provider/ProviderStatisticsStrategies';

// Import strategy interfaces
import {
  ProviderOperationInput,
  ProviderSearchInput,
  PortfolioOperationInput,
  ProviderStatisticsInput
} from '../../strategy/interfaces/ServiceStrategy';

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
} from '../../../decorators/service';

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
