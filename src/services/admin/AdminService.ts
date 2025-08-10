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
    const { 
      page = 1, 
      limit = 10, 
      role, 
      status, 
      isEmailVerified, 
      search,
      registrationDateFrom,
      registrationDateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.status = status;
    }

    if (typeof isEmailVerified === 'boolean') {
      filter.isEmailVerified = isEmailVerified;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (registrationDateFrom || registrationDateTo) {
      filter.createdAt = {};
      if (registrationDateFrom) filter.createdAt.$gte = registrationDateFrom;
      if (registrationDateTo) filter.createdAt.$lte = registrationDateTo;
    }

    const sortOption: any = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const users = await User.find(filter)
      .select('-password')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return {
      data: users,
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
   * Get user by ID (admin view)
   */
  async getUserById(userId: string): Promise<any> {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get additional user statistics
    const [serviceRequestsCount, reviewsCount] = await Promise.all([
      ServiceRequest.countDocuments({ userId }),
      Review.countDocuments({ userId })
    ]);

    return {
      ...user.toObject(),
      statistics: {
        serviceRequestsCount,
        reviewsCount
      }
    };
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: string): Promise<ApiResponseDto> {
    const validStatuses = ['active', 'inactive', 'suspended', 'banned'];
    
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.createAuditLog('user_status_updated', { userId, status, previousStatus: user.status }, 'admin');

    return {
      success: true,
      message: `User status updated to ${status}`,
      data: user
    };
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<ApiResponseDto> {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Clean up related data
    await Promise.all([
      ServiceRequest.deleteMany({ userId }),
      Review.deleteMany({ userId }),
      ServiceProvider.deleteOne({ userId })
    ]);

    await this.createAuditLog('user_deleted', { userId, email: user.email }, 'admin');

    return {
      success: true,
      message: 'User deleted successfully'
    };
  }

  /**
   * Get all providers with admin filters
   */
  async getAllProviders(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>> {
    const { 
      page = 1, 
      limit = 10, 
      isVerified, 
      status,
      category,
      rating,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (typeof isVerified === 'boolean') {
      filter.isVerified = isVerified;
    }

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.services = { $in: [category] };
    }

    if (rating) {
      filter.rating = { $gte: rating };
    }

    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOption: any = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const providers = await ServiceProvider.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await ServiceProvider.countDocuments(filter);

    return {
      data: providers,
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
   * Get provider by ID (admin view)
   */
  async getProviderById(providerId: string): Promise<any> {
    const provider = await ServiceProvider.findById(providerId)
      .populate('userId', 'firstName lastName email phone');
    
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    // Get additional provider statistics
    const [serviceRequestsCount, reviewsCount, averageRating] = await Promise.all([
      ServiceRequest.countDocuments({ providerId }),
      Review.countDocuments({ providerId }),
      Review.aggregate([
        { $match: { providerId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    return {
      ...provider.toObject(),
      statistics: {
        serviceRequestsCount,
        reviewsCount,
        averageRating: averageRating[0]?.avgRating || 0
      }
    };
  }

  /**
   * Verify provider
   */
  async verifyProvider(providerId: string): Promise<ApiResponseDto> {
    const provider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      { isVerified: true, verifiedAt: new Date() },
      { new: true }
    );

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    await this.createAuditLog('provider_verified', { providerId }, 'admin');

    return {
      success: true,
      message: 'Provider verified successfully',
      data: provider
    };
  }

  /**
   * Update provider status
   */
  async updateProviderStatus(providerId: string, status: string): Promise<ApiResponseDto> {
    const validStatuses = ['active', 'inactive', 'suspended', 'banned'];
    
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const provider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    await this.createAuditLog('provider_status_updated', { providerId, status }, 'admin');

    return {
      success: true,
      message: `Provider status updated to ${status}`,
      data: provider
    };
  }

  /**
   * Delete provider
   */
  async deleteProvider(providerId: string): Promise<ApiResponseDto> {
    const provider = await ServiceProvider.findByIdAndDelete(providerId);

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    // Clean up related data
    await Promise.all([
      ServiceRequest.deleteMany({ providerId }),
      Review.deleteMany({ providerId })
    ]);

    await this.createAuditLog('provider_deleted', { providerId, businessName: provider.businessName }, 'admin');

    return {
      success: true,
      message: 'Provider deleted successfully'
    };
  }

  /**
   * Get all service requests with admin filters
   */
  async getAllServiceRequests(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>> {
    const { 
      page = 1, 
      limit = 10, 
      requestStatus,
      urgency,
      budget,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (requestStatus) {
      filter.status = requestStatus;
    }

    if (urgency) {
      filter.urgency = urgency;
    }

    if (budget) {
      filter.budget = { $lte: budget };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOption: any = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const serviceRequests = await ServiceRequest.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('providerId', 'businessName')
      .sort(sortOption)
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
   * Get service request by ID (admin view)
   */
  async getServiceRequestById(requestId: string): Promise<any> {
    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate('userId', 'firstName lastName email phone')
      .populate('providerId', 'businessName rating');
    
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    return serviceRequest;
  }

  /**
   * Update service request status
   */
  async updateServiceRequestStatus(requestId: string, status: string): Promise<ApiResponseDto> {
    const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const serviceRequest = await ServiceRequest.findByIdAndUpdate(
      requestId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    await this.createAuditLog('service_request_status_updated', { requestId, status }, 'admin');

    return {
      success: true,
      message: `Service request status updated to ${status}`,
      data: serviceRequest
    };
  }

  /**
   * Get all reviews with admin filters
   */
  async getAllReviews(filters: AdminFiltersDto): Promise<PaginatedResponseDto<any>> {
    const { 
      page = 1, 
      limit = 10, 
      reviewRating,
      isFlagged,
      isModerated,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (reviewRating) {
      filter.rating = reviewRating;
    }

    if (typeof isFlagged === 'boolean') {
      filter.isFlagged = isFlagged;
    }

    if (typeof isModerated === 'boolean') {
      filter.isModerated = isModerated;
    }

    if (search) {
      filter.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { response: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOption: any = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName')
      .populate('providerId', 'businessName')
      .populate('serviceRequestId', 'title')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    return {
      data: reviews,
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
   * Get review by ID (admin view)
   */
  async getReviewById(reviewId: string): Promise<any> {
    const review = await Review.findById(reviewId)
      .populate('userId', 'firstName lastName email')
      .populate('providerId', 'businessName')
      .populate('serviceRequestId', 'title category');
    
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return review;
  }

  /**
   * Moderate review
   */
  async moderateReview(reviewId: string, action: 'approve' | 'reject', reason?: string): Promise<ApiResponseDto> {
    const updateData: any = {
      isModerated: true,
      moderatedAt: new Date(),
      moderationAction: action
    };

    if (reason) {
      updateData.moderationReason = reason;
    }

    if (action === 'reject') {
      updateData.isVisible = false;
    }

    const review = await Review.findByIdAndUpdate(reviewId, updateData, { new: true });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    await this.createAuditLog('review_moderated', { reviewId, action, reason }, 'admin');

    return {
      success: true,
      message: `Review ${action}ed successfully`,
      data: review
    };
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

