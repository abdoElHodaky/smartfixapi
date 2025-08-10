import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { Chat } from '../../models/Chat';
import { NotFoundError } from '../../middleware/errorHandler';

export interface AdminDashboardData {
  stats: {
    totalUsers: number;
    totalProviders: number;
    totalRequests: number;
    totalReviews: number;
    activeRequests: number;
    completedRequests: number;
    pendingProviders: number;
    verifiedProviders: number;
  };
  recentUsers: any[];
  recentRequests: any[];
}

export interface PlatformStatistics {
  userStats: any[];
  providerStats: any;
  requestStats: any[];
  reviewStats: any[];
  monthlyGrowth: any[];
}

export class AdminService {
  /**
   * Get admin dashboard data
   */
  static async getDashboardData(): Promise<AdminDashboardData> {
    const [
      totalUsers,
      totalProviders,
      totalRequests,
      totalReviews,
      activeRequests,
      completedRequests,
      pendingProviders,
      verifiedProviders,
      recentUsers,
      recentRequests
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      ServiceProvider.countDocuments(),
      ServiceRequest.countDocuments(),
      Review.countDocuments(),
      ServiceRequest.countDocuments({ status: { $in: ['accepted', 'in_progress'] } }),
      ServiceRequest.countDocuments({ status: 'completed' }),
      ServiceProvider.countDocuments({ isVerified: false }),
      ServiceProvider.countDocuments({ isVerified: true }),
      User.find({ role: { $ne: 'admin' } })
        .select('firstName lastName email role createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      ServiceRequest.find()
        .populate('userId', 'firstName lastName')
        .populate('providerId', 'businessName')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    return {
      stats: {
        totalUsers,
        totalProviders,
        totalRequests,
        totalReviews,
        activeRequests,
        completedRequests,
        pendingProviders,
        verifiedProviders
      },
      recentUsers,
      recentRequests
    };
  }

  /**
   * Get platform statistics
   */
  static async getPlatformStatistics(): Promise<PlatformStatistics> {
    const [
      userStats,
      providerStats,
      requestStats,
      reviewStats,
      monthlyGrowth
    ] = await Promise.all([
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { 
          _id: '$role', 
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }}
      ]),
      ServiceProvider.aggregate([
        { $group: { 
          _id: null, 
          total: { $sum: 1 },
          verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
          available: { $sum: { $cond: ['$isAvailable', 1, 0] } }
        }}
      ]),
      ServiceRequest.aggregate([
        { $group: { 
          _id: '$status', 
          count: { $sum: 1 },
          avgBudget: { $avg: '$budget.max' }
        }}
      ]),
      Review.aggregate([
        { $group: { 
          _id: '$rating', 
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      User.aggregate([
        { $match: { 
          role: { $ne: 'admin' },
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }},
        { $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    return {
      userStats,
      providerStats: providerStats[0] || { total: 0, verified: 0, available: 0 },
      requestStats,
      reviewStats,
      monthlyGrowth
    };
  }

  /**
   * Get system health status
   */
  static async getSystemHealth(): Promise<any> {
    try {
      // Test database connectivity
      const dbTest = await User.findOne().limit(1);
      
      // Get basic metrics
      const [userCount, providerCount, requestCount] = await Promise.all([
        User.countDocuments(),
        ServiceProvider.countDocuments(),
        ServiceRequest.countDocuments()
      ]);

      return {
        status: 'healthy',
        timestamp: new Date(),
        database: 'connected',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        metrics: {
          users: userCount,
          providers: providerCount,
          requests: requestCount
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        database: 'disconnected',
        error: (error as Error).message,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      };
    }
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const [
      newUsers,
      activeUsers,
      usersByRole,
      usersByLocation
    ] = await Promise.all([
      User.countDocuments({ 
        role: { $ne: 'admin' },
        createdAt: { $gte: startDate } 
      }),
      User.countDocuments({ 
        role: { $ne: 'admin' },
        lastLoginDate: { $gte: startDate } 
      }),
      User.aggregate([
        { $match: { role: { $ne: 'admin' }, createdAt: { $gte: startDate } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $match: { role: { $ne: 'admin' }, 'address.city': { $exists: true } } },
        { $group: { _id: '$address.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      timeframe,
      newUsers,
      activeUsers,
      usersByRole,
      usersByLocation
    };
  }

  /**
   * Get provider analytics
   */
  static async getProviderAnalytics(): Promise<any> {
    const [
      totalProviders,
      verifiedProviders,
      availableProviders,
      providersByService,
      topRatedProviders,
      providersByLocation
    ] = await Promise.all([
      ServiceProvider.countDocuments(),
      ServiceProvider.countDocuments({ isVerified: true }),
      ServiceProvider.countDocuments({ isAvailable: true }),
      ServiceProvider.aggregate([
        { $unwind: '$services' },
        { $group: { _id: '$services', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      ServiceProvider.find({ isVerified: true })
        .sort({ 'rating.average': -1, completedJobs: -1 })
        .limit(10)
        .populate('userId', 'firstName lastName'),
      ServiceProvider.aggregate([
        { $match: { 'serviceArea.coordinates': { $exists: true } } },
        { $group: { 
          _id: { 
            lat: { $round: [{ $arrayElemAt: ['$serviceArea.coordinates', 1] }, 0] },
            lng: { $round: [{ $arrayElemAt: ['$serviceArea.coordinates', 0] }, 0] }
          }, 
          count: { $sum: 1 } 
        }},
        { $sort: { count: -1 } },
        { $limit: 20 }
      ])
    ]);

    return {
      totalProviders,
      verifiedProviders,
      availableProviders,
      verificationRate: totalProviders > 0 ? (verifiedProviders / totalProviders) * 100 : 0,
      availabilityRate: totalProviders > 0 ? (availableProviders / totalProviders) * 100 : 0,
      providersByService,
      topRatedProviders,
      providersByLocation
    };
  }

  /**
   * Get service request analytics
   */
  static async getServiceRequestAnalytics(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const [
      totalRequests,
      statusDistribution,
      categoryDistribution,
      averageBudget,
      completionRate,
      averageResponseTime
    ] = await Promise.all([
      ServiceRequest.countDocuments({ createdAt: { $gte: startDate } }),
      ServiceRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      ServiceRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      ServiceRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: null, avgBudget: { $avg: '$budget.max' } } }
      ]),
      ServiceRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
          }
        }
      ]),
      ServiceRequest.aggregate([
        { 
          $match: { 
            createdAt: { $gte: startDate },
            status: { $in: ['accepted', 'completed'] },
            'proposals.0': { $exists: true }
          } 
        },
        {
          $project: {
            responseTime: {
              $subtract: [
                { $arrayElemAt: ['$proposals.submittedAt', 0] },
                '$createdAt'
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$responseTime' }
          }
        }
      ])
    ]);

    const completionRateData = completionRate[0] || { total: 0, completed: 0 };
    const avgResponseTimeData = averageResponseTime[0] || { avgResponseTime: 0 };

    return {
      timeframe,
      totalRequests,
      statusDistribution,
      categoryDistribution,
      averageBudget: averageBudget[0]?.avgBudget || 0,
      completionRate: completionRateData.total > 0 
        ? (completionRateData.completed / completionRateData.total) * 100 
        : 0,
      averageResponseTime: Math.round(avgResponseTimeData.avgResponseTime / (1000 * 60 * 60)) || 0 // Convert to hours
    };
  }

  /**
   * Get chat analytics
   */
  static async getChatAnalytics(): Promise<any> {
    const [
      totalChats,
      activeChats,
      totalMessages,
      averageMessagesPerChat,
      chatsByServiceRequest
    ] = await Promise.all([
      Chat.countDocuments(),
      Chat.countDocuments({ 
        lastMessageAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      }),
      Chat.aggregate([
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$messageCount' } } }
      ]),
      Chat.aggregate([
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, average: { $avg: '$messageCount' } } }
      ]),
      Chat.aggregate([
        {
          $lookup: {
            from: 'servicerequests',
            localField: 'serviceRequestId',
            foreignField: '_id',
            as: 'serviceRequest'
          }
        },
        { $unwind: '$serviceRequest' },
        { $group: { _id: '$serviceRequest.status', count: { $sum: 1 } } }
      ])
    ]);

    return {
      totalChats,
      activeChats,
      totalMessages: totalMessages[0]?.total || 0,
      averageMessagesPerChat: Math.round(averageMessagesPerChat[0]?.average || 0),
      chatsByServiceRequest
    };
  }

  /**
   * Get financial analytics (placeholder for future payment integration)
   */
  static async getFinancialAnalytics(): Promise<any> {
    // This would be implemented when payment system is integrated
    const [
      totalRevenue,
      completedTransactions,
      averageTransactionValue
    ] = await Promise.all([
      ServiceRequest.aggregate([
        { $match: { status: 'completed', 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]),
      ServiceRequest.countDocuments({ status: 'completed', 'payment.status': 'paid' }),
      ServiceRequest.aggregate([
        { $match: { status: 'completed', 'payment.status': 'paid' } },
        { $group: { _id: null, average: { $avg: '$payment.amount' } } }
      ])
    ]);

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      completedTransactions,
      averageTransactionValue: averageTransactionValue[0]?.average || 0,
      platformFee: (totalRevenue[0]?.total || 0) * 0.1 // Assuming 10% platform fee
    };
  }

  /**
   * Export data for reporting
   */
  static async exportData(
    dataType: 'users' | 'providers' | 'requests' | 'reviews',
    format: 'json' | 'csv' = 'json'
  ): Promise<any> {
    let data: any[] = [];

    switch (dataType) {
      case 'users':
        data = await User.find({ role: { $ne: 'admin' } })
          .select('-password')
          .lean();
        break;
      case 'providers':
        data = await ServiceProvider.find()
          .populate('userId', 'firstName lastName email')
          .lean();
        break;
      case 'requests':
        data = await ServiceRequest.find()
          .populate('userId', 'firstName lastName email')
          .populate('providerId', 'businessName')
          .lean();
        break;
      case 'reviews':
        data = await Review.find()
          .populate('userId', 'firstName lastName')
          .populate('providerId', 'businessName')
          .lean();
        break;
    }

    if (format === 'csv') {
      // Convert to CSV format (simplified implementation)
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(value => 
          typeof value === 'object' ? JSON.stringify(value) : value
        ).join(',')
      );
      
      return [headers, ...rows].join('\n');
    }

    return data;
  }

  /**
   * Generate platform report
   */
  static async generatePlatformReport(): Promise<any> {
    const [
      dashboardData,
      userAnalytics,
      providerAnalytics,
      requestAnalytics,
      chatAnalytics,
      financialAnalytics
    ] = await Promise.all([
      this.getDashboardData(),
      this.getUserAnalytics('month'),
      this.getProviderAnalytics(),
      this.getServiceRequestAnalytics('month'),
      this.getChatAnalytics(),
      this.getFinancialAnalytics()
    ]);

    return {
      generatedAt: new Date(),
      period: 'last_30_days',
      dashboard: dashboardData,
      analytics: {
        users: userAnalytics,
        providers: providerAnalytics,
        requests: requestAnalytics,
        chat: chatAnalytics,
        financial: financialAnalytics
      }
    };
  }
}

