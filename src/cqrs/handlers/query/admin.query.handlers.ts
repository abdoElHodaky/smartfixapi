/**
 * Admin Query Handlers for CQRS Pattern
 * 
 * Handlers for admin read operations
 */

import { Injectable, Inject } from '@decorators/di';
import { QueryHandler, QueryResult } from '../../types';
import {
  GetAdminDashboardQuery,
  GetPlatformStatisticsQuery,
  GetAllUsersQuery,
  GetUserDetailsQuery,
  GetUserStatisticsQuery,
  GetAllProvidersQuery,
  GetProviderDetailsQuery,
  GetProviderStatisticsQuery,
  GetAllServiceRequestsQuery,
  GetServiceRequestStatisticsQuery,
  GetAllReviewsQuery,
  GetReviewStatisticsQuery,
  GetFlaggedContentQuery,
  GenerateReportQuery,
  SearchQuery
} from '../../queries/admin.queries';

import { User } from '../../../models/User';
import { ServiceProvider } from '../../../models/ServiceProvider';
import { ServiceRequest } from '../../../models/ServiceRequest';
import { Review } from '../../../models/Review';
import { NotFoundError, ValidationError, AuthenticationError } from '../../../middleware/errorHandler';
import { IUserService } from '../../../interfaces/services';

@Injectable()
export class GetAdminDashboardQueryHandler implements QueryHandler<GetAdminDashboardQuery> {
  constructor(
    @Inject('UserService') private userService: IUserService
  ) {}

  async handle(query: GetAdminDashboardQuery): Promise<QueryResult> {
    const { adminId, includeRecentActivity = true, includeStatistics = true } = query.payload;

    try {
      await this.verifyAdminPermissions(adminId);

      const dashboardData = await this.fetchDashboardData(includeRecentActivity, includeStatistics);

      return {
        success: true,
        data: dashboardData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AuthenticationError('Insufficient permissions');
    }
  }

  private async fetchDashboardData(includeRecentActivity: boolean, includeStatistics: boolean) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Base overview data
    const [
      totalUsers,
      totalProviders,
      totalServiceRequests,
      totalReviews,
      activeUsers,
      pendingRequests
    ] = await Promise.all([
      User.countDocuments(),
      ServiceProvider.countDocuments(),
      ServiceRequest.countDocuments(),
      Review.countDocuments(),
      User.countDocuments({ 
        status: 'active', 
        lastLogin: { $gte: thirtyDaysAgo } 
      }),
      ServiceRequest.countDocuments({ status: 'pending' })
    ]);

    const overview = {
      totalUsers,
      totalProviders,
      totalServiceRequests,
      totalReviews,
      activeUsers,
      pendingRequests
    };

    let recentActivity = null;
    if (includeRecentActivity) {
      const [recentUsers, recentProviders, recentRequests] = await Promise.all([
        User.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('firstName lastName email createdAt status')
          .lean(),
        ServiceProvider.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('userId', 'firstName lastName email')
          .lean(),
        ServiceRequest.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('userId', 'firstName lastName')
          .lean()
      ]);

      recentActivity = {
        recentUsers,
        recentProviders,
        recentRequests
      };
    }

    let statistics = null;
    if (includeStatistics) {
      statistics = await this.getPlatformStatistics();
    }

    return {
      overview,
      recentActivity,
      statistics
    };
  }

  private async getPlatformStatistics() {
    const [userStats, providerStats, requestStats, reviewStats] = await Promise.all([
      this.getUserStatistics(),
      this.getProviderStatistics(),
      this.getServiceRequestStatistics(),
      this.getReviewStatistics()
    ]);

    return {
      users: userStats,
      providers: providerStats,
      serviceRequests: requestStats,
      reviews: reviewStats,
      generatedAt: new Date()
    };
  }

  private async getUserStatistics() {
    const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const [totalUsers, activeUsers, newUsersThisMonth, usersByRole] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ createdAt: { $gte: currentMonth } }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      newThisMonth: newUsersThisMonth,
      byRole: usersByRole
    };
  }

  private async getProviderStatistics() {
    const [totalProviders, activeProviders, topRatedProviders] = await Promise.all([
      ServiceProvider.countDocuments(),
      ServiceProvider.countDocuments({ status: 'active' }),
      ServiceProvider.countDocuments({ averageRating: { $gte: 4.5 } })
    ]);

    return {
      total: totalProviders,
      active: activeProviders,
      topRated: topRatedProviders
    };
  }

  private async getServiceRequestStatistics() {
    const [totalRequests, pendingRequests, completedRequests] = await Promise.all([
      ServiceRequest.countDocuments(),
      ServiceRequest.countDocuments({ status: 'pending' }),
      ServiceRequest.countDocuments({ status: 'completed' })
    ]);

    return {
      total: totalRequests,
      pending: pendingRequests,
      completed: completedRequests,
      completionRate: totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0
    };
  }

  private async getReviewStatistics() {
    const [totalReviews, averageRating, flaggedReviews] = await Promise.all([
      Review.countDocuments(),
      Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]),
      Review.countDocuments({ flagged: true })
    ]);

    return {
      total: totalReviews,
      average: averageRating[0]?.avgRating || 0,
      flagged: flaggedReviews
    };
  }
}

@Injectable()
export class GetAllUsersQueryHandler implements QueryHandler<GetAllUsersQuery> {
  constructor(
    @Inject('UserService') private userService: IUserService
  ) {}

  async handle(query: GetAllUsersQuery): Promise<QueryResult> {
    const { 
      adminId, 
      page = 1, 
      limit = 20, 
      filters, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = query.payload;

    try {
      await this.verifyAdminPermissions(adminId);

      const skip = (page - 1) * limit;
      const mongoQuery = this.buildUserQuery(filters);
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [users, total] = await Promise.all([
        User.find(mongoQuery)
          .select('-password')
          .skip(skip)
          .limit(limit)
          .sort(sortOptions)
          .lean(),
        User.countDocuments(mongoQuery)
      ]);

      return {
        success: true,
        data: users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AuthenticationError('Insufficient permissions');
    }
  }

  private buildUserQuery(filters?: any): any {
    const query: any = {};

    if (!filters) return query;

    const { status, role, searchTerm, dateRange } = filters;

    if (status) {
      query.status = status;
    }

    if (role) {
      query.role = role;
    }

    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
      const searchRegex = { $regex: searchTerm.trim(), $options: 'i' };
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }

    if (dateRange && dateRange.from && dateRange.to) {
      query.createdAt = {
        $gte: dateRange.from,
        $lte: dateRange.to
      };
    }

    return query;
  }
}

@Injectable()
export class GetAllProvidersQueryHandler implements QueryHandler<GetAllProvidersQuery> {
  constructor(
    @Inject('UserService') private userService: IUserService
  ) {}

  async handle(query: GetAllProvidersQuery): Promise<QueryResult> {
    const { 
      adminId, 
      page = 1, 
      limit = 20, 
      filters, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = query.payload;

    try {
      await this.verifyAdminPermissions(adminId);

      const skip = (page - 1) * limit;
      const mongoQuery = this.buildProviderQuery(filters);
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [providers, total] = await Promise.all([
        ServiceProvider.find(mongoQuery)
          .populate('userId', 'firstName lastName email phone')
          .skip(skip)
          .limit(limit)
          .sort(sortOptions)
          .lean(),
        ServiceProvider.countDocuments(mongoQuery)
      ]);

      return {
        success: true,
        data: providers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AuthenticationError('Insufficient permissions');
    }
  }

  private buildProviderQuery(filters?: any): any {
    const query: any = {};

    if (!filters) return query;

    const { status, services, searchTerm, rating, dateRange } = filters;

    if (status) {
      query.status = status;
    }

    if (services && Array.isArray(services) && services.length > 0) {
      query.services = { $in: services };
    }

    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
      const searchRegex = { $regex: searchTerm.trim(), $options: 'i' };
      query.$or = [
        { businessName: searchRegex },
        { description: searchRegex }
      ];
    }

    if (rating) {
      if (rating.min !== undefined) {
        query.averageRating = { ...query.averageRating, $gte: rating.min };
      }
      if (rating.max !== undefined) {
        query.averageRating = { ...query.averageRating, $lte: rating.max };
      }
    }

    if (dateRange && dateRange.from && dateRange.to) {
      query.createdAt = {
        $gte: dateRange.from,
        $lte: dateRange.to
      };
    }

    return query;
  }
}

@Injectable()
export class GetFlaggedContentQueryHandler implements QueryHandler<GetFlaggedContentQuery> {
  constructor(
    @Inject('UserService') private userService: IUserService
  ) {}

  async handle(query: GetFlaggedContentQuery): Promise<QueryResult> {
    const { 
      adminId, 
      contentType = 'all', 
      severity, 
      page = 1, 
      limit = 20, 
      dateRange 
    } = query.payload;

    try {
      await this.verifyAdminPermissions(adminId);

      let flaggedContent: any = {};

      if (contentType === 'all' || contentType === 'review') {
        flaggedContent.reviews = await this.getFlaggedReviews(severity, dateRange, page, limit);
      }

      if (contentType === 'all' || contentType === 'user') {
        flaggedContent.users = await this.getFlaggedUsers(severity, dateRange, page, limit);
      }

      if (contentType === 'all' || contentType === 'provider') {
        flaggedContent.providers = await this.getFlaggedProviders(severity, dateRange, page, limit);
      }

      return {
        success: true,
        data: flaggedContent
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AuthenticationError('Insufficient permissions');
    }
  }

  private buildFlaggedQuery(severity?: string, dateRange?: any) {
    const query: any = { flagged: true };

    if (severity) {
      query.flagSeverity = severity;
    }

    if (dateRange && dateRange.from && dateRange.to) {
      query.flaggedAt = {
        $gte: dateRange.from,
        $lte: dateRange.to
      };
    }

    return query;
  }

  private async getFlaggedReviews(severity?: string, dateRange?: any, page = 1, limit = 20) {
    const query = this.buildFlaggedQuery(severity, dateRange);
    const skip = (page - 1) * limit;

    return await Review.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('providerId', 'businessName userId')
      .sort({ flaggedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  private async getFlaggedUsers(severity?: string, dateRange?: any, page = 1, limit = 20) {
    const query = this.buildFlaggedQuery(severity, dateRange);
    const skip = (page - 1) * limit;

    return await User.find(query)
      .select('-password')
      .sort({ flaggedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  private async getFlaggedProviders(severity?: string, dateRange?: any, page = 1, limit = 20) {
    const query = this.buildFlaggedQuery(severity, dateRange);
    const skip = (page - 1) * limit;

    return await ServiceProvider.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ flaggedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

@Injectable()
export class GenerateReportQueryHandler implements QueryHandler<GenerateReportQuery> {
  constructor(
    @Inject('UserService') private userService: IUserService
  ) {}

  async handle(query: GenerateReportQuery): Promise<QueryResult> {
    const { 
      adminId, 
      reportType, 
      dateRange, 
      format = 'json', 
      filters, 
      includeCharts = false 
    } = query.payload;

    try {
      await this.verifyAdminPermissions(adminId);

      let reportData;

      switch (reportType) {
        case 'user_activity':
          reportData = await this.generateUserActivityReport(dateRange);
          break;
        case 'provider_performance':
          reportData = await this.generateProviderPerformanceReport(dateRange);
          break;
        case 'service_requests':
          reportData = await this.generateServiceRequestReport(dateRange);
          break;
        case 'revenue':
          reportData = await this.generateRevenueReport(dateRange);
          break;
        case 'platform_overview':
          reportData = await this.generatePlatformOverviewReport(dateRange);
          break;
        default:
          throw new ValidationError(`Invalid report type: ${reportType}`);
      }

      return {
        success: true,
        data: {
          reportType,
          dateRange,
          format,
          generatedAt: new Date(),
          data: reportData,
          charts: includeCharts ? await this.generateChartData(reportType, reportData) : null
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AuthenticationError('Insufficient permissions');
    }
  }

  private async generateUserActivityReport(dateRange?: any) {
    const matchStage: any = {};
    if (dateRange) {
      matchStage.createdAt = { $gte: dateRange.from, $lte: dateRange.to };
    }

    return await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          newUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
  }

  private async generateProviderPerformanceReport(dateRange?: any) {
    // Implementation would depend on specific requirements
    return {
      topPerformers: [],
      averageRatings: [],
      completionRates: []
    };
  }

  private async generateServiceRequestReport(dateRange?: any) {
    const matchStage: any = {};
    if (dateRange) {
      matchStage.createdAt = { $gte: dateRange.from, $lte: dateRange.to };
    }

    return await ServiceRequest.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          averageBudget: { $avg: '$budget' }
        }
      }
    ]);
  }

  private async generateRevenueReport(dateRange?: any) {
    // Placeholder for revenue report
    return {
      totalRevenue: 0,
      transactions: [],
      trends: []
    };
  }

  private async generatePlatformOverviewReport(dateRange?: any) {
    const [userStats, providerStats, requestStats, reviewStats] = await Promise.all([
      this.generateUserActivityReport(dateRange),
      this.generateProviderPerformanceReport(dateRange),
      this.generateServiceRequestReport(dateRange),
      Review.countDocuments(dateRange ? { createdAt: { $gte: dateRange.from, $lte: dateRange.to } } : {})
    ]);

    return {
      users: userStats,
      providers: providerStats,
      serviceRequests: requestStats,
      totalReviews: reviewStats
    };
  }

  private async generateChartData(reportType: string, reportData: any) {
    // Placeholder for chart data generation
    return {
      type: 'line',
      data: [],
      labels: []
    };
  }
}

@Injectable()
export class SearchQueryHandler implements QueryHandler<SearchQuery> {
  constructor(
    @Inject('UserService') private userService: IUserService
  ) {}

  async handle(query: SearchQuery): Promise<QueryResult> {
    const { 
      adminId, 
      searchTerm, 
      searchType, 
      page = 1, 
      limit = 20, 
      filters 
    } = query.payload;

    try {
      await this.verifyAdminPermissions(adminId);

      let searchResults: any = {};

      if (searchType === 'all' || searchType === 'users') {
        searchResults.users = await this.searchUsers(searchTerm, filters, page, limit);
      }

      if (searchType === 'all' || searchType === 'providers') {
        searchResults.providers = await this.searchProviders(searchTerm, filters, page, limit);
      }

      if (searchType === 'all' || searchType === 'service_requests') {
        searchResults.serviceRequests = await this.searchServiceRequests(searchTerm, filters, page, limit);
      }

      if (searchType === 'all' || searchType === 'reviews') {
        searchResults.reviews = await this.searchReviews(searchTerm, filters, page, limit);
      }

      return {
        success: true,
        data: searchResults
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async verifyAdminPermissions(userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AuthenticationError('Insufficient permissions');
    }
  }

  private async searchUsers(searchTerm: string, filters?: any, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const searchRegex = { $regex: searchTerm, $options: 'i' };
    
    const query: any = {
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ]
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
  }

  private async searchProviders(searchTerm: string, filters?: any, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const searchRegex = { $regex: searchTerm, $options: 'i' };
    
    const query: any = {
      $or: [
        { businessName: searchRegex },
        { description: searchRegex }
      ]
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await ServiceProvider.find(query)
      .populate('userId', 'firstName lastName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
  }

  private async searchServiceRequests(searchTerm: string, filters?: any, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const searchRegex = { $regex: searchTerm, $options: 'i' };
    
    const query: any = {
      $or: [
        { title: searchRegex },
        { description: searchRegex }
      ]
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await ServiceRequest.find(query)
      .populate('userId', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
  }

  private async searchReviews(searchTerm: string, filters?: any, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const searchRegex = { $regex: searchTerm, $options: 'i' };
    
    const query: any = {
      $or: [
        { comment: searchRegex }
      ]
    };

    if (filters?.flagged !== undefined) {
      query.flagged = filters.flagged;
    }

    return await Review.find(query)
      .populate('userId', 'firstName lastName')
      .populate('providerId', 'businessName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
  }
}

