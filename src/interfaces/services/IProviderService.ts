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
}
