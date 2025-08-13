/**
 * Decorator-Based ProviderService
 * 
 * Modern implementation of provider service using decorators for
 * enhanced functionality including caching, logging, retry logic, and validation.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { ServiceProvider } from '../../models/ServiceProvider';
import { User } from '../../models/User';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { IProviderService, IReviewService, IServiceRequestService } from '../../interfaces/services';
import {
  UpdateProviderDto,
  ProviderFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto,
  ProviderStatisticsDto,
  PortfolioItemDto
} from '../../dtos';

// Import optimization utilities
import { AggregationBuilder, ConditionalHelpers, ErrorHandlers } from '../../utils';

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

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 3
})
export class ProviderService implements IProviderService {
  constructor(
    @Inject('ReviewService') private reviewService?: IReviewService,
    @Inject('ServiceRequestService') private serviceRequestService?: IServiceRequestService
  ) {}

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('🔧 ProviderService initialized with decorator-based architecture');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('🔧 ProviderService cleanup completed');
  }

  /**
   * Get provider by ID with caching
   */
  @Log('Getting provider by ID')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  @Retryable({
    attempts: 3,
    delay: 1000,
    condition: (error: Error) => error.message.includes('database')
  })
  async getProviderById(providerId: string): Promise<any> {
    const provider = await ServiceProvider.findById(providerId)
      .populate('userId', '-password');
    
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    
    return provider;
  }

  /**
   * Get provider by user ID with caching
   */
  @Log('Getting provider by user ID')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  @Retryable(2)
  async getProviderByUserId(userId: string): Promise<any> {
    const provider = await ServiceProvider.findOne({ userId })
      .populate('userId', '-password');
    
    if (!provider) {
      throw new NotFoundError('Provider profile not found');
    }
    
    return provider;
  }

  /**
   * Update provider profile with comprehensive logging
   */
  @Log({
    message: 'Updating provider profile',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 2,
    delay: 1500,
    condition: (error: Error) => error.message.includes('database') || error.message.includes('network')
  })
  async updateProviderProfile(providerId: string, updateData: UpdateProviderDto): Promise<ApiResponseDto> {
    const provider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('userId', '-password');

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    return {
      success: true,
      message: 'Provider profile updated successfully',
      data: provider
    };
  }

  /**
   * Get provider's service requests with caching
   */
  @Log('Getting provider service requests')
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  @Retryable(2)
  async getProviderServiceRequests(providerId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    if (!this.serviceRequestService) {
      throw new ValidationError('Service request service not available');
    }

    try {
      // This would typically call the service request service
      // For now, we'll return a placeholder structure
      const skip = (page - 1) * limit;
      
      // In a real implementation, you would call:
      // return await this.serviceRequestService.getRequestsByProviderId(providerId, { page, limit });
      
      return {
        success: true,
        message: 'Provider service requests retrieved successfully',
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to get provider service requests');
    }
  }

  /**
   * Get available service requests for provider with advanced filtering
   */
  @Log('Getting available service requests')
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  @Retryable(2)
  async getAvailableServiceRequests(
    providerId: string, 
    filters: any = {}, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto> {
    try {
      const provider = await this.getProviderById(providerId);
      
      // In a real implementation, you would:
      // 1. Get provider's service categories and location
      // 2. Find matching service requests
      // 3. Apply distance and other filters
      // 4. Exclude requests already applied to
      
      return {
        success: true,
        message: 'Available service requests retrieved successfully',
        data: [], // Placeholder for available requests
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to get available service requests');
    }
  }

  /**
   * Submit proposal with retry logic
   */
  @Log({
    message: 'Submitting proposal',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 2000,
    backoff: 'exponential'
  })
  async submitProposal(providerId: string, serviceRequestId: string, proposalData: any): Promise<ApiResponseDto> {
    try {
      // Validate provider exists
      const provider = await this.getProviderById(providerId);
      
      // In a real implementation, you would:
      // 1. Validate the service request exists and is open
      // 2. Check if provider already submitted a proposal
      // 3. Create the proposal record
      // 4. Send notifications
      
      return {
        success: true,
        message: 'Proposal submitted successfully',
        data: {
          proposalId: 'placeholder-id',
          serviceRequestId,
          providerId,
          submittedAt: new Date()
        }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to submit proposal');
    }
  }

  /**
   * Get provider dashboard data with comprehensive caching
   */
  @Log({
    message: 'Getting provider dashboard data',
    includeExecutionTime: true
  })
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'linear'
  })
  async getProviderDashboard(providerId: string): Promise<ApiResponseDto> {
    try {
      // Get provider basic info
      const provider = await this.getProviderById(providerId);

      // Get provider statistics (placeholder implementation)
      const statistics: ProviderStatisticsDto = {
        totalServiceRequests: 0,
        activeServiceRequests: 0,
        completedServiceRequests: 0,
        totalProposals: 0,
        acceptedProposals: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalReviews: 0,
        joinDate: provider.createdAt,
        lastActivity: provider.updatedAt
      };

      // In a real implementation, you would gather actual statistics:
      // const serviceRequestStats = await this.serviceRequestService?.getProviderStatistics(providerId);
      // const reviewStats = await this.reviewService?.getProviderStatistics(providerId);

      return {
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: {
          provider: provider.toJSON(),
          statistics,
          recentActivity: [], // Placeholder for recent activities
          notifications: [],  // Placeholder for notifications
          availableRequests: [] // Placeholder for available requests
        }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to get dashboard data');
    }
  }

  /**
   * Update provider availability
   */
  @Log('Updating provider availability')
  @Retryable(2)
  async updateAvailability(providerId: string, availability: any): Promise<ApiResponseDto> {
    try {
      const provider = await ServiceProvider.findByIdAndUpdate(
        providerId,
        { 
          availability,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('userId', '-password');
  
      if (!provider) {
        throw new NotFoundError('Provider not found');
      }
  
      return {
        success: true,
        message: 'Availability updated successfully',
        data: { provider }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to update provider availability');
    }
  }

  /**
   * Add portfolio item with validation
   */
  @Log('Adding portfolio item')
  @Retryable({
    attempts: 2,
    delay: 1500
  })
  async addPortfolioItem(providerId: string, portfolioItem: PortfolioItemDto): Promise<ApiResponseDto> {
    try {
      const provider = await ServiceProvider.findById(providerId);
      if (!provider) {
        throw new NotFoundError('Provider not found');
      }

      // Validate portfolio item
      if (!portfolioItem.title || !portfolioItem.description) {
        throw new ValidationError('Portfolio item must have title and description');
      }

      // Add to portfolio array
      const newPortfolioItem = {
        ...portfolioItem,
        id: Date.now().toString(), // Simple ID generation
        createdAt: new Date()
      };

      provider.portfolio = provider.portfolio || [];
      provider.portfolio.push(newPortfolioItem);
      provider.updatedAt = new Date();

      await provider.save();

      return {
        success: true,
        message: 'Portfolio item added successfully',
        data: { portfolioItem: newPortfolioItem }
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Failed to add portfolio item');
    }
  }

  /**
   * Search providers with advanced filtering and caching
   * @deprecated Use searchProvidersAdvanced instead which follows AdminService.strategy pattern
   */
  @Log('Searching providers')
  @Cached(1 * 60 * 1000) // Cache for 1 minute
  @Retryable(2)
  async searchProviders(filters: ProviderFiltersDto, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    // Delegate to the optimized implementation
    return this.searchProvidersAdvanced(filters, page, limit);
  }
  
  /**
   * Search providers with advanced filtering - OPTIMIZED with AggregationBuilder following AdminService strategy
   */
  @Log('Advanced provider search with aggregation')
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  @Retryable({
    attempts: 2,
    delay: 1000
  })
  async searchProvidersAdvanced(filters: ProviderFiltersDto, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    try {
      const skip = (page - 1) * limit;
      
      // Build aggregation pipeline using AggregationBuilder following AdminService strategy
      let aggregationBuilder = AggregationBuilder.create()
        .match({ status: 'active' });

      // Apply filters using AggregationBuilder
      if (filters.services && filters.services.length > 0) {
        aggregationBuilder = aggregationBuilder.match({
          services: { $in: filters.services }
        });
      }

      if (filters.location && filters.radius) {
        aggregationBuilder = aggregationBuilder.match({
          serviceArea: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [filters.location.longitude, filters.location.latitude]
              },
              $maxDistance: filters.radius * 1000 // Convert km to meters
            }
          }
        });
      }

      if (filters.minRating) {
        aggregationBuilder = aggregationBuilder.match({
          averageRating: { $gte: filters.minRating }
        });
      }

      if (filters.maxHourlyRate) {
        aggregationBuilder = aggregationBuilder.match({
          hourlyRate: { $lte: filters.maxHourlyRate }
        });
      }

      if (filters.minHourlyRate) {
        aggregationBuilder = aggregationBuilder.match({
          hourlyRate: { $gte: filters.minHourlyRate }
        });
      }

      if (filters.searchTerm) {
        aggregationBuilder = aggregationBuilder.match({
          $or: [
            { businessName: { $regex: filters.searchTerm, $options: 'i' } },
            { description: { $regex: filters.searchTerm, $options: 'i' } },
            { services: { $regex: filters.searchTerm, $options: 'i' } }
          ]
        });
      }

      // Execute aggregation with pagination using AdminService strategy
      const [providers, totalCount] = await Promise.all([
        aggregationBuilder
          .lookup({
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          })
          .unwind('$user')
          .project({
            'user.password': 0
          })
          .sort({ averageRating: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .execute(ServiceProvider),
        aggregationBuilder
          .group({ _id: null, count: { $sum: 1 } })
          .execute(ServiceProvider)
      ]);

      const total = totalCount[0]?.count || 0;

      return {
        success: true,
        message: 'Providers retrieved successfully with advanced filtering',
        data: providers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to search providers with advanced filtering');
    }
  }

  /**
   * Get provider statistics with caching
   */
  @Log('Getting provider statistics')
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getProviderStatistics(providerId: string): Promise<ProviderStatisticsDto> {
    try {
      const provider = await this.getProviderById(providerId);

      // In a real implementation, you would gather actual statistics from related services
      const statistics: ProviderStatisticsDto = {
        totalServiceRequests: 0,
        activeServiceRequests: 0,
        completedServiceRequests: 0,
        totalProposals: 0,
        acceptedProposals: 0,
        totalEarnings: 0,
        averageRating: provider.averageRating || 0,
        totalReviews: provider.totalReviews || 0,
        joinDate: provider.createdAt,
        lastActivity: provider.updatedAt
      };

      return statistics;
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to get provider statistics');
    }
  }

  /**
   * Update provider services
   */
  @Log('Updating provider services')
  @Retryable(2)
  async updateProviderServices(providerId: string, services: string[]): Promise<ApiResponseDto> {
    try {
      if (!services || services.length === 0) {
        throw new ValidationError('At least one service must be specified');
      }
  
      const provider = await ServiceProvider.findByIdAndUpdate(
        providerId,
        { 
          services,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('userId', '-password');
  
      if (!provider) {
        throw new NotFoundError('Provider not found');
      }
  
      return {
        success: true,
        message: 'Services updated successfully',
        data: { provider }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to update provider services');
    }
  }

  /**
   * Get provider reviews with caching
   */
  @Log('Getting provider reviews')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  @Retryable(2)
  async getProviderReviews(providerId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    if (!this.reviewService) {
      throw new ValidationError('Review service not available');
    }

    try {
      // This would typically call the review service
      // For now, we'll return a placeholder structure
      const skip = (page - 1) * limit;
      
      // In a real implementation, you would call:
      // return await this.reviewService.getReviewsByProviderId(providerId, { page, limit });
      
      return {
        success: true,
        message: 'Provider reviews retrieved successfully',
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to get provider reviews');
    }
  }

  /**
   * Update provider location and service area
   */
  @Log('Updating provider location')
  @Retryable(2)
  async updateProviderLocation(
    providerId: string, 
    location: { latitude: number; longitude: number; address?: string },
    serviceRadius: number = 25
  ): Promise<ApiResponseDto> {
    try {
      // Validate coordinates
      if (location.latitude < -90 || location.latitude > 90) {
        throw new ValidationError('Invalid latitude value');
      }
      if (location.longitude < -180 || location.longitude > 180) {
        throw new ValidationError('Invalid longitude value');
      }
  
      const provider = await ServiceProvider.findByIdAndUpdate(
        providerId,
        { 
          serviceArea: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          serviceRadius,
          address: location.address,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('userId', '-password');
  
      if (!provider) {
        throw new NotFoundError('Provider not found');
      }
  
      return {
        success: true,
        message: 'Location updated successfully',
        data: { provider }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to update provider location');
    }
  }
}
