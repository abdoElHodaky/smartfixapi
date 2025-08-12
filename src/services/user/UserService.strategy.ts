/**
 * Strategy-Based UserService Implementation
 * 
 * Enhanced UserService using Strategy Patterns and AggregationBuilder
 * for optimized performance and maintainable conditional logic.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { User } from '../../models/User';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { NotFoundError, ValidationError, AuthenticationError } from '../../middleware/errorHandler';
import { IUserService, IReviewService, IServiceRequestService } from '../../interfaces/services';
import {
  UpdateUserDto,
  UserFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto,
  UserStatisticsDto
} from '../../dtos';

// Import optimization utilities
import { AggregationBuilder, AggregationUtils } from '../../utils/aggregation/AggregationBuilder';
import { 
  StrategyRegistry, 
  AsyncStrategyRegistry, 
  Strategy, 
  AsyncStrategy 
} from '../../utils/conditions/StrategyPatterns';
import { ConditionalHelpers, RoleCheckOptions } from '../../utils/conditions/ConditionalHelpers';
import { CommandBase, CommandResult, CommandContext } from '../../utils/service-optimization/CommandBase';

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

// Strategy interfaces
interface UserOperationInput {
  userId: string;
  requesterId?: string;
  data?: any;
  metadata?: Record<string, any>;
}

interface UserSearchInput {
  filters: UserFiltersDto;
  requesterId?: string;
  includeInactive?: boolean;
}

interface UserLocationInput {
  userId: string;
  location?: { type: 'Point'; coordinates: [number, number] };
  coordinates?: [number, number];
  radius?: number;
}

interface UserStatisticsInput {
  userId: string;
  dateRange?: { from: Date; to: Date };
  includeDetails?: boolean;
}

// User operation strategies
class GetUserByIdStrategy implements AsyncStrategy<UserOperationInput, CommandResult> {
  async execute(input: UserOperationInput): Promise<CommandResult> {
    try {
      const aggregation = AggregationBuilder.create()
        .match({ _id: input.userId, isDeleted: { $ne: true } })
        .lookup('reviews', 'userId', '_id', 'reviews')
        .lookup('serviceRequests', 'userId', '_id', 'serviceRequests')
        .addFields({
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $size: '$reviews' },
          totalServiceRequests: { $size: '$serviceRequests' }
        })
        .project({
          password: input.data?.includePassword ? 1 : 0,
          email: 1,
          name: 1,
          phone: 1,
          location: 1,
          isActive: 1,
          role: 1,
          profileImage: 1,
          averageRating: 1,
          totalReviews: 1,
          totalServiceRequests: 1,
          createdAt: 1,
          updatedAt: 1
        });

      const users = await aggregation.execute(User);
      const user = users[0];

      if (!user) {
        return CommandResult.failure('User not found');
      }

      return CommandResult.success(user, 'User retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to get user', [error.message]);
    }
  }
}

class UpdateUserProfileStrategy implements AsyncStrategy<UserOperationInput, CommandResult> {
  async execute(input: UserOperationInput): Promise<CommandResult> {
    try {
      // Validate update data
      const updateData = input.data as UpdateUserDto;
      if (!updateData || Object.keys(updateData).length === 0) {
        return CommandResult.failure('No update data provided');
      }

      // Check if user exists and is active
      const existingUser = await User.findOne({ 
        _id: input.userId, 
        isDeleted: { $ne: true } 
      });

      if (!existingUser) {
        return CommandResult.failure('User not found');
      }

      // Validate permissions (user can only update their own profile unless admin)
      if (input.requesterId && input.requesterId !== input.userId) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Insufficient permissions to update user profile');
        }
      }

      // Update user profile
      const updatedUser = await User.findByIdAndUpdate(
        input.userId,
        { 
          ...updateData, 
          updatedAt: new Date(),
          ...(input.metadata && { metadata: input.metadata })
        },
        { new: true, runValidators: true }
      ).select('-password');

      return CommandResult.success(updatedUser, 'User profile updated successfully');
    } catch (error) {
      return CommandResult.failure('Failed to update user profile', [error.message]);
    }
  }
}

class DeleteUserAccountStrategy implements AsyncStrategy<UserOperationInput, CommandResult> {
  async execute(input: UserOperationInput): Promise<CommandResult> {
    try {
      const user = await User.findById(input.userId);
      if (!user) {
        return CommandResult.failure('User not found');
      }

      // Validate permissions
      if (input.requesterId && input.requesterId !== input.userId) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Insufficient permissions to delete user account');
        }
      }

      // Soft delete user account
      await User.findByIdAndUpdate(input.userId, {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedBy: input.requesterId || input.userId
      });

      return CommandResult.success(
        { userId: input.userId, deleted: true },
        'User account deleted successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to delete user account', [error.message]);
    }
  }
}

class UpdateUserStatusStrategy implements AsyncStrategy<UserOperationInput, CommandResult> {
  async execute(input: UserOperationInput): Promise<CommandResult> {
    try {
      // Validate admin permissions
      if (input.requesterId) {
        const requester = await User.findById(input.requesterId);
        const roleCheck = ConditionalHelpers.validateUserRole(requester, {
          allowedRoles: ['admin', 'super_admin'],
          requireActive: true
        });

        if (!roleCheck.isValid) {
          return CommandResult.failure('Insufficient permissions to update user status');
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        input.userId,
        { 
          isActive: input.data.status === 'active',
          status: input.data.status,
          updatedAt: new Date(),
          updatedBy: input.requesterId
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return CommandResult.failure('User not found');
      }

      return CommandResult.success(updatedUser, 'User status updated successfully');
    } catch (error) {
      return CommandResult.failure('Failed to update user status', [error.message]);
    }
  }
}

// User search strategies
class SearchUsersStrategy implements AsyncStrategy<UserSearchInput, CommandResult> {
  async execute(input: UserSearchInput): Promise<CommandResult> {
    try {
      const { filters } = input;
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 10, 100); // Cap at 100
      const skip = (page - 1) * limit;

      // Build search criteria
      const matchCriteria: any = { isDeleted: { $ne: true } };
      
      if (!input.includeInactive) {
        matchCriteria.isActive = true;
      }

      if (filters.name) {
        matchCriteria.$or = [
          { 'name.first': { $regex: filters.name, $options: 'i' } },
          { 'name.last': { $regex: filters.name, $options: 'i' } },
          { email: { $regex: filters.name, $options: 'i' } }
        ];
      }

      if (filters.role) {
        matchCriteria.role = filters.role;
      }

      if (filters.location) {
        matchCriteria.location = {
          $near: {
            $geometry: filters.location,
            $maxDistance: filters.radius || 10000 // 10km default
          }
        };
      }

      // Build aggregation pipeline
      const aggregation = AggregationBuilder.create()
        .match(matchCriteria)
        .lookup('reviews', 'userId', '_id', 'reviews')
        .addFields({
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $size: '$reviews' }
        })
        .project({
          password: 0,
          email: 1,
          name: 1,
          phone: 1,
          location: 1,
          isActive: 1,
          role: 1,
          profileImage: 1,
          averageRating: 1,
          totalReviews: 1,
          createdAt: 1
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const [users, totalCount] = await Promise.all([
        aggregation.execute(User),
        User.countDocuments(matchCriteria)
      ]);

      const result = {
        data: users,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };

      return CommandResult.success(result, 'Users retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to search users', [error.message]);
    }
  }
}

// User location strategies
class UpdateUserLocationStrategy implements AsyncStrategy<UserLocationInput, CommandResult> {
  async execute(input: UserLocationInput): Promise<CommandResult> {
    try {
      if (!input.location) {
        return CommandResult.failure('Location data is required');
      }

      const updatedUser = await User.findByIdAndUpdate(
        input.userId,
        { 
          location: input.location,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return CommandResult.failure('User not found');
      }

      return CommandResult.success(updatedUser, 'User location updated successfully');
    } catch (error) {
      return CommandResult.failure('Failed to update user location', [error.message]);
    }
  }
}

class GetUsersByLocationStrategy implements AsyncStrategy<UserLocationInput, CommandResult> {
  async execute(input: UserLocationInput): Promise<CommandResult> {
    try {
      if (!input.coordinates) {
        return CommandResult.failure('Coordinates are required');
      }

      const radius = input.radius || 10000; // 10km default

      const aggregation = AggregationBuilder.create()
        .match({
          isDeleted: { $ne: true },
          isActive: true,
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: input.coordinates
              },
              $maxDistance: radius
            }
          }
        })
        .lookup('reviews', 'userId', '_id', 'reviews')
        .addFields({
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $size: '$reviews' },
          distance: {
            $multiply: [
              {
                $acos: {
                  $add: [
                    {
                      $multiply: [
                        { $sin: { $degreesToRadians: { $arrayElemAt: ['$location.coordinates', 1] } } },
                        { $sin: { $degreesToRadians: input.coordinates[1] } }
                      ]
                    },
                    {
                      $multiply: [
                        { $cos: { $degreesToRadians: { $arrayElemAt: ['$location.coordinates', 1] } } },
                        { $cos: { $degreesToRadians: input.coordinates[1] } },
                        { $cos: { $degreesToRadians: { $subtract: [{ $arrayElemAt: ['$location.coordinates', 0] }, input.coordinates[0]] } } }
                      ]
                    }
                  ]
                }
              },
              6371000 // Earth's radius in meters
            ]
          }
        })
        .project({
          password: 0,
          email: 1,
          name: 1,
          location: 1,
          profileImage: 1,
          averageRating: 1,
          totalReviews: 1,
          distance: 1
        })
        .sort({ distance: 1 });

      const users = await aggregation.execute(User);

      return CommandResult.success(users, 'Users by location retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to get users by location', [error.message]);
    }
  }
}

// User statistics strategies
class GetUserStatisticsStrategy implements AsyncStrategy<UserStatisticsInput, CommandResult> {
  async execute(input: UserStatisticsInput): Promise<CommandResult> {
    try {
      const dateRange = input.dateRange || {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date()
      };

      const [
        userStats,
        reviewStats,
        serviceRequestStats
      ] = await Promise.all([
        // User basic stats
        AggregationBuilder.create()
          .match({ _id: input.userId })
          .lookup('reviews', 'userId', '_id', 'reviews')
          .lookup('serviceRequests', 'userId', '_id', 'serviceRequests')
          .addFields({
            totalReviews: { $size: '$reviews' },
            averageRating: { $avg: '$reviews.rating' },
            totalServiceRequests: { $size: '$serviceRequests' },
            completedRequests: {
              $size: {
                $filter: {
                  input: '$serviceRequests',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              }
            }
          })
          .project({
            totalReviews: 1,
            averageRating: 1,
            totalServiceRequests: 1,
            completedRequests: 1,
            completionRate: {
              $cond: {
                if: { $gt: ['$totalServiceRequests', 0] },
                then: { $divide: ['$completedRequests', '$totalServiceRequests'] },
                else: 0
              }
            }
          })
          .execute(User),

        // Review statistics
        AggregationBuilder.create()
          .match({
            userId: input.userId,
            createdAt: { $gte: dateRange.from, $lte: dateRange.to }
          })
          .group({
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            ratingDistribution: {
              $push: '$rating'
            }
          })
          .execute(Review),

        // Service request statistics
        AggregationBuilder.create()
          .match({
            userId: input.userId,
            createdAt: { $gte: dateRange.from, $lte: dateRange.to }
          })
          .group({
            _id: '$status',
            count: { $sum: 1 }
          })
          .execute(ServiceRequest)
      ]);

      const statistics = {
        user: userStats[0] || {},
        reviews: reviewStats[0] || { totalReviews: 0, averageRating: 0 },
        serviceRequests: serviceRequestStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        dateRange
      };

      return CommandResult.success(statistics, 'User statistics retrieved successfully');
    } catch (error) {
      return CommandResult.failure('Failed to get user statistics', [error.message]);
    }
  }
}

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 8
})
export class UserServiceStrategy implements IUserService {
  private userOperationRegistry: AsyncStrategyRegistry<UserOperationInput, CommandResult>;
  private userSearchRegistry: AsyncStrategyRegistry<UserSearchInput, CommandResult>;
  private userLocationRegistry: AsyncStrategyRegistry<UserLocationInput, CommandResult>;
  private userStatisticsRegistry: AsyncStrategyRegistry<UserStatisticsInput, CommandResult>;

  constructor(
    @Inject('ReviewService') private reviewService?: IReviewService,
    @Inject('ServiceRequestService') private serviceRequestService?: IServiceRequestService
  ) {
    this.initializeStrategies();
  }

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('👤 Strategy-based UserService initialized with optimized patterns');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('👤 Strategy-based UserService cleanup completed');
  }

  /**
   * Initialize all strategy registries
   */
  private initializeStrategies(): void {
    // User operation strategies
    this.userOperationRegistry = new AsyncStrategyRegistry<UserOperationInput, CommandResult>();
    this.userOperationRegistry.register('getUserById', new GetUserByIdStrategy());
    this.userOperationRegistry.register('updateProfile', new UpdateUserProfileStrategy());
    this.userOperationRegistry.register('deleteAccount', new DeleteUserAccountStrategy());
    this.userOperationRegistry.register('updateStatus', new UpdateUserStatusStrategy());

    // User search strategies
    this.userSearchRegistry = new AsyncStrategyRegistry<UserSearchInput, CommandResult>();
    this.userSearchRegistry.register('searchUsers', new SearchUsersStrategy());

    // User location strategies
    this.userLocationRegistry = new AsyncStrategyRegistry<UserLocationInput, CommandResult>();
    this.userLocationRegistry.register('updateLocation', new UpdateUserLocationStrategy());
    this.userLocationRegistry.register('getUsersByLocation', new GetUsersByLocationStrategy());

    // User statistics strategies
    this.userStatisticsRegistry = new AsyncStrategyRegistry<UserStatisticsInput, CommandResult>();
    this.userStatisticsRegistry.register('getUserStatistics', new GetUserStatisticsStrategy());
  }

  /**
   * Get user by ID with optimized aggregation
   */
  @Log({
    message: 'Getting user by ID with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  })
  async getUserById(userId: string, includePassword?: boolean): Promise<any> {
    const input: UserOperationInput = {
      userId,
      data: { includePassword }
    };

    const result = await this.userOperationRegistry.execute('getUserById', input);
    
    if (!result.success) {
      throw new NotFoundError(result.message);
    }

    return result.data;
  }

  /**
   * Update user profile with strategy pattern
   */
  @Log({
    message: 'Updating user profile with strategy pattern',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'linear'
  })
  async updateUserProfile(userId: string, updateData: UpdateUserDto): Promise<ApiResponseDto> {
    const input: UserOperationInput = {
      userId,
      data: updateData,
      metadata: { timestamp: new Date(), operation: 'updateProfile' }
    };

    const result = await this.userOperationRegistry.execute('updateProfile', input);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  /**
   * Delete user account with strategy pattern
   */
  @Log({
    message: 'Deleting user account with strategy pattern',
    includeExecutionTime: true
  })
  async deleteUserAccount(userId: string): Promise<ApiResponseDto> {
    const input: UserOperationInput = {
      userId,
      metadata: { timestamp: new Date(), operation: 'deleteAccount' }
    };

    const result = await this.userOperationRegistry.execute('deleteAccount', input);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  /**
   * Search users with optimized aggregation
   */
  @Log({
    message: 'Searching users with strategy pattern and aggregation',
    includeExecutionTime: true
  })
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async searchUsers(filters: UserFiltersDto): Promise<PaginatedResponseDto<any>> {
    const input: UserSearchInput = { filters };
    const result = await this.userSearchRegistry.execute('searchUsers', input);
    
    if (!result.success) {
      throw new ValidationError(result.message);
    }

    return result.data;
  }

  /**
   * Get user's service requests by delegating to ServiceRequestService
   */
  @Log({
    message: 'Getting user service requests',
    includeExecutionTime: true
  })
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  async getUserServiceRequests(userId: string, status?: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>> {
    if (this.serviceRequestService) {
      return await this.serviceRequestService.getServiceRequestsByUser(userId, { status, page, limit });
    }
    
    // Fallback aggregation if service not available
    const aggregation = AggregationBuilder.create()
      .match({ 
        userId, 
        ...(status && { status }),
        isDeleted: { $ne: true }
      })
      .lookup('users', 'providerId', '_id', 'provider')
      .sort({ createdAt: -1 })
      .skip(((page || 1) - 1) * (limit || 10))
      .limit(limit || 10);

    const requests = await aggregation.execute(ServiceRequest);
    const total = await ServiceRequest.countDocuments({ userId, ...(status && { status }) });

    return {
      data: requests,
      pagination: {
        page: page || 1,
        limit: limit || 10,
        total,
        pages: Math.ceil(total / (limit || 10))
      }
    };
  }

  /**
   * Get user's reviews by delegating to ReviewService
   */
  @Log({
    message: 'Getting user reviews',
    includeExecutionTime: true
  })
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  async getUserReviews(userId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>> {
    if (this.reviewService) {
      return await this.reviewService.getReviewsByUser(userId, page, limit);
    }
    
    // Fallback aggregation if service not available
    const aggregation = AggregationBuilder.create()
      .match({ userId, isDeleted: { $ne: true } })
      .lookup('serviceRequests', 'serviceRequestId', '_id', 'serviceRequest')
      .lookup('users', 'providerId', '_id', 'provider')
      .sort({ createdAt: -1 })
      .skip(((page || 1) - 1) * (limit || 10))
      .limit(limit || 10);

    const reviews = await aggregation.execute(Review);
    const total = await Review.countDocuments({ userId });

    return {
      data: reviews,
      pagination: {
        page: page || 1,
        limit: limit || 10,
        total,
        pages: Math.ceil(total / (limit || 10))
      }
    };
  }

  /**
   * Upload user profile image
   */
  @Log({
    message: 'Uploading user profile image',
    includeExecutionTime: true
  })
  async uploadProfileImage(userId: string, imageUrl: string): Promise<ApiResponseDto> {
    const input: UserOperationInput = {
      userId,
      data: { profileImage: imageUrl },
      metadata: { timestamp: new Date(), operation: 'uploadProfileImage' }
    };

    const result = await this.userOperationRegistry.execute('updateProfile', input);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  /**
   * Get user statistics with strategy pattern
   */
  @Log({
    message: 'Getting user statistics with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getUserStatistics(userId: string): Promise<any> {
    const input: UserStatisticsInput = { userId };
    const result = await this.userStatisticsRegistry.execute('getUserStatistics', input);
    
    if (!result.success) {
      throw new ValidationError(result.message);
    }

    return result.data;
  }

  /**
   * Update user location with strategy pattern
   */
  @Log({
    message: 'Updating user location with strategy pattern',
    includeExecutionTime: true
  })
  async updateUserLocation(userId: string, location: { type: 'Point'; coordinates: [number, number] }): Promise<ApiResponseDto> {
    const input: UserLocationInput = { userId, location };
    const result = await this.userLocationRegistry.execute('updateLocation', input);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  /**
   * Get users by location with strategy pattern
   */
  @Log({
    message: 'Getting users by location with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getUsersByLocation(coordinates: [number, number], radius: number): Promise<any[]> {
    const input: UserLocationInput = { coordinates, radius };
    const result = await this.userLocationRegistry.execute('getUsersByLocation', input);
    
    if (!result.success) {
      throw new ValidationError(result.message);
    }

    return result.data;
  }

  /**
   * Update user status (admin function)
   */
  @Log({
    message: 'Updating user status with strategy pattern',
    includeExecutionTime: true
  })
  async updateUserStatus(userId: string, status: string): Promise<ApiResponseDto> {
    const input: UserOperationInput = {
      userId,
      data: { status },
      metadata: { timestamp: new Date(), operation: 'updateStatus' }
    };

    const result = await this.userOperationRegistry.execute('updateStatus', input);
    
    return {
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors
    };
  }

  /**
   * Get all users (admin function)
   */
  @Log({
    message: 'Getting all users with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async getAllUsers(filters: UserFiltersDto): Promise<PaginatedResponseDto<any>> {
    const input: UserSearchInput = { filters, includeInactive: true };
    const result = await this.userSearchRegistry.execute('searchUsers', input);
    
    if (!result.success) {
      throw new ValidationError(result.message);
    }

    return result.data;
  }
}

