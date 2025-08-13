/**
 * Decorator-Based ServiceRequestService
 * 
 * Modern implementation of service request service using decorators for
 * enhanced functionality including caching, logging, retry logic, and validation.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { ServiceRequest } from '../../models/ServiceRequest';
import { ServiceProvider } from '../../models/ServiceProvider';
import { User } from '../../models/User';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { ConditionalHelpers, ErrorHandlers, AggregationBuilder } from '../../utils';
import { IServiceRequestService, IProviderService, IUserService, IReviewService } from '../../interfaces/services';
import {
  CreateRequestDto,
  UpdateRequestDto,
  RequestFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto,
  ServiceRequestStatisticsDto
} from '../../dtos';

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
  priority: 4
})
export class ServiceRequestService implements IServiceRequestService {
  constructor(
    @Inject('ProviderService') private providerService: IProviderService,
    @Inject('UserService') private userService: IUserService,
    @Inject('ReviewService') private reviewService?: IReviewService
  ) {}

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('📋 ServiceRequestService initialized with decorator-based architecture');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('📋 ServiceRequestService cleanup completed');
  }

  /**
   * Create a new service request with validation and logging
   */
  @Log({
    message: 'Creating service request',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 2000,
    condition: (error: Error) => error.message.includes('database')
  })
  async createServiceRequest(userId: string, requestData: CreateRequestDto): Promise<ApiResponseDto> {
    try {
      // Verify user exists
      await this.userService.getUserById(userId);

      // Validate request data
      if (!requestData.title || !requestData.description) {
        throw new ValidationError('Title and description are required');
      }

      if (!requestData.category || !requestData.location) {
        throw new ValidationError('Category and location are required');
      }

      const serviceRequest = new ServiceRequest({
        ...requestData,
        userId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await serviceRequest.save();

      return {
        success: true,
        message: 'Service request created successfully',
        data: serviceRequest
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to create service request');
    }
  }

  /**
   * Get service request by ID with caching
   */
  @Log('Getting service request by ID')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  @Retryable({
    attempts: 3,
    delay: 1000,
    condition: (error: Error) => error.message.includes('database')
  })
  async getServiceRequestById(requestId: string): Promise<any> {
    try {
      const serviceRequest = await ServiceRequest.findById(requestId)
        .populate('userId', 'firstName lastName email phone profileImage')
        .populate('providerId', 'businessName rating userId');
  
      if (!serviceRequest) {
        throw new NotFoundError('Service request not found');
      }
  
      return serviceRequest;
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to get service request');
    }
  }

  /**
   * Update service request with comprehensive logging
   */
  @Log({
    message: 'Updating service request',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 2,
    delay: 1500,
    condition: (error: Error) => error.message.includes('database')
  })
  async updateServiceRequest(requestId: string, updateData: UpdateRequestDto): Promise<ApiResponseDto> {
    try {
      const serviceRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('userId', 'firstName lastName email phone profileImage');
  
      if (!serviceRequest) {
        throw new NotFoundError('Service request not found');
      }
  
      return {
        success: true,
        message: 'Service request updated successfully',
        data: serviceRequest
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to update service request');
    }
  }

  /**
   * Delete service request with validation
   */
  @Log('Deleting service request')
  @Retryable(2)
  async deleteServiceRequest(requestId: string): Promise<ApiResponseDto> {
    try {
      const serviceRequest = await ServiceRequest.findById(requestId);
      
      if (!serviceRequest) {
        throw new NotFoundError('Service request not found');
      }
  
      // Optimized: Use ConditionalHelpers for status validation
      const statusError = ConditionalHelpers.guardServiceRequestStatus(
        serviceRequest.status, 
        ['pending', 'cancelled', 'completed']
      );
      if (statusError) {
        throw new ValidationError('Cannot delete service request that is in progress');
      }
  
      await ServiceRequest.findByIdAndDelete(requestId);
  
      return {
        success: true,
        message: 'Service request deleted successfully',
        data: null
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to delete service request');
    }
  }

  /**
   * Search service requests with advanced filtering and caching
   * @deprecated Use searchServiceRequestsAdvanced instead which follows AdminService.strategy pattern
   */
  @Log('Searching service requests')
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  @Retryable(2)
  async searchServiceRequests(filters: RequestFiltersDto, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    // Delegate to the optimized implementation
    return this.searchServiceRequestsAdvanced(filters, page, limit);
  }
  
  /**
   * Search service requests with advanced filtering - OPTIMIZED with AggregationBuilder following AdminService strategy
   */
  @Log('Advanced service request search with aggregation')
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  @Retryable({
    attempts: 2,
    delay: 1000
  })
  async searchServiceRequestsAdvanced(filters: RequestFiltersDto, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    try {
      const skip = (page - 1) * limit;
      
      // Build aggregation pipeline using AggregationBuilder following AdminService strategy
      let aggregationBuilder = AggregationBuilder.create();
      
      // Apply filters using AggregationBuilder
      if (filters.status) {
        aggregationBuilder = aggregationBuilder.match({ status: filters.status });
      }

      if (filters.category) {
        aggregationBuilder = aggregationBuilder.match({ category: filters.category });
      }

      if (filters.location && filters.radius) {
        aggregationBuilder = aggregationBuilder.match({
          location: {
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

      if (filters.minBudget || filters.maxBudget) {
        const budgetMatch: any = {};
        if (filters.minBudget) budgetMatch.$gte = filters.minBudget;
        if (filters.maxBudget) budgetMatch.$lte = filters.maxBudget;
        
        aggregationBuilder = aggregationBuilder.match({ budget: budgetMatch });
      }

      if (filters.searchTerm) {
        aggregationBuilder = aggregationBuilder.match({
          $or: [
            { title: { $regex: filters.searchTerm, $options: 'i' } },
            { description: { $regex: filters.searchTerm, $options: 'i' } },
            { category: { $regex: filters.searchTerm, $options: 'i' } }
          ]
        });
      }

      // Execute aggregation with pagination using AdminService strategy
      const [requests, totalCount] = await Promise.all([
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
          .lookup({
            from: 'serviceproviders',
            localField: 'providerId',
            foreignField: '_id',
            as: 'provider'
          })
          .unwind({
            path: '$provider',
            preserveNullAndEmptyArrays: true
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .execute(ServiceRequest),
        aggregationBuilder
          .group({ _id: null, count: { $sum: 1 } })
          .execute(ServiceRequest)
      ]);

      const total = totalCount[0]?.count || 0;

      return {
        success: true,
        message: 'Service requests retrieved successfully with advanced filtering',
        data: requests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to search service requests with advanced filtering');
    }
  }

  /**
   * Get user's service requests with caching
   */
  @Log('Getting user service requests')
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  @Retryable(2)
  async getUserServiceRequests(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    try {
      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        ServiceRequest.find({ userId })
          .populate('providerId', 'businessName rating userId')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        ServiceRequest.countDocuments({ userId })
      ]);

      return {
        success: true,
        message: 'User service requests retrieved successfully',
        data: requests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to get user service requests');
    }
  }

  /**
   * Get provider's service requests with caching
   */
  @Log('Getting provider service requests')
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  @Retryable(2)
  async getProviderServiceRequests(providerId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    try {
      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        ServiceRequest.find({ providerId })
          .populate('userId', 'firstName lastName email phone profileImage')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        ServiceRequest.countDocuments({ providerId })
      ]);

      return {
        success: true,
        message: 'Provider service requests retrieved successfully',
        data: requests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to get provider service requests');
    }
  }

  /**
   * Assign provider to service request
   */
  @Log({
    message: 'Assigning provider to service request',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 2000
  })
  async assignProvider(requestId: string, providerId: string): Promise<ApiResponseDto> {
    try {
      // Verify service request exists
      const serviceRequest = await this.getServiceRequestById(requestId);
      
      if (serviceRequest.status !== 'pending') {
        throw new ValidationError('Service request is not available for assignment');
      }

      // Verify provider exists
      await this.providerService.getProviderById(providerId);

      // Update service request
      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        {
          providerId,
          status: 'assigned',
          assignedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).populate('userId', 'firstName lastName email phone')
       .populate('providerId', 'businessName rating userId');

      return {
        success: true,
        message: 'Provider assigned successfully',
        data: updatedRequest
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to assign provider');
    }
  }

  /**
   * Update service request status
   */
  @Log('Updating service request status')
  @Retryable(2)
  async updateRequestStatus(requestId: string, status: string, notes?: string): Promise<ApiResponseDto> {
    try {
      const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        throw new ValidationError('Invalid status');
      }
  
      const updateData: any = {
        status,
        updatedAt: new Date()
      };
  
      if (notes) {
        updateData.notes = notes;
      }
  
      // Add status-specific timestamps using strategy pattern
      const statusTimestampHandlers = {
        in_progress: () => { updateData.startedAt = new Date(); },
        completed: () => { updateData.completedAt = new Date(); },
        cancelled: () => { updateData.cancelledAt = new Date(); }
      };
  
      const timestampHandler = statusTimestampHandlers[status as keyof typeof statusTimestampHandlers];
      if (timestampHandler) {
        timestampHandler();
      }
  
      const serviceRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        updateData,
        { new: true }
      ).populate('userId', 'firstName lastName email phone')
       .populate('providerId', 'businessName rating userId');
  
      if (!serviceRequest) {
        throw new NotFoundError('Service request not found');
      }
  
      return {
        success: true,
        message: `Service request status updated to ${status}`,
        data: serviceRequest
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to update service request status');
    }
  }

  /**
   * Get service request statistics with caching
   */
  @Log('Getting service request statistics')
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getServiceRequestStatistics(userId?: string): Promise<ServiceRequestStatisticsDto> {
    try {
      let query: any = {};
      if (userId) {
        query.userId = userId;
      }

      const [
        totalRequests,
        pendingRequests,
        assignedRequests,
        inProgressRequests,
        completedRequests,
        cancelledRequests
      ] = await Promise.all([
        ServiceRequest.countDocuments(query),
        ServiceRequest.countDocuments({ ...query, status: 'pending' }),
        ServiceRequest.countDocuments({ ...query, status: 'assigned' }),
        ServiceRequest.countDocuments({ ...query, status: 'in_progress' }),
        ServiceRequest.countDocuments({ ...query, status: 'completed' }),
        ServiceRequest.countDocuments({ ...query, status: 'cancelled' })
      ]);

      return {
        totalRequests,
        pendingRequests,
        assignedRequests,
        inProgressRequests,
        completedRequests,
        cancelledRequests,
        completionRate: totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to get service request statistics');
    }
  }

  /**
   * Get nearby service requests for provider
   */
  @Log('Getting nearby service requests')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getNearbyServiceRequests(
    location: { latitude: number; longitude: number },
    radius: number = 25,
    category?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponseDto> {
    try {
      const skip = (page - 1) * limit;
      let query: any = {
        status: 'pending',
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude]
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        }
      };

      if (category) {
        query.category = category;
      }

      const [requests, total] = await Promise.all([
        ServiceRequest.find(query)
          .populate('userId', 'firstName lastName email phone profileImage')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        ServiceRequest.countDocuments(query)
      ]);

      return {
        success: true,
        message: 'Nearby service requests retrieved successfully',
        data: requests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to get nearby service requests');
    }
  }
}
