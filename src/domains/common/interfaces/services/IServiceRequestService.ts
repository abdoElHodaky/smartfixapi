import {
  CreateRequestDto,
  UpdateRequestDto,
  RequestFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

/**
 * Service request service interface
 */
export interface IServiceRequestService {
  /**
   * Create a new service request
   */
  createServiceRequest(userId: string, requestData: CreateRequestDto): Promise<ApiResponseDto>;

  /**
   * Get service request by ID
   */
  getServiceRequestById(requestId: string): Promise<any>;

  /**
   * Update service request
   */
  updateServiceRequest(requestId: string, updateData: UpdateRequestDto): Promise<ApiResponseDto>;

  /**
   * Delete service request
   */
  deleteServiceRequest(requestId: string): Promise<ApiResponseDto>;

  /**
   * Search service requests with filters
   * @deprecated Use searchServiceRequestsAdvanced instead
   */
  searchServiceRequests(filters: RequestFiltersDto, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;
  
  /**
   * Search service requests with advanced filtering using AggregationBuilder
   */
  searchServiceRequestsAdvanced(filters: RequestFiltersDto, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Find matching providers for a request
   */
  findMatchingProviders(serviceRequestId: string): Promise<any[]>;

  /**
   * Accept service request (provider)
   */
  acceptServiceRequest(requestId: string, providerId: string): Promise<ApiResponseDto>;

  /**
   * Reject service request (provider)
   */
  rejectServiceRequest(requestId: string, providerId: string, reason?: string): Promise<ApiResponseDto>;

  /**
   * Start service (provider)
   */
  startService(requestId: string, providerId: string): Promise<ApiResponseDto>;

  /**
   * Complete service (provider)
   */
  completeService(requestId: string, providerId: string, completionData: any): Promise<ApiResponseDto>;

  /**
   * Approve completion (customer)
   */
  approveCompletion(requestId: string, userId: string): Promise<ApiResponseDto>;

  /**
   * Request revision (customer)
   */
  requestRevision(requestId: string, userId: string, revisionNotes: string): Promise<ApiResponseDto>;

  /**
   * Cancel service request
   */
  cancelServiceRequest(requestId: string, userId: string, reason?: string): Promise<ApiResponseDto>;

  /**
   * Get service request history
   */
  getServiceRequestHistory(requestId: string): Promise<any[]>;

  /**
   * Get service requests by user
   */
  getServiceRequestsByUser(userId: string, status?: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Get service requests by provider
   */
  getServiceRequestsByProvider(providerId: string, status?: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Get all service requests (admin function)
   */
  getAllServiceRequests(filters: RequestFiltersDto): Promise<PaginatedResponseDto<any>>;

  /**
   * Update service request status (admin function)
   */
  updateServiceRequestStatus(requestId: string, status: string): Promise<ApiResponseDto>;

  /**
   * Get service request reviews by delegating to ReviewService
   */
  getServiceRequestReviews(requestId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Get service request statistics by delegating to ReviewService
   */
  getServiceRequestStatistics(requestId: string): Promise<any>;

  /**
   * Get statistics by user
   */
  getStatisticsByUser(userId: string): Promise<ServiceRequestStatisticsDto>;

  /**
   * Get statistics by provider
   */
  getStatisticsByProvider(providerId: string): Promise<ServiceRequestStatisticsDto>;
}
