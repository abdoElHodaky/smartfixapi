import {
  UpdateProviderDto,
  ProviderFiltersDto,
  PortfolioItemDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

/**
 * Provider service interface
 */
export interface IProviderService {
  /**
   * Get provider by ID
   */
  getProviderById(providerId: string): Promise<any>;

  /**
   * Get provider by user ID
   */
  getProviderByUserId(userId: string): Promise<any>;

  /**
   * Get provider profile
   */
  getProviderProfile(providerId: string): Promise<any>;

  /**
   * Update provider profile
   */
  updateProviderProfile(providerId: string, updateData: UpdateProviderDto): Promise<ApiResponseDto>;

  /**
   * Search providers with filters
   */
  searchProviders(filters: ProviderFiltersDto): Promise<PaginatedResponseDto<any>>;

  /**
   * Add portfolio item
   */
  addPortfolioItem(providerId: string, portfolioItem: PortfolioItemDto): Promise<ApiResponseDto>;

  /**
   * Update portfolio item
   */
  updatePortfolioItem(providerId: string, itemId: string, updateData: Partial<PortfolioItemDto>): Promise<ApiResponseDto>;

  /**
   * Delete portfolio item
   */
  deletePortfolioItem(providerId: string, itemId: string): Promise<ApiResponseDto>;

  /**
   * Get provider portfolio
   */
  getProviderPortfolio(providerId: string): Promise<PortfolioItemDto[]>;

  /**
   * Update provider availability
   */
  updateProviderAvailability(providerId: string, availability: any): Promise<ApiResponseDto>;

  /**
   * Get provider statistics
   */
  getProviderStatistics(providerId: string): Promise<any>;

  /**
   * Verify provider
   */
  verifyProvider(providerId: string): Promise<ApiResponseDto>;

  /**
   * Get provider reviews
   */
  getProviderReviews(providerId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Get provider service requests
   */
  getProviderServiceRequests(providerId: string, status?: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Update provider rating
   */
  updateProviderRating(providerId: string): Promise<void>;

  /**
   * Update provider status (admin function)
   */
  updateProviderStatus(providerId: string, status: string): Promise<ApiResponseDto>;

  /**
   * Delete provider (admin function)
   */
  deleteProvider(providerId: string): Promise<ApiResponseDto>;

  /**
   * Get all providers (admin function)
   */
  getAllProviders(filters: ProviderFiltersDto): Promise<PaginatedResponseDto<any>>;

  /**
   * Get provider reviews by delegating to ReviewService
   */
  getProviderReviews(providerId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Get provider service requests by delegating to ServiceRequestService
   */
  getProviderServiceRequests(providerId: string, filters?: any): Promise<PaginatedResponseDto<any>>;

  /**
   * Get available service requests for provider
   */
  getAvailableServiceRequests(providerId: string, filters?: any): Promise<PaginatedResponseDto<any>>;

  /**
   * Get available requests for provider
   */
  getAvailableRequests(providerId: string, filters?: any): Promise<PaginatedResponseDto<any>>;

  /**
   * Submit proposal for service request
   */
  submitProposal(providerId: string, requestId: string, proposalData: any): Promise<ApiResponseDto>;

  /**
   * Get provider dashboard data
   */
  getProviderDashboard(providerId: string): Promise<any>;

  /**
   * Increment completed jobs count
   */
  incrementCompletedJobs(providerId: string): Promise<void>;
}
