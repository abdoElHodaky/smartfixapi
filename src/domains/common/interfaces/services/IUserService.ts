import {
  UpdateUserDto,
  UserFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

/**
 * User service interface
 */
export interface IUserService {
  /**
   * Get user by ID
   */
  getUserById(userId: string, includePassword?: boolean): Promise<any>;

  /**
   * Update user profile
   */
  updateUserProfile(userId: string, updateData: UpdateUserDto): Promise<ApiResponseDto>;

  /**
   * Delete user account
   */
  deleteUserAccount(userId: string): Promise<ApiResponseDto>;

  /**
   * Search users with filters
   * @deprecated Use searchUsersAdvanced instead
   */
  searchUsers(filters: UserFiltersDto, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;
  
  /**
   * Search users with advanced filtering using AggregationBuilder
   */
  searchUsersAdvanced(filters: UserFiltersDto, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Get user's service requests
   */
  getUserServiceRequests(userId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Get user's reviews
   */
  getUserReviews(userId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Upload user profile image
   */
  uploadProfileImage(userId: string, imageUrl: string): Promise<ApiResponseDto>;

  /**
   * Get user statistics
   */
  getUserStatistics(userId: string): Promise<any>;

  /**
   * Update user location
   */
  updateUserLocation(userId: string, location: { type: 'Point'; coordinates: [number, number] }): Promise<ApiResponseDto>;

  /**
   * Get users by location
   */
  getUsersByLocation(coordinates: [number, number], radius: number): Promise<any[]>;

  /**
   * Update user status (admin function)
   */
  updateUserStatus(userId: string, status: string): Promise<ApiResponseDto>;

  /**
   * Get all users (admin function)
   */
  getAllUsers(filters: UserFiltersDto): Promise<PaginatedResponseDto<any>>;

  /**
   * Delete user (admin function)
   */
  deleteUser(userId: string): Promise<void>;

  /**
   * Get user reviews by delegating to ReviewService
   */
  getUserReviews(userId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;

  /**
   * Get user service requests by delegating to ServiceRequestService
   */
  getUserServiceRequests(userId: string, status?: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;
}
