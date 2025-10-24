/**
 * Strategy-Based ServiceRequestService Implementation
 * 
 * Enhanced ServiceRequestService using Strategy Patterns for service request operations
 * with optimized performance and maintainable conditional logic.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { ServiceRequest } from '../../models/ServiceRequest';
import { ServiceProvider } from '../../models/ServiceProvider';
import { User } from '../../models/User';
import { ValidationError, AuthenticationError, NotFoundError } from '../../middleware/errorHandler';
import { IServiceRequestService, IUserService, IProviderService, IReviewService } from '../../interfaces/services';
import {
  CreateRequestDto,
  UpdateRequestDto,
  RequestFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

// Import optimization utilities
import { 
  AsyncStrategyRegistry
} from '../../utils/conditions/StrategyPatterns';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';

// Import strategy interfaces
import {
  ServiceRequestOperationInput,
  RequestSearchInput,
  ProviderMatchingInput
} from '../../strategy/interfaces/ServiceStrategy';

// Import service decorators
import {
  Singleton,
  Service,
  Cached,
  Retryable,
  Log,
  PostConstruct,
  PreDestroy
} from '../../decorators/service';

@Injectable()
@Singleton()
@Service({
  name: 'ServiceRequestService',
  lazy: false,
  priority: 7
})
export class ServiceRequestServiceStrategy implements IServiceRequestService {
  private requestActionRegistry: AsyncStrategyRegistry<ServiceRequestOperationInput, any>;
  private providerMatchingRegistry: AsyncStrategyRegistry<ProviderMatchingInput, any>;
  private searchRegistry: AsyncStrategyRegistry<RequestSearchInput, any>;

  constructor(
    @Inject('UserService') private userService: IUserService,
    @Inject('ProviderService') private providerService: IProviderService,
    @Inject('ReviewService') private reviewService: IReviewService
  ) {
    this.initializeStrategies();
  }

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('🚀 Strategy-based ServiceRequestService initialized with optimized patterns');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('🚀 Strategy-based ServiceRequestService cleanup completed');
  }

  /**
   * Initialize all strategy registries
   */
  private initializeStrategies(): void {
    // Request action strategies
    this.requestActionRegistry = new AsyncStrategyRegistry<ServiceRequestOperationInput, any>();
    
    // Provider matching strategies
    this.providerMatchingRegistry = new AsyncStrategyRegistry<ProviderMatchingInput, any>();
    
    // Search strategies
    this.searchRegistry = new AsyncStrategyRegistry<RequestSearchInput, any>();
  }

  /**
   * Verify user permissions for service request operations
   */
  private async verifyUserPermissions(userId: string, requestId?: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('User account is inactive');
    }

    // If request is specified, verify user has access
    if (requestId) {
      const request = await ServiceRequest.findById(requestId);
      if (!request) {
        throw new NotFoundError('Service request not found');
      }

      const hasAccess = request.userId.toString() === userId || 
                       request.assignedProvider?.toString() === userId ||
                       user.role === 'admin';
      
      if (!hasAccess) {
        throw new AuthenticationError('Access denied to service request');
      }
    }
  }

  /**
   * Create a new service request
   */
  @Log({
    message: 'Creating new service request',
    includeExecutionTime: true
  })
  async createServiceRequest(userId: string, requestData: CreateRequestDto): Promise<ApiResponseDto> {
    try {
      await this.verifyUserPermissions(userId);

      // Validate service type and location
      if (!requestData.serviceType || !requestData.location) {
        throw new ValidationError('Service type and location are required');
      }

      const serviceRequest = new ServiceRequest({
        userId,
        serviceType: requestData.serviceType,
        title: requestData.title,
        description: requestData.description,
        location: requestData.location,
        urgency: requestData.urgency || 'medium',
        budget: requestData.budget,
        preferredDateTime: requestData.preferredDateTime,
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
    } catch (error: any) {
      throw new ValidationError(`Failed to create service request: ${error.message}`);
    }
  }

  /**
   * Get service request by ID
   */
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getServiceRequestById(requestId: string): Promise<any> {
    const request = await ServiceRequest.findById(requestId)
      .populate('userId', 'firstName lastName email phone profilePicture')
      .populate('assignedProvider', 'businessName contactInfo rating')
      .lean();

    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    return request;
  }

  /**
   * Update service request
   */
  @Log({
    message: 'Updating service request',
    includeExecutionTime: true
  })
  async updateServiceRequest(requestId: string, updateData: UpdateRequestDto): Promise<ApiResponseDto> {
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    // Only allow updates if request is in pending or revision status
    if (!['pending', 'revision_requested'].includes(request.status)) {
      throw new ValidationError('Cannot update service request in current status');
    }

    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      requestId,
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    );

    return {
      success: true,
      message: 'Service request updated successfully',
      data: updatedRequest
    };
  }

  /**
   * Delete service request
   */
  @Log({
    message: 'Deleting service request',
    includeExecutionTime: true
  })
  async deleteServiceRequest(requestId: string): Promise<ApiResponseDto> {
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    // Only allow deletion if request is in pending status
    if (request.status !== 'pending') {
      throw new ValidationError('Cannot delete service request that is already in progress');
    }

    await ServiceRequest.findByIdAndDelete(requestId);

    return {
      success: true,
      message: 'Service request deleted successfully',
      data: null
    };
  }

  /**
   * Search service requests with filters
   */
  async searchServiceRequests(filters: RequestFiltersDto): Promise<PaginatedResponseDto<any>> {
    const query: any = {};

    if (filters.serviceType) {
      query.serviceType = filters.serviceType;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.urgency) {
      query.urgency = filters.urgency;
    }

    if (filters.location) {
      query['location.city'] = { $regex: filters.location, $options: 'i' };
    }

    if (filters.minBudget || filters.maxBudget) {
      query.budget = {};
      if (filters.minBudget) query.budget.$gte = filters.minBudget;
      if (filters.maxBudget) query.budget.$lte = filters.maxBudget;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }

    if (filters.searchTerm) {
      query.$or = [
        { title: { $regex: filters.searchTerm, $options: 'i' } },
        { description: { $regex: filters.searchTerm, $options: 'i' } }
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const [requests, totalCount] = await Promise.all([
      ServiceRequest.find(query)
        .populate('userId', 'firstName lastName email')
        .populate('assignedProvider', 'businessName rating')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ServiceRequest.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: requests,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Find matching providers for a request
   */
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async findMatchingProviders(serviceRequestId: string): Promise<any[]> {
    const request = await ServiceRequest.findById(serviceRequestId);
    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    // Find providers that match the service type and are in the same area
    const matchingProviders = await ServiceProvider.find({
      serviceTypes: request.serviceType,
      isVerified: true,
      isActive: true,
      'serviceArea.city': request.location.city
    })
    .populate('userId', 'firstName lastName profilePicture')
    .sort({ rating: -1, completedJobs: -1 })
    .limit(10)
    .lean();

    return matchingProviders;
  }

  /**
   * Accept service request (provider)
   */
  @Log({
    message: 'Provider accepting service request',
    includeExecutionTime: true
  })
  async acceptServiceRequest(requestId: string, providerId: string): Promise<ApiResponseDto> {
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    if (request.status !== 'pending') {
      throw new ValidationError('Service request is not available for acceptance');
    }

    // Verify provider exists and is verified
    const provider = await ServiceProvider.findById(providerId);
    if (!provider || !provider.isVerified || !provider.isActive) {
      throw new ValidationError('Provider not found or not verified');
    }

    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      requestId,
      {
        assignedProvider: providerId,
        status: 'accepted',
        acceptedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    return {
      success: true,
      message: 'Service request accepted successfully',
      data: updatedRequest
    };
  }

  /**
   * Reject service request (provider)
   */
  async rejectServiceRequest(requestId: string, providerId: string, reason?: string): Promise<ApiResponseDto> {
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    // Add rejection to request history
    if (!request.rejectedBy) {
      request.rejectedBy = [];
    }

    request.rejectedBy.push({
      providerId,
      reason,
      rejectedAt: new Date()
    });

    await request.save();

    return {
      success: true,
      message: 'Service request rejected',
      data: null
    };
  }

  /**
   * Start service (provider)
   */
  async startService(requestId: string, providerId: string): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(providerId, requestId);

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    if (request.status !== 'accepted' || request.assignedProvider?.toString() !== providerId) {
      throw new ValidationError('Cannot start service for this request');
    }

    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'in_progress',
        startedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    return {
      success: true,
      message: 'Service started successfully',
      data: updatedRequest
    };
  }

  /**
   * Complete service (provider)
   */
  async completeService(requestId: string, providerId: string, completionData: any): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(providerId, requestId);

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    if (request.status !== 'in_progress' || request.assignedProvider?.toString() !== providerId) {
      throw new ValidationError('Cannot complete service for this request');
    }

    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'completed',
        completedAt: new Date(),
        completionNotes: completionData.notes,
        completionImages: completionData.images,
        updatedAt: new Date()
      },
      { new: true }
    );

    return {
      success: true,
      message: 'Service completed successfully',
      data: updatedRequest
    };
  }

  /**
   * Approve completion (customer)
   */
  async approveCompletion(requestId: string, userId: string): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(userId, requestId);

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    if (request.status !== 'completed' || request.userId.toString() !== userId) {
      throw new ValidationError('Cannot approve completion for this request');
    }

    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    // Update provider's completed jobs count
    if (request.assignedProvider) {
      await ServiceProvider.findByIdAndUpdate(
        request.assignedProvider,
        { $inc: { completedJobs: 1 } }
      );
    }

    return {
      success: true,
      message: 'Service completion approved successfully',
      data: updatedRequest
    };
  }

  /**
   * Request revision (customer)
   */
  async requestRevision(requestId: string, userId: string, revisionNotes: string): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(userId, requestId);

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    if (request.status !== 'completed' || request.userId.toString() !== userId) {
      throw new ValidationError('Cannot request revision for this request');
    }

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

    return {
      success: true,
      message: 'Revision requested successfully',
      data: updatedRequest
    };
  }

  /**
   * Cancel service request
   */
  async cancelServiceRequest(requestId: string, userId: string, reason?: string): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(userId, requestId);

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    // Only allow cancellation in certain statuses
    const cancellableStatuses = ['pending', 'accepted', 'revision_requested'];
    if (!cancellableStatuses.includes(request.status)) {
      throw new ValidationError('Cannot cancel service request in current status');
    }

    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date(),
        cancelledBy: userId,
        updatedAt: new Date()
      },
      { new: true }
    );

    return {
      success: true,
      message: 'Service request cancelled successfully',
      data: updatedRequest
    };
  }

  /**
   * Get service request history
   */
  async getServiceRequestHistory(requestId: string): Promise<any[]> {
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    // Build history from request status changes
    const history = [];

    if (request.createdAt) {
      history.push({
        action: 'created',
        timestamp: request.createdAt,
        status: 'pending'
      });
    }

    if (request.acceptedAt) {
      history.push({
        action: 'accepted',
        timestamp: request.acceptedAt,
        status: 'accepted',
        providerId: request.assignedProvider
      });
    }

    if (request.startedAt) {
      history.push({
        action: 'started',
        timestamp: request.startedAt,
        status: 'in_progress'
      });
    }

    if (request.completedAt) {
      history.push({
        action: 'completed',
        timestamp: request.completedAt,
        status: 'completed'
      });
    }

    if (request.approvedAt) {
      history.push({
        action: 'approved',
        timestamp: request.approvedAt,
        status: 'approved'
      });
    }

    if (request.cancelledAt) {
      history.push({
        action: 'cancelled',
        timestamp: request.cancelledAt,
        status: 'cancelled',
        reason: request.cancellationReason
      });
    }

    return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Get service requests by user
   */
  async getServiceRequestsByUser(
    userId: string, 
    status?: string, 
    page = 1, 
    limit = 10
  ): Promise<PaginatedResponseDto<any>> {
    await this.verifyUserPermissions(userId);

    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const [requests, totalCount] = await Promise.all([
      ServiceRequest.find(query)
        .populate('assignedProvider', 'businessName rating')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ServiceRequest.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: requests,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Get service requests by provider
   */
  async getServiceRequestsByProvider(
    providerId: string, 
    status?: string, 
    page = 1, 
    limit = 10
  ): Promise<PaginatedResponseDto<any>> {
    const query: any = { assignedProvider: providerId };
    if (status) {
      query.status = status;
    }

    const [requests, totalCount] = await Promise.all([
      ServiceRequest.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ServiceRequest.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: requests,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Get all service requests (admin function)
   */
  async getAllServiceRequests(filters: RequestFiltersDto): Promise<PaginatedResponseDto<any>> {
    return this.searchServiceRequests(filters);
  }

  /**
   * Update service request status (admin function)
   */
  async updateServiceRequestStatus(requestId: string, status: string): Promise<ApiResponseDto> {
    const request = await ServiceRequest.findByIdAndUpdate(
      requestId,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    return {
      success: true,
      message: 'Service request status updated successfully',
      data: request
    };
  }

  /**
   * Get service request reviews by delegating to ReviewService
   */
  async getServiceRequestReviews(
    requestId: string, 
    page = 1, 
    limit = 10
  ): Promise<PaginatedResponseDto<any>> {
    return this.reviewService.getReviewsByServiceRequest(requestId, page, limit);
  }

  /**
   * Get service request statistics by delegating to ReviewService
   */
  async getServiceRequestStatistics(requestId: string): Promise<any> {
    const reviews = await this.reviewService.getReviewsByServiceRequest(requestId);
    
    if (!reviews.data || reviews.data.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const ratings = reviews.data.map((review: any) => review.rating);
    const averageRating = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length;
    
    const ratingDistribution = ratings.reduce((dist: any, rating: number) => {
      dist[rating] = (dist[rating] || 0) + 1;
      return dist;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews: ratings.length,
      ratingDistribution
    };
  }

  /**
   * Get statistics by user - Optimized aggregation
   */
  async getStatisticsByUser(userId: string): Promise<any> {
    await this.verifyUserPermissions(userId);

    // Single optimized aggregation pipeline instead of multiple queries
    const stats = await ServiceRequest.aggregate([
      { $match: { userId: userId } },
      {
        $facet: {
          statusBreakdown: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                completedRequests: {
                  $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
                },
                averageBudget: { $avg: '$budget' },
                totalBudget: { $sum: '$budget' }
              }
            }
          ],
          recentActivity: [
            { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $project: { title: 1, status: 1, createdAt: 1, serviceType: 1 } }
          ]
        }
      }
    ]);

    const result = stats[0];
    const totals = result.totals[0] || { totalRequests: 0, completedRequests: 0, averageBudget: 0, totalBudget: 0 };
    const statusBreakdown = result.statusBreakdown.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    return {
      totalRequests: totals.totalRequests,
      completedRequests: totals.completedRequests,
      statusBreakdown,
      completionRate: totals.totalRequests > 0 ? (totals.completedRequests / totals.totalRequests) * 100 : 0,
      averageBudget: Math.round(totals.averageBudget || 0),
      totalBudget: totals.totalBudget || 0,
      recentActivity: result.recentActivity
    };
  }

  /**
   * Get statistics by provider - Optimized aggregation
   */
  async getStatisticsByProvider(providerId: string): Promise<any> {
    // Single optimized aggregation pipeline with performance metrics
    const stats = await ServiceRequest.aggregate([
      { $match: { assignedProvider: providerId } },
      {
        $facet: {
          statusBreakdown: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                completedRequests: {
                  $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
                },
                averageBudget: { $avg: '$budget' },
                totalRevenue: { 
                  $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$budget', 0] }
                }
              }
            }
          ],
          performanceMetrics: [
            {
              $match: { 
                startedAt: { $exists: true },
                completedAt: { $exists: true }
              }
            },
            {
              $project: {
                completionTime: {
                  $divide: [
                    { $subtract: ['$completedAt', '$startedAt'] },
                    1000 * 60 * 60 // Convert to hours
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                averageCompletionTime: { $avg: '$completionTime' },
                fastestCompletion: { $min: '$completionTime' },
                slowestCompletion: { $max: '$completionTime' }
              }
            }
          ],
          recentJobs: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $project: { 
              title: 1, 
              status: 1, 
              createdAt: 1, 
              serviceType: 1,
              budget: 1,
              completedAt: 1
            }}
          ]
        }
      }
    ]);

    const result = stats[0];
    const totals = result.totals[0] || { 
      totalRequests: 0, 
      completedRequests: 0, 
      averageBudget: 0, 
      totalRevenue: 0 
    };
    const performance = result.performanceMetrics[0] || {
      averageCompletionTime: 0,
      fastestCompletion: 0,
      slowestCompletion: 0
    };
    const statusBreakdown = result.statusBreakdown.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    return {
      totalRequests: totals.totalRequests,
      completedRequests: totals.completedRequests,
      statusBreakdown,
      completionRate: totals.totalRequests > 0 ? (totals.completedRequests / totals.totalRequests) * 100 : 0,
      averageBudget: Math.round(totals.averageBudget || 0),
      totalRevenue: totals.totalRevenue || 0,
      averageCompletionTime: Math.round((performance.averageCompletionTime || 0) * 100) / 100,
      fastestCompletion: Math.round((performance.fastestCompletion || 0) * 100) / 100,
      slowestCompletion: Math.round((performance.slowestCompletion || 0) * 100) / 100,
      recentJobs: result.recentJobs
    };
  }
}
