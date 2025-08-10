import { User } from '../../models/User';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface UserSearchFilters {
  role?: 'user' | 'provider';
  isActive?: boolean;
  isEmailVerified?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string, includePassword: boolean = false): Promise<any> {
    const selectFields = includePassword ? '+password' : '-password';
    const user = await User.findById(userId).select(selectFields);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return user;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updateData: UserUpdateData): Promise<any> {
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user location
   */
  async updateUserLocation(
    userId: string, 
    coordinates: [number, number], 
    address?: any
  ): Promise<any> {
    const updateData: any = {
      location: {
        type: 'Point',
        coordinates
      }
    };

    if (address) {
      updateData.address = address;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Get user dashboard data
   */
  async getUserDashboard(userId: string): Promise<any> {
    const [
      totalRequests,
      pendingRequests,
      activeRequests,
      completedRequests,
      totalReviews
    ] = await Promise.all([
      ServiceRequest.countDocuments({ userId }),
      ServiceRequest.countDocuments({ userId, status: 'pending' }),
      ServiceRequest.countDocuments({ 
        userId, 
        status: { $in: ['accepted', 'in_progress'] } 
      }),
      ServiceRequest.countDocuments({ userId, status: 'completed' }),
      Review.countDocuments({ userId })
    ]);

    // Get recent service requests
    const recentRequests = await ServiceRequest.find({ userId })
      .populate('providerId', 'businessName rating')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent reviews
    const recentReviews = await Review.find({ userId })
      .populate('providerId', 'businessName')
      .sort({ createdAt: -1 })
      .limit(3);

    return {
      stats: {
        totalRequests,
        pendingRequests,
        activeRequests,
        completedRequests,
        totalReviews
      },
      recentRequests,
      recentReviews
    };
  }

  /**
   * Get user's service requests with pagination
   */
  async getUserServiceRequests(
    userId: string, 
    page: number = 1, 
    limit: number = 10, 
    status?: string
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = { userId };
    
    if (status) {
      filter.status = status;
    }

    const serviceRequests = await ServiceRequest.find(filter)
      .populate('providerId', 'businessName rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ServiceRequest.countDocuments(filter);

    return {
      serviceRequests,
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
   * Get user's reviews with pagination
   */
  async getUserReviews(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ userId })
      .populate('providerId', 'businessName')
      .populate('serviceRequestId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ userId });

    return {
      reviews,
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
   * Search users with filters
   */
  async searchUsers(filters: UserSearchFilters): Promise<any> {
    const { 
      role, 
      isActive, 
      isEmailVerified, 
      search, 
      page = 1, 
      limit = 10 
    } = filters;

    const skip = (page - 1) * limit;
    const filter: any = { role: { $ne: 'admin' } };

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive;
    if (isEmailVerified !== undefined) filter.isEmailVerified = isEmailVerified;
    
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
      .limit(limit);

    const total = await User.countDocuments(filter);

    return {
      users,
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
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<any> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Activate user account
   */
  async activateUser(userId: string): Promise<any> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(): Promise<any> {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      usersByRole
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' }, isActive: true }),
      User.countDocuments({ role: { $ne: 'admin' }, isEmailVerified: true }),
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      usersByRole: usersByRole.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }

  /**
   * Validate user data
   */
  static validateUserData(userData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (userData.firstName && userData.firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (userData.lastName && userData.lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    if (userData.phone && !/^\+?[\d\s\-\(\)]+$/.test(userData.phone)) {
      errors.push('Please provide a valid phone number');
    }

    if (userData.location && userData.location.coordinates) {
      const [lng, lat] = userData.location.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number' || 
          lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        errors.push('Invalid location coordinates');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
