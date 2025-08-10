import { User } from '../../models/User';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { IUserService } from '../../interfaces/services';
import {
  UpdateUserDto,
  UserFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

export class UserService implements IUserService {
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
  async updateUserProfile(userId: string, updateData: UpdateUserDto): Promise<ApiResponseDto> {
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      success: true,
      message: 'User profile updated successfully',
      data: user
    };
  }

  /**
   * Delete user account
   */
  async deleteUserAccount(userId: string): Promise<ApiResponseDto> {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      success: true,
      message: 'User account deleted successfully'
    };
  }

  /**
   * Search users with filters
   */
  async searchUsers(filters: UserFiltersDto): Promise<PaginatedResponseDto<any>> {
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

    if (role) {
      filter.role = role;
    }

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
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

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
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
   * Get user's service requests
   */
  async getUserServiceRequests(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;

    const serviceRequests = await ServiceRequest.find({ userId })
      .populate('providerId', 'businessName rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ServiceRequest.countDocuments({ userId });

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
   * Get user's reviews
   */
  async getUserReviews(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ userId })
      .populate('providerId', 'businessName')
      .populate('serviceRequestId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ userId });

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
   * Upload user profile image
   */
  async uploadProfileImage(userId: string, imageUrl: string): Promise<ApiResponseDto> {
    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      success: true,
      message: 'Profile image uploaded successfully',
      data: { profileImage: imageUrl }
    };
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string): Promise<any> {
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

    return {
      totalRequests,
      pendingRequests,
      activeRequests,
      completedRequests,
      totalReviews
    };
  }

  /**
   * Update user location
   */
  async updateUserLocation(
    userId: string, 
    location: { type: 'Point'; coordinates: [number, number] }
  ): Promise<ApiResponseDto> {
    const user = await User.findByIdAndUpdate(
      userId,
      { location },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      success: true,
      message: 'User location updated successfully',
      data: { location }
    };
  }

  /**
   * Get users by location
   */
  async getUsersByLocation(coordinates: [number, number], radius: number): Promise<any[]> {
    const users = await User.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: radius
        }
      }
    }).select('-password');

    return users;
  }

  /**
   * Update user status (admin function)
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

    return {
      success: true,
      message: `User status updated to ${status}`,
      data: user
    };
  }

  /**
   * Get all users (admin function)
   */
  async getAllUsers(filters: UserFiltersDto): Promise<PaginatedResponseDto<any>> {
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
}
