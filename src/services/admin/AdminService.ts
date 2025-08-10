import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { IAdminService, IUserService, IProviderService, IServiceRequestService, IReviewService } from '../../interfaces/services';
import {
  AdminFiltersDto,
  AdminStatsDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

export class AdminService implements IAdminService {
  constructor(
    private userService: IUserService,
    private providerService: IProviderService,
    private serviceRequestService: IServiceRequestService,
    private reviewService: IReviewService
  ) {}

  /**
   * Get all users with admin filters
   */
  async getAllUsers(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>> {
    // Convert admin filters to user filters format
    const userFilters = {
      page: filters.page,
      limit: filters.limit,
      role: filters.role,
      status: filters.status,
      isEmailVerified: filters.isEmailVerified,
      search: filters.search,
      registrationDateFrom: filters.registrationDateFrom,
      registrationDateTo: filters.registrationDateTo,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    };

    // Delegate to UserService
    return await this.userService.searchUsers(userFilters);
  }

  /**
   * Get user by ID (admin view)
   */
  async getUserById(userId: string): Promise<any> {
    // Delegate to UserService to get user details
    const user = await this.userService.getUserById(userId, false);
    
    // Get additional statistics from UserService
    const statistics = await this.userService.getUserStatistics(userId);

    return {
      ...user,
      statistics
    };
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: string): Promise<ApiResponseDto> {
    // Delegate to UserService
    const result = await this.userService.updateUserStatus(userId, status);
    
    // Create audit log for admin action
    await this.createAuditLog('user_status_updated', { userId, status }, 'admin');
    
    return result;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<ApiResponseDto> {
    // Get user details before deletion for audit log
    const user = await this.userService.getUserById(userId, false);
    
    // Delegate to UserService
    const result = await this.userService.deleteUserAccount(userId);
    
    // Create audit log for admin action
    await this.createAuditLog('user_deleted', { userId, email: user.email }, 'admin');
    
    return result;
  }

  /**
   * Get all providers with admin filters
   */
  async getAllProviders(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>> {
    // Convert admin filters to provider filters format
    const providerFilters = {
      page: filters.page,
      limit: filters.limit,
      isVerified: filters.isVerified,
      status: filters.status,
      category: filters.category,
      rating: filters.rating,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    };

    // Delegate to ProviderService
    return await this.providerService.getAllProviders(providerFilters);
  }

  /**
   * Get provider by ID (admin view)
   */
  async getProviderById(providerId: string): Promise<any> {
    // Delegate to ProviderService to get provider details
    const provider = await this.providerService.getProviderById(providerId);
    
    // Get additional statistics from ProviderService
    const statistics = await this.providerService.getProviderStatistics(providerId);

    return {
      ...provider,
      statistics
    };
  }

  /**
   * Verify provider
   */
  async verifyProvider(providerId: string): Promise<ApiResponseDto> {
    // Delegate to ProviderService
    const result = await this.providerService.verifyProvider(providerId);
    
    // Create audit log for admin action
    await this.createAuditLog('provider_verified', { providerId }, 'admin');
    
    return result;
  }

  /**
   * Update provider status
   */
  async updateProviderStatus(providerId: string, status: string): Promise<ApiResponseDto> {
    // Delegate to ProviderService
    const result = await this.providerService.updateProviderStatus(providerId, status);
    
    // Create audit log for admin action
    await this.createAuditLog('provider_status_updated', { providerId, status }, 'admin');
    
    return result;
  }

  /**
   * Delete provider
   */
  async deleteProvider(providerId: string): Promise<ApiResponseDto> {
    // Get provider details before deletion for audit log
    const provider = await this.providerService.getProviderById(providerId);
    
    // Delegate to ProviderService
    const result = await this.providerService.deleteProvider(providerId);
    
    // Create audit log for admin action
    await this.createAuditLog('provider_deleted', { providerId, businessName: provider.businessName }, 'admin');
    
    return result;
  }

  /**
   * Get all service requests with admin filters
   */
  async getAllServiceRequests(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>> {
    // Convert admin filters to request filters format
    const requestFilters = {
      page: filters.page,
      limit: filters.limit,
      status: filters.requestStatus,
      urgency: filters.urgency,
      budget: filters.budget,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    };

    // Delegate to ServiceRequestService
    return await this.serviceRequestService.getAllServiceRequests(requestFilters);
  }

  /**
   * Get service request by ID (admin view)
   */
  async getServiceRequestById(requestId: string): Promise<any> {
    // Delegate to ServiceRequestService
    return await this.serviceRequestService.getServiceRequestById(requestId);
  }

  /**
   * Update service request status
   */
  async updateServiceRequestStatus(requestId: string, status: string): Promise<ApiResponseDto> {
    // Delegate to ServiceRequestService
    const result = await this.serviceRequestService.updateServiceRequestStatus(requestId, status);
    
    // Create audit log for admin action
    await this.createAuditLog('service_request_status_updated', { requestId, status }, 'admin');
    
    return result;
  }

  /**
   * Get all reviews with admin filters
   */
  async getAllReviews(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>> {
    // Convert admin filters to review filters format
    const reviewFilters = {
      page: filters.page,
      limit: filters.limit,
      rating: filters.reviewRating,
      isFlagged: filters.isFlagged,
      isModerated: filters.isModerated,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    };

    // Delegate to ReviewService
    return await this.reviewService.getAllReviews(reviewFilters);
  }

  /**
   * Get review by ID (admin view)
   */
  async getReviewById(reviewId: string): Promise<any> {
    // Delegate to ReviewService
    return await this.reviewService.getReviewById(reviewId);
  }

  /**
   * Moderate review
   */
  async moderateReview(reviewId: string, action: 'approve' | 'reject', reason?: string): Promise<ApiResponseDto> {
    // Delegate to ReviewService
    const result = await this.reviewService.moderateReview(reviewId, action, reason);
    
    // Create audit log for admin action
    await this.createAuditLog('review_moderated', { reviewId, action, reason }, 'admin');
    
    return result;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<AdminStatsDto> {
    const [
      userStats,
      providerStats,
      serviceRequestStats,
      reviewStats
    ] = await Promise.all([
      this.getUserStats(),
      this.getProviderStats(),
      this.getServiceRequestStats(),
      this.getReviewStats()
    ]);

    return {
      users: userStats,
      providers: providerStats,
      serviceRequests: serviceRequestStats,
      reviews: reviewStats,
      revenue: await this.getRevenueStats(),
      system: await this.getSystemStats(),
      activity: await this.getActivityStats()
    };
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(period: string): Promise<any> {
    const dateRange = this.getDateRange(period);
    
    const analytics = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return analytics;
  }

  /**
   * Get provider analytics
   */
  async getProviderAnalytics(period: string): Promise<any> {
    const dateRange = this.getDateRange(period);
    
    const analytics = await ServiceProvider.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          verified: { $sum: { $cond: ['$isVerified', 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return analytics;
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(period: string): Promise<any> {
    const dateRange = this.getDateRange(period);
    
    // This would typically come from a payments/transactions collection
    // For now, we'll return mock data
    return {
      totalRevenue: 0,
      periodRevenue: 0,
      averageOrderValue: 0,
      transactionCount: 0
    };
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<any> {
    const startTime = Date.now();
    
    // Test database connection
    try {
      await User.findOne().limit(1);
      const dbResponseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        database: {
          status: 'connected',
          responseTime: dbResponseTime
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: {
          status: 'disconnected',
          error: error.message
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
      };
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>> {
    // This would typically come from an audit logs collection
    // For now, we'll return empty data
    return {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        hasNext: false,
        hasPrev: false
      }
    };
  }

  /**
   * Create audit log
   */
  async createAuditLog(action: string, details: any, adminId: string): Promise<void> {
    // This would typically save to an audit logs collection
    console.log('Audit Log:', { action, details, adminId, timestamp: new Date() });
  }

  /**
   * Get flagged content
   */
  async getFlaggedContent(type: string): Promise<PaginatedResponseDto<any>> {
    let query: any;
    
    switch (type) {
      case 'reviews':
        query = Review.find({ isFlagged: true });
        break;
      case 'users':
        query = User.find({ isFlagged: true });
        break;
      default:
        throw new ValidationError('Invalid content type');
    }

    const content = await query.limit(10);
    
    return {
      data: content,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: content.length,
        hasNext: false,
        hasPrev: false
      }
    };
  }

  /**
   * Moderate content
   */
  async moderateContent(contentId: string, type: string, action: string): Promise<ApiResponseDto> {
    let model: any;
    
    switch (type) {
      case 'review':
        model = Review;
        break;
      case 'user':
        model = User;
        break;
      default:
        throw new ValidationError('Invalid content type');
    }

    const content = await model.findByIdAndUpdate(
      contentId,
      { 
        isModerated: true,
        moderatedAt: new Date(),
        moderationAction: action
      },
      { new: true }
    );

    if (!content) {
      throw new NotFoundError('Content not found');
    }

    await this.createAuditLog('content_moderated', { contentId, type, action }, 'admin');

    return {
      success: true,
      message: 'Content moderated successfully',
      data: content
    };
  }

  // Private helper methods
  private async getUserStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [total, active, newThisMonth] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' }, status: 'active' }),
      User.countDocuments({ 
        role: { $ne: 'admin' }, 
        createdAt: { $gte: startOfMonth } 
      })
    ]);

    return {
      total,
      active,
      inactive: total - active,
      newThisMonth,
      growthRate: 0 // Calculate based on previous month
    };
  }

  private async getProviderStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [total, verified, newThisMonth, avgRating] = await Promise.all([
      ServiceProvider.countDocuments(),
      ServiceProvider.countDocuments({ isVerified: true }),
      ServiceProvider.countDocuments({ createdAt: { $gte: startOfMonth } }),
      ServiceProvider.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    return {
      total,
      verified,
      pending: total - verified,
      active: total, // Assuming all are active for now
      newThisMonth,
      averageRating: avgRating[0]?.avgRating || 0
    };
  }

  private async getServiceRequestStats() {
    const [total, pending, inProgress, completed, cancelled] = await Promise.all([
      ServiceRequest.countDocuments(),
      ServiceRequest.countDocuments({ status: 'pending' }),
      ServiceRequest.countDocuments({ status: 'in_progress' }),
      ServiceRequest.countDocuments({ status: 'completed' }),
      ServiceRequest.countDocuments({ status: 'cancelled' })
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      cancelled,
      thisMonth: 0, // Calculate based on date range
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }

  private async getReviewStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [total, thisMonth, avgRating, flagged] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]),
      Review.countDocuments({ isFlagged: true })
    ]);

    return {
      total,
      thisMonth,
      averageRating: avgRating[0]?.avgRating || 0,
      flagged,
      pending: flagged // Assuming flagged reviews are pending moderation
    };
  }

  private async getRevenueStats() {
    return {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      growthRate: 0,
      averageOrderValue: 0
    };
  }

  private async getSystemStats() {
    return {
      uptime: process.uptime(),
      activeConnections: 0,
      apiCalls: 0,
      errorRate: 0,
      responseTime: 0
    };
  }

  private async getActivityStats() {
    return {
      dailyActiveUsers: 0,
      monthlyActiveUsers: 0,
      newRegistrations: 0,
      completedServices: 0
    };
  }

  private getDateRange(period: string) {
    const now = new Date();
    let start: Date;

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end: now };
  }
}
