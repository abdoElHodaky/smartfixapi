import {
  AdminFiltersDto,
  AdminStatsDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

export interface IAdminService {
  // User Management
  getAllUsers(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>>;
  getUserById(userId: string): Promise<any>;
  updateUserStatus(userId: string, status: string): Promise<ApiResponseDto>;
  deleteUser(userId: string): Promise<ApiResponseDto>;
  
  // Provider Management
  getAllProviders(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>>;
  getProviderById(providerId: string): Promise<any>;
  verifyProvider(providerId: string): Promise<ApiResponseDto>;
  updateProviderStatus(providerId: string, status: string): Promise<ApiResponseDto>;
  deleteProvider(providerId: string): Promise<ApiResponseDto>;
  
  // Service Request Management
  getAllServiceRequests(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>>;
  getServiceRequestById(requestId: string): Promise<any>;
  updateServiceRequestStatus(requestId: string, status: string): Promise<ApiResponseDto>;
  
  // Review Management
  getAllReviews(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>>;
  getReviewById(reviewId: string): Promise<any>;
  moderateReview(reviewId: string, action: 'approve' | 'reject', reason?: string): Promise<ApiResponseDto>;
  
  // Analytics and Statistics
  getDashboardStats(): Promise<AdminStatsDto>;
  getUserAnalytics(period: string): Promise<any>;
  getProviderAnalytics(period: string): Promise<any>;
  getRevenueAnalytics(period: string): Promise<any>;
  
  // System Management
  getSystemHealth(): Promise<any>;
  getAuditLogs(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>>;
  createAuditLog(action: string, details: any, adminId: string): Promise<void>;
  
  // Content Management
  getFlaggedContent(type: string): Promise<PaginatedResponseDto<any>>;
  moderateContent(contentId: string, type: string, action: string): Promise<ApiResponseDto>;
}

