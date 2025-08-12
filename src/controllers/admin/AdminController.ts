import { Response } from 'express';
import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { AuthRequest } from '../../types';
import { asyncHandler, NotFoundError, AuthorizationError } from '../../middleware/errorHandler';

export class AdminController {

  /**
   * Get admin dashboard statistics
   */
  getDashboard = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

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

    const dashboardData = {
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

    res.status(200).json({
      success: true,
      message: 'Admin dashboard data retrieved successfully',
      data: dashboardData
    });
  });

  /**
   * Get all users with pagination and filters
   */
  getUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    const { 
      page = 1, 
      limit = 10, 
      role, 
      isActive, 
      isEmailVerified,
      search 
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const filter: any = { role: { $ne: 'admin' } };

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isEmailVerified !== undefined) filter.isEmailVerified = isEmailVerified === 'true';
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalItems: total,
        hasNext: parseInt(page as string) * parseInt(limit as string) < total,
        hasPrev: parseInt(page as string) > 1
      }
    });
  });

  /**
   * Get all service providers with pagination and filters
   */
  getProviders = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    const { 
      page = 1, 
      limit = 10, 
      isVerified, 
      isAvailable,
      search 
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const filter: any = {};

    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
    
    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { services: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    const providers = await ServiceProvider.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await ServiceProvider.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Service providers retrieved successfully',
      data: providers,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalItems: total,
        hasNext: parseInt(page as string) * parseInt(limit as string) < total,
        hasPrev: parseInt(page as string) > 1
      }
    });
  });

  /**
   * Verify a service provider
   */
  verifyProvider = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    const { providerId } = req.params;
    const { isVerified } = req.body;

    const provider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      { isVerified },
      { new: true }
    ).populate('userId', 'firstName lastName email');

    if (!provider) {
      throw new NotFoundError('Service provider not found');
    }

    res.status(200).json({
      success: true,
      message: `Provider ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: provider
    });
  });

  /**
   * Deactivate/Activate user
   */
  toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  });

  /**
   * Get all service requests with filters
   */
  getServiceRequests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    const { 
      page = 1, 
      limit = 10, 
      status, 
      category,
      priority 
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const filter: any = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const serviceRequests = await ServiceRequest.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('providerId', 'businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await ServiceRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Service requests retrieved successfully',
      data: serviceRequests,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalItems: total,
        hasNext: parseInt(page as string) * parseInt(limit as string) < total,
        hasPrev: parseInt(page as string) > 1
      }
    });
  });

  /**
   * Get all reviews with filters
   */
  getReviews = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    const { 
      page = 1, 
      limit = 10, 
      rating, 
      isVerified 
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const filter: any = {};

    if (rating) filter.rating = parseInt(rating as string);
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName')
      .populate('providerId', 'businessName')
      .populate('serviceRequest', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: reviews,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalItems: total,
        hasNext: parseInt(page as string) * parseInt(limit as string) < total,
        hasPrev: parseInt(page as string) > 1
      }
    });
  });

  /**
   * Verify/Unverify a review
   */
  toggleReviewVerification = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    const { reviewId } = req.params;
    const { isVerified } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isVerified },
      { new: true }
    ).populate('userId', 'firstName lastName')
     .populate('providerId', 'businessName');

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    res.status(200).json({
      success: true,
      message: `Review ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: review
    });
  });

  /**
   * Get platform statistics
   */
  getStatistics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

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

    const statistics = {
      userStats,
      providerStats: providerStats[0] || { total: 0, verified: 0, available: 0 },
      requestStats,
      reviewStats,
      monthlyGrowth
    };

    res.status(200).json({
      success: true,
      message: 'Platform statistics retrieved successfully',
      data: statistics
    });
  });

  /**
   * Delete user (soft delete by deactivating)
   */
  deleteUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    const { userId } = req.params;

    // Soft delete by deactivating the user
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      message: 'User deleted (deactivated) successfully',
      data: user
    });
  });

  /**
   * Get system health status
   */
  getSystemHealth = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    // Basic health checks
    const healthData = {
      status: 'healthy',
      timestamp: new Date(),
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };

    res.status(200).json({
      success: true,
      message: 'System health retrieved successfully',
      data: healthData
    });
  });
}
