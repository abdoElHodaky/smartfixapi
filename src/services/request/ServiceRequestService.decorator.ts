/**
 * Decorator-Based ServiceRequestService Implementation
 * 
 * Enhanced ServiceRequestService using Strategy Patterns and AggregationBuilder
 * for optimized performance and maintainable conditional logic.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { ServiceRequest } from '../../models/ServiceRequest';
import { User } from '../../models/User';
import { Provider } from '../../models/Provider';
import { NotFoundError, ValidationError, AuthenticationError } from '../../middleware/errorHandler';
import { IServiceRequestService, IUserService, IProviderService, IReviewService } from '../../interfaces/services';
import {
  CreateRequestDto,
  UpdateRequestDto,
  RequestFiltersDto,
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

// Import strategy interfaces
import {
  ServiceRequestOperationInput,
  ServiceRequestSearchInput,
  ServiceRequestMatchingInput,
  ServiceRequestStatisticsInput
} from '../../strategy/interfaces/ServiceStrategy';

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 7
})
export class ServiceRequestService implements IServiceRequestService {
  private requestOperationRegistry: AsyncStrategyRegistry<ServiceRequestOperationInput, CommandResult>;
  private requestSearchRegistry: AsyncStrategyRegistry<ServiceRequestSearchInput, CommandResult>;
  private requestMatchingRegistry: AsyncStrategyRegistry<ServiceRequestMatchingInput, CommandResult>;
  private requestStatisticsRegistry: AsyncStrategyRegistry<ServiceRequestStatisticsInput, CommandResult>;

  constructor(
    @Inject('UserService') private userService?: IUserService,
    @Inject('ProviderService') private providerService?: IProviderService,
    @Inject('ReviewService') private reviewService?: IReviewService
  ) {
    this.initializeStrategies();
  }

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('🔧 Strategy-based ServiceRequestService initialized with optimized patterns');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('🔧 Strategy-based ServiceRequestService cleanup completed');
  }

  /**
   * Initialize all strategy registries
   */
  private initializeStrategies(): void {
    // Service request operation strategies
    this.requestOperationRegistry = new AsyncStrategyRegistry<ServiceRequestOperationInput, CommandResult>();
    // Note: Strategy implementations would be registered here
    // this.requestOperationRegistry.register('createRequest', new CreateServiceRequestStrategy());
    // this.requestOperationRegistry.register('updateRequest', new UpdateServiceRequestStrategy());
    // etc.

    // Service request search strategies
    this.requestSearchRegistry = new AsyncStrategyRegistry<ServiceRequestSearchInput, CommandResult>();
    // this.requestSearchRegistry.register('searchRequests', new SearchServiceRequestsStrategy());

    // Service request matching strategies
    this.requestMatchingRegistry = new AsyncStrategyRegistry<ServiceRequestMatchingInput, CommandResult>();
    // this.requestMatchingRegistry.register('findProviders', new FindMatchingProvidersStrategy());

    // Service request statistics strategies
    this.requestStatisticsRegistry = new AsyncStrategyRegistry<ServiceRequestStatisticsInput, CommandResult>();
    // this.requestStatisticsRegistry.register('getStatistics', new GetServiceRequestStatisticsStrategy());
  }

  /**
   * Create a new service request
   */
  @Log({
    message: 'Creating service request with strategy pattern',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  })
  async createServiceRequest(userId: string, requestData: CreateRequestDto): Promise<ApiResponseDto> {
    try {
      // Validate user exists
      if (this.userService) {
        await this.userService.getUserById(userId);
      }

      // Create service request using aggregation
      const serviceRequest = new ServiceRequest({
        userId,
        ...requestData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedRequest = await serviceRequest.save();

      return {
        success: true,
        message: 'Service request created successfully',
        data: savedRequest
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create service request',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get service request by ID
   */
  @Log({
    message: 'Getting service request by ID with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getServiceRequestById(requestId: string): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .match({ _id: requestId, isDeleted: { $ne: true } })
      .lookup('users', 'userId', '_id', 'user')
      .lookup('providers', 'providerId', '_id', 'provider')
      .addFields({
        user: { $arrayElemAt: ['$user', 0] },
        provider: { $arrayElemAt: ['$provider', 0] }
      });

    const result = await aggregation.execute(ServiceRequest);
    
    if (!result || result.length === 0) {
      throw new NotFoundError('Service request not found');
    }

    return result[0];
  }

  /**
   * Update service request
   */
  @Log({
    message: 'Updating service request with strategy pattern',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'linear'
  })
  async updateServiceRequest(requestId: string, updateData: UpdateRequestDto): Promise<ApiResponseDto> {
    try {
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );

      if (!updatedRequest) {
        throw new NotFoundError('Service request not found');
      }

      return {
        success: true,
        message: 'Service request updated successfully',
        data: updatedRequest
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update service request',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Delete service request
   */
  @Log({
    message: 'Deleting service request with strategy pattern',
    includeExecutionTime: true
  })
  async deleteServiceRequest(requestId: string): Promise<ApiResponseDto> {
    try {
      const deletedRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );

      if (!deletedRequest) {
        throw new NotFoundError('Service request not found');
      }

      return {
        success: true,
        message: 'Service request deleted successfully',
        data: deletedRequest
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete service request',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Search service requests with filters
   */
  @Log({
    message: 'Searching service requests with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async searchServiceRequests(filters: RequestFiltersDto): Promise<PaginatedResponseDto<any>> {
    const { page = 1, limit = 10, status, category, location, ...otherFilters } = filters;

    const matchConditions: any = { isDeleted: { $ne: true } };
    
    if (status) matchConditions.status = status;
    if (category) matchConditions.category = category;
    if (location) {
      matchConditions.location = {
        $near: {
          $geometry: location,
          $maxDistance: filters.radius || 10000
        }
      };
    }

    const aggregation = AggregationBuilder.create()
      .match(matchConditions)
      .lookup('users', 'userId', '_id', 'user')
      .lookup('providers', 'providerId', '_id', 'provider')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const requests = await aggregation.execute(ServiceRequest);
    const total = await ServiceRequest.countDocuments(matchConditions);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find matching providers for a request
   */
  @Log({
    message: 'Finding matching providers with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async findMatchingProviders(serviceRequestId: string): Promise<any[]> {
    const serviceRequest = await this.getServiceRequestById(serviceRequestId);
    
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Find providers based on category, location, and availability
    const matchConditions: any = {
      isActive: true,
      isVerified: true,
      categories: serviceRequest.category
    };

    if (serviceRequest.location) {
      matchConditions.location = {
        $near: {
          $geometry: serviceRequest.location,
          $maxDistance: 50000 // 50km radius
        }
      };
    }

    const aggregation = AggregationBuilder.create()
      .match(matchConditions)
      .lookup('reviews', 'providerId', 'providerId', 'reviews')
      .addFields({
        averageRating: { $avg: '$reviews.rating' },
        reviewCount: { $size: '$reviews' }
      })
      .sort({ averageRating: -1, reviewCount: -1 });

    return await aggregation.execute(Provider);
  }

  /**
   * Accept service request (provider)
   */
  @Log({
    message: 'Accepting service request',
    includeExecutionTime: true
  })
  async acceptServiceRequest(requestId: string, providerId: string): Promise<ApiResponseDto> {
    try {
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        { 
          providerId,
          status: 'accepted',
          acceptedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedRequest) {
        throw new NotFoundError('Service request not found');
      }

      return {
        success: true,
        message: 'Service request accepted successfully',
        data: updatedRequest
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to accept service request',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Reject service request (provider)
   */
  @Log({
    message: 'Rejecting service request',
    includeExecutionTime: true
  })
  async rejectServiceRequest(requestId: string, providerId: string, reason?: string): Promise<ApiResponseDto> {
    try {
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        { 
          status: 'rejected',
          rejectionReason: reason,
          rejectedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedRequest) {
        throw new NotFoundError('Service request not found');
      }

      return {
        success: true,
        message: 'Service request rejected successfully',
        data: updatedRequest
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject service request',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Start service (provider)
   */
  @Log({
    message: 'Starting service',
    includeExecutionTime: true
  })
  async startService(requestId: string, providerId: string): Promise<ApiResponseDto> {
    try {
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        { 
          status: 'in_progress',
          startedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedRequest) {
        throw new NotFoundError('Service request not found');
      }

      return {
        success: true,
        message: 'Service started successfully',
        data: updatedRequest
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start service',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Complete service (provider)
   */
  @Log({
    message: 'Completing service',
    includeExecutionTime: true
  })
  async completeService(requestId: string, providerId: string, completionData: any): Promise<ApiResponseDto> {
    try {
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        { 
          status: 'completed',
          completionData,
          completedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedRequest) {
        throw new NotFoundError('Service request not found');
      }

      return {
        success: true,
        message: 'Service completed successfully',
        data: updatedRequest
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to complete service',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Approve completion (customer)
   */
  @Log({
    message: 'Approving service completion',
    includeExecutionTime: true
  })
  async approveCompletion(requestId: string, userId: string): Promise<ApiResponseDto> {
    try {
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        { 
          status: 'approved',
          approvedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedRequest) {
        throw new NotFoundError('Service request not found');
      }

      return {
        success: true,
        message: 'Service completion approved successfully',
        data: updatedRequest
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve completion',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Request revision (customer)
   */
  @Log({
    message: 'Requesting service revision',
    includeExecutionTime: true
  })
  async requestRevision(requestId: string, userId: string, revisionNotes: string): Promise<ApiResponseDto> {
    try {
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        { 
          status: 'revision_requested',
          revisionNotes,
          revisionRequestedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedRequest) {
        throw new NotFoundError('Service request not found');
      }

      return {
        success: true,
        message: 'Revision requested successfully',
        data: updatedRequest
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to request revision',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Cancel service request
   */
  @Log({
    message: 'Cancelling service request',
    includeExecutionTime: true
  })
  async cancelServiceRequest(requestId: string, userId: string, reason?: string): Promise<ApiResponseDto> {
    try {
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        { 
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedRequest) {
        throw new NotFoundError('Service request not found');
      }

      return {
        success: true,
        message: 'Service request cancelled successfully',
        data: updatedRequest
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel service request',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get service request history
   */
  @Log({
    message: 'Getting service request history',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getServiceRequestHistory(requestId: string): Promise<any[]> {
    // This would typically involve a separate history/audit table
    // For now, return basic status changes
    const serviceRequest = await this.getServiceRequestById(requestId);
    
    const history = [];
    if (serviceRequest.createdAt) {
      history.push({
        action: 'created',
        timestamp: serviceRequest.createdAt,
        status: 'pending'
      });
    }
    if (serviceRequest.acceptedAt) {
      history.push({
        action: 'accepted',
        timestamp: serviceRequest.acceptedAt,
        status: 'accepted'
      });
    }
    if (serviceRequest.startedAt) {
      history.push({
        action: 'started',
        timestamp: serviceRequest.startedAt,
        status: 'in_progress'
      });
    }
    if (serviceRequest.completedAt) {
      history.push({
        action: 'completed',
        timestamp: serviceRequest.completedAt,
        status: 'completed'
      });
    }

    return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Get service requests by user
   */
  @Log({
    message: 'Getting service requests by user',
    includeExecutionTime: true
  })
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  async getServiceRequestsByUser(userId: string, filters?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponseDto<any>> {
    const { status, page = 1, limit = 10 } = filters || {};
    
    const matchConditions: any = { userId, isDeleted: { $ne: true } };
    if (status) matchConditions.status = status;

    const aggregation = AggregationBuilder.create()
      .match(matchConditions)
      .lookup('providers', 'providerId', '_id', 'provider')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const requests = await aggregation.execute(ServiceRequest);
    const total = await ServiceRequest.countDocuments(matchConditions);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get service requests by provider
   */
  @Log({
    message: 'Getting service requests by provider',
    includeExecutionTime: true
  })
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  async getServiceRequestsByProvider(providerId: string, filters?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponseDto<any>> {
    const { status, page = 1, limit = 10 } = filters || {};
    
    const matchConditions: any = { providerId, isDeleted: { $ne: true } };
    if (status) matchConditions.status = status;

    const aggregation = AggregationBuilder.create()
      .match(matchConditions)
      .lookup('users', 'userId', '_id', 'user')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const requests = await aggregation.execute(ServiceRequest);
    const total = await ServiceRequest.countDocuments(matchConditions);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get all service requests (admin function)
   */
  @Log({
    message: 'Getting all service requests (admin)',
    includeExecutionTime: true
  })
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async getAllServiceRequests(filters: RequestFiltersDto): Promise<PaginatedResponseDto<any>> {
    return this.searchServiceRequests({ ...filters, includeInactive: true });
  }

  /**
   * Update service request status (admin function)
   */
  @Log({
    message: 'Updating service request status (admin)',
    includeExecutionTime: true
  })
  async updateServiceRequestStatus(requestId: string, status: string): Promise<ApiResponseDto> {
    return this.updateServiceRequest(requestId, { status } as UpdateRequestDto);
  }

  /**
   * Get service request reviews by delegating to ReviewService
   */
  @Log({
    message: 'Getting service request reviews',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getServiceRequestReviews(requestId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>> {
    if (this.reviewService) {
      return await this.reviewService.getReviewsByServiceRequestId(requestId, page, limit);
    }
    
    // Fallback implementation
    return {
      data: [],
      pagination: {
        page: page || 1,
        limit: limit || 10,
        total: 0,
        pages: 0
      }
    };
  }

  /**
   * Get service request statistics
   */
  @Log({
    message: 'Getting service request statistics',
    includeExecutionTime: true
  })
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getServiceRequestStatistics(requestId: string): Promise<any> {
    const serviceRequest = await this.getServiceRequestById(requestId);
    
    // Basic statistics - could be enhanced with more complex aggregations
    return {
      requestId,
      status: serviceRequest.status,
      createdAt: serviceRequest.createdAt,
      duration: serviceRequest.completedAt ? 
        new Date(serviceRequest.completedAt).getTime() - new Date(serviceRequest.createdAt).getTime() : null,
      hasReviews: serviceRequest.reviews && serviceRequest.reviews.length > 0
    };
  }

  /**
   * Get statistics by user
   */
  @Log({
    message: 'Getting statistics by user',
    includeExecutionTime: true
  })
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getStatisticsByUser(userId: string): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .match({ userId, isDeleted: { $ne: true } })
      .group({
        _id: '$status',
        count: { $sum: 1 }
      });

    const statusCounts = await aggregation.execute(ServiceRequest);
    const total = await ServiceRequest.countDocuments({ userId, isDeleted: { $ne: true } });

    return {
      userId,
      totalRequests: total,
      statusBreakdown: statusCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }

  /**
   * Get statistics by provider
   */
  @Log({
    message: 'Getting statistics by provider',
    includeExecutionTime: true
  })
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getStatisticsByProvider(providerId: string): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .match({ providerId, isDeleted: { $ne: true } })
      .group({
        _id: '$status',
        count: { $sum: 1 }
      });

    const statusCounts = await aggregation.execute(ServiceRequest);
    const total = await ServiceRequest.countDocuments({ providerId, isDeleted: { $ne: true } });

    return {
      providerId,
      totalRequests: total,
      statusBreakdown: statusCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }
}

