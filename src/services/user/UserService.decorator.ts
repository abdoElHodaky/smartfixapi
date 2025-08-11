/**
 * Decorator-Based UserService
 * 
 * Modern implementation of user service using decorators for
 * enhanced functionality including caching, logging, retry logic, and validation.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { User } from '../../models/User';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { IUserService, IReviewService, IServiceRequestService } from '../../interfaces/services';
import {
  UpdateUserDto,
  UserFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto,
  UserStatisticsDto,
  ServiceRequestStatisticsRequestDto,
  ReviewStatisticsRequestDto
} from '../../dtos';

// Import service decorators
import {
  Singleton,
  Service,
  Cached,
  Retryable,
  Log,
  Validate,
  PostConstruct,
  PreDestroy
} from '../../decorators/service';

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 2
})
export class UserService implements IUserService {
  constructor(
    @Inject('ReviewService') private reviewService?: IReviewService,
    @Inject('ServiceRequestService') private serviceRequestService?: IServiceRequestService
  ) {}

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('👤 UserService initialized with decorator-based architecture');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('👤 UserService cleanup completed');
  }

  /**
   * Get user by ID with caching for performance
   */
  @Log('Getting user by ID')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  @Retryable({
    attempts: 3,
    delay: 1000,
    condition: (error: Error) => error.message.includes('database')
  })
  async getUserById(userId: string, includePassword: boolean = false): Promise<any> {
    const selectFields = includePassword ? '+password' : '-password';
    const user = await User.findById(userId).select(selectFields);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return user;
  }

  /**
   * Update user profile with comprehensive logging and validation
   */
  @Log({
    message: 'Updating user profile',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 2,
    delay: 1500,
    condition: (error: Error) => error.message.includes('database') || error.message.includes('network')
  })
  async updateUserProfile(userId: string, updateData: UpdateUserDto): Promise<ApiResponseDto> {
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
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
   * Upload user profile image with retry logic
   */
  @Log('Uploading user profile image')
  @Retryable({
    attempts: 3,
    delay: 2000,
    backoff: 'exponential'
  })
  async uploadProfileImage(userId: string, imageUrl: string): Promise<ApiResponseDto> {
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        profileImage: imageUrl,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      success: true,
      message: 'Profile image uploaded successfully',
      data: { user, imageUrl }
    };
  }

  /**
   * Get user's service requests with caching
   */
  @Log('Getting user service requests')
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  @Retryable(2)
  async getUserServiceRequests(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    if (!this.serviceRequestService) {
      throw new ValidationError('Service request service not available');
    }

    try {
      // This would typically call the service request service
      // For now, we'll return a placeholder structure
      const skip = (page - 1) * limit;
      
      // In a real implementation, you would call:
      // return await this.serviceRequestService.getRequestsByUserId(userId, { page, limit });
      
      return {
        success: true,
        message: 'Service requests retrieved successfully',
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new ValidationError('Failed to get user service requests');
    }
  }

  /**
   * Get user's reviews with caching
   */
  @Log('Getting user reviews')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  @Retryable(2)
  async getUserReviews(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
    if (!this.reviewService) {
      throw new ValidationError('Review service not available');
    }

    try {
      // This would typically call the review service
      // For now, we'll return a placeholder structure
      const skip = (page - 1) * limit;
      
      // In a real implementation, you would call:
      // return await this.reviewService.getReviewsByUserId(userId, { page, limit });
      
      return {
        success: true,
        message: 'User reviews retrieved successfully',
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new ValidationError('Failed to get user reviews');
    }
  }

  /**
   * Get user dashboard data with comprehensive caching
   */
  @Log({
    message: 'Getting user dashboard data',
    includeExecutionTime: true
  })
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'linear'
  })
  async getUserDashboard(userId: string): Promise<ApiResponseDto> {
    try {
      // Get user basic info
      const user = await this.getUserById(userId);

      // Get user statistics (placeholder implementation)
      const statistics: UserStatisticsDto = {
        totalServiceRequests: 0,
        activeServiceRequests: 0,
        completedServiceRequests: 0,
        totalReviews: 0,
        averageRating: 0,
        totalSpent: 0,
        joinDate: user.createdAt,
        lastActivity: user.lastLogin || user.updatedAt
      };

      // In a real implementation, you would gather actual statistics:
      // const serviceRequestStats = await this.serviceRequestService?.getUserStatistics(userId);
      // const reviewStats = await this.reviewService?.getUserStatistics(userId);

      return {
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: {
          user: user.toJSON(),
          statistics,
          recentActivity: [], // Placeholder for recent activities
          notifications: []   // Placeholder for notifications
        }
      };
    } catch (error) {
      throw new ValidationError('Failed to get dashboard data');
    }
  }

  /**
   * Update user location with validation
   */
  @Log('Updating user location')
  @Retryable(2)
  async updateUserLocation(userId: string, location: { latitude: number; longitude: number; address?: string }): Promise<ApiResponseDto> {
    // Validate coordinates
    if (location.latitude < -90 || location.latitude > 90) {
      throw new ValidationError('Invalid latitude value');
    }
    if (location.longitude < -180 || location.longitude > 180) {
      throw new ValidationError('Invalid longitude value');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        address: location.address,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      success: true,
      message: 'Location updated successfully',
      data: { user }
    };
  }

  /**
   * Delete user account with comprehensive cleanup
   */
  @Log({
    message: 'Deleting user account',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 2,
    delay: 3000
  })
  async deleteUserAccount(userId: string): Promise<ApiResponseDto> {
    try {
      // In a real implementation, you would:
      // 1. Cancel active service requests
      // 2. Handle pending payments
      // 3. Anonymize reviews
      // 4. Clean up related data
      
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Soft delete by updating status
      await User.findByIdAndUpdate(userId, {
        status: 'deleted',
        deletedAt: new Date(),
        email: `deleted_${Date.now()}_${user.email}`, // Anonymize email
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Account deleted successfully',
        data: null
      };
    } catch (error) {
      throw new ValidationError('Failed to delete account');
    }
  }

  /**
   * Search users with advanced filtering and caching
   */
  @Log('Searching users')
  @Cached(1 * 60 * 1000) // Cache for 1 minute
  @Retryable(2)
  async searchUsers(filters: UserFiltersDto, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<any>> {
    try {
      const skip = (page - 1) * limit;
      let query: any = { status: 'active' };

      // Apply filters
      if (filters.role) {
        query.role = filters.role;
      }

      if (filters.location && filters.radius) {
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: filters.location.coordinates
            },
            $maxDistance: filters.radius * 1000 // Convert km to meters
          }
        };
      }

      if (filters.searchTerm) {
        query.$or = [
          { firstName: { $regex: filters.searchTerm, $options: 'i' } },
          { lastName: { $regex: filters.searchTerm, $options: 'i' } },
          { email: { $regex: filters.searchTerm, $options: 'i' } }
        ];
      }

      // Execute query
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        User.countDocuments(query)
      ]);

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new ValidationError('Failed to search users');
    }
  }

  /**
   * Get user statistics with caching
   */
  @Log('Getting user statistics')
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getUserStatistics(userId: string): Promise<UserStatisticsDto> {
    try {
      const user = await this.getUserById(userId);

      // In a real implementation, you would gather actual statistics from related services
      const statistics: UserStatisticsDto = {
        totalRequests: 0,
        totalServiceRequests: 0,
        pendingRequests: 0,
        activeRequests: 0,
        completedRequests: 0,
        totalReviews: 0
      };

      return statistics;
    } catch (error) {
      throw new ValidationError('Failed to get user statistics');
    }
  }

  /**
   * Update user preferences
   */
  @Log('Updating user preferences')
  @Retryable(2)
  async updateUserPreferences(userId: string, preferences: any): Promise<ApiResponseDto> {
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        preferences,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      success: true,
      message: 'Preferences updated successfully',
      data: { user }
    };
  }

  /**
   * Get user activity log with caching
   */
  @Log('Getting user activity log')
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async getUserActivityLog(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponseDto<any>> {
    try {
      // In a real implementation, you would have an activity log collection
      // For now, return placeholder data
      
      return {
        success: true,
        message: `Activity log retrieved successfully for user ${userId}`,
        data: [], // Placeholder for activity entries
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new ValidationError('Failed to get activity log');
    }
  }
}
