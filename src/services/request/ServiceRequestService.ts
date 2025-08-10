import { ServiceRequest } from '../../models/ServiceRequest';
import { ServiceProvider } from '../../models/ServiceProvider';
import { User } from '../../models/User';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { IServiceRequestService, IProviderService, IUserService } from '../../interfaces/services';
import {
  CreateRequestDto,
  UpdateRequestDto,
  RequestFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

export class ServiceRequestService implements IServiceRequestService {
  constructor(
    private providerService: IProviderService,
    private userService: IUserService
  ) {}

  /**
   * Create a new service request
   */
  async createServiceRequest(userId: string, requestData: CreateRequestDto): Promise<ApiResponseDto> {
    // Verify user exists
    await this.userService.getUserById(userId);

    const serviceRequest = new ServiceRequest({
      ...requestData,
      userId,
      status: 'pending'
    });

    await serviceRequest.save();

    return {
      success: true,
      message: 'Service request created successfully',
      data: serviceRequest
    };
  }

  /**
   * Get service request by ID
   */
  async getServiceRequestById(requestId: string): Promise<any> {
    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate('userId', 'firstName lastName email phone profileImage')
      .populate('providerId', 'businessName rating userId');
    
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }
    
    return serviceRequest;
  }

  /**
   * Update service request
   */
  async updateServiceRequest(requestId: string, updateData: UpdateRequestDto): Promise<ApiResponseDto> {
    const serviceRequest = await ServiceRequest.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email phone')
     .populate('providerId', 'businessName rating');

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    return {
      success: true,
      message: 'Service request updated successfully',
      data: serviceRequest
    };
  }

  /**
   * Delete service request
   */
  async deleteServiceRequest(requestId: string): Promise<ApiResponseDto> {
    const serviceRequest = await ServiceRequest.findByIdAndDelete(requestId);

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    return {
      success: true,
      message: 'Service request deleted successfully'
    };
  }

  /**
   * Search service requests with filters
   */
  async searchServiceRequests(filters: RequestFiltersDto): Promise<PaginatedResponseDto<any>> {
    const { 
      category, 
      status, 
      location, 
      radius = 10000,
      minBudget, 
      maxBudget, 
      urgency,
      page = 1, 
      limit = 10 
    } = filters;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (location) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location
          },
          $maxDistance: radius
        }
      };
    }

    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = minBudget;
      if (maxBudget) filter.budget.$lte = maxBudget;
    }

    if (urgency) {
      filter.urgency = urgency;
    }

    const serviceRequests = await ServiceRequest.find(filter)
      .populate('userId', 'firstName lastName profileImage')
      .populate('providerId', 'businessName rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ServiceRequest.countDocuments(filter);

    return {
      data: serviceRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Find matching providers for a request
   */
  async findMatchingProviders(serviceRequestId: string): Promise<any[]> {
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    const providers = await ServiceProvider.find({
      services: { $in: [serviceRequest.category] },
      isAvailable: true,
      isVerified: true,
      serviceArea: {
        $near: {
          $geometry: serviceRequest.location,
          $maxDistance: 50000 // 50km radius
        }
      }
    }).populate('userId', 'firstName lastName profileImage')
      .sort({ rating: -1, completedJobs: -1 })
      .limit(10);

    return providers;
  }

  /**
   * Accept service request (provider)
   */
  async acceptServiceRequest(requestId: string, providerId: string): Promise<ApiResponseDto> {
    // Verify provider exists
    await this.providerService.getProviderById(providerId);

    const serviceRequest = await ServiceRequest.findOneAndUpdate(
      { _id: requestId, status: 'pending' },
      { 
        status: 'accepted', 
        providerId,
        acceptedAt: new Date()
      },
      { new: true }
    );

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found or already accepted');
    }

    return {
      success: true,
      message: 'Service request accepted successfully',
      data: serviceRequest
    };
  }

  /**
   * Reject service request (provider)
   */
  async rejectServiceRequest(requestId: string, providerId: string, reason?: string): Promise<ApiResponseDto> {
    const serviceRequest = await ServiceRequest.findById(requestId);
    
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Add rejection to history
    serviceRequest.rejections = serviceRequest.rejections || [];
    serviceRequest.rejections.push({
      providerId,
      reason,
      rejectedAt: new Date()
    });

    await serviceRequest.save();

    return {
      success: true,
      message: 'Service request rejected'
    };
  }

  /**
   * Start service (provider)
   */
  async startService(requestId: string, providerId: string): Promise<ApiResponseDto> {
    const serviceRequest = await ServiceRequest.findOneAndUpdate(
      { _id: requestId, providerId, status: 'accepted' },
      { 
        status: 'in_progress',
        startedAt: new Date()
      },
      { new: true }
    );

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found or cannot be started');
    }

    return {
      success: true,
      message: 'Service started successfully',
      data: serviceRequest
    };
  }

  /**
   * Complete service (provider)
   */
  async completeService(requestId: string, providerId: string, completionData: any): Promise<ApiResponseDto> {
    const serviceRequest = await ServiceRequest.findOneAndUpdate(
      { _id: requestId, providerId, status: 'in_progress' },
      { 
        status: 'completed',
        completedAt: new Date(),
        completionNotes: completionData.notes,
        completionImages: completionData.images
      },
      { new: true }
    );

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found or cannot be completed');
    }

    // Update provider's completed jobs count
    await ServiceProvider.findByIdAndUpdate(providerId, {
      $inc: { completedJobs: 1 }
    });

    return {
      success: true,
      message: 'Service completed successfully',
      data: serviceRequest
    };
  }

  /**
   * Approve completion (customer)
   */
  async approveCompletion(requestId: string, userId: string): Promise<ApiResponseDto> {
    const serviceRequest = await ServiceRequest.findOneAndUpdate(
      { _id: requestId, userId, status: 'completed' },
      { 
        status: 'approved',
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found or cannot be approved');
    }

    return {
      success: true,
      message: 'Service completion approved',
      data: serviceRequest
    };
  }

  /**
   * Request revision (customer)
   */
  async requestRevision(requestId: string, userId: string, revisionNotes: string): Promise<ApiResponseDto> {
    const serviceRequest = await ServiceRequest.findOneAndUpdate(
      { _id: requestId, userId, status: 'completed' },
      { 
        status: 'revision_requested',
        revisionNotes,
        revisionRequestedAt: new Date()
      },
      { new: true }
    );

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found or cannot request revision');
    }

    return {
      success: true,
      message: 'Revision requested successfully',
      data: serviceRequest
    };
  }

  /**
   * Cancel service request
   */
  async cancelServiceRequest(requestId: string, userId: string, reason?: string): Promise<ApiResponseDto> {
    const serviceRequest = await ServiceRequest.findOneAndUpdate(
      { _id: requestId, userId, status: { $in: ['pending', 'accepted'] } },
      { 
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date()
      },
      { new: true }
    );

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found or cannot be cancelled');
    }

    return {
      success: true,
      message: 'Service request cancelled successfully',
      data: serviceRequest
    };
  }

  /**
   * Get service request history
   */
  async getServiceRequestHistory(requestId: string): Promise<any[]> {
    const serviceRequest = await ServiceRequest.findById(requestId);
    
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Build history from service request data
    const history = [];
    
    history.push({
      action: 'created',
      timestamp: serviceRequest.createdAt,
      details: 'Service request created'
    });

    if (serviceRequest.acceptedAt) {
      history.push({
        action: 'accepted',
        timestamp: serviceRequest.acceptedAt,
        details: 'Service request accepted by provider'
      });
    }

    if (serviceRequest.startedAt) {
      history.push({
        action: 'started',
        timestamp: serviceRequest.startedAt,
        details: 'Service started'
      });
    }

    if (serviceRequest.completedAt) {
      history.push({
        action: 'completed',
        timestamp: serviceRequest.completedAt,
        details: 'Service completed'
      });
    }

    if (serviceRequest.approvedAt) {
      history.push({
        action: 'approved',
        timestamp: serviceRequest.approvedAt,
        details: 'Service completion approved'
      });
    }

    if (serviceRequest.cancelledAt) {
      history.push({
        action: 'cancelled',
        timestamp: serviceRequest.cancelledAt,
        details: `Service cancelled: ${serviceRequest.cancellationReason || 'No reason provided'}`
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
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;
    const filter: any = { userId };
    
    if (status) {
      filter.status = status;
    }

    const serviceRequests = await ServiceRequest.find(filter)
      .populate('providerId', 'businessName rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ServiceRequest.countDocuments(filter);

    return {
      data: serviceRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get service requests by provider
   */
  async getServiceRequestsByProvider(
    providerId: string, 
    status?: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;
    const filter: any = { providerId };
    
    if (status) {
      filter.status = status;
    }

    const serviceRequests = await ServiceRequest.find(filter)
      .populate('userId', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ServiceRequest.countDocuments(filter);

    return {
      data: serviceRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
}

