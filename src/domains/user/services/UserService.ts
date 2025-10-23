/**
 * Strategy-Based UserService Implementation
 * 
 * Enhanced UserService using Strategy Patterns and AggregationBuilder
 * for optimized performance and maintainable conditional logic.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { User } from '../../../models/User';
import { ServiceRequest } from '../../../models/ServiceRequest';
import { Review } from '../../../models/Review';
import { NotFoundError, ValidationError, AuthenticationError } from '../../common/middleware/errorHandler';
import { IUserService, IReviewService, IServiceRequestService } from '../../common/interfaces/services/index';
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

// Import strategy implementations
import {
  GetUserByIdStrategy,
  UpdateUserProfileStrategy,
  DeleteUserAccountStrategy,
  UpdateUserStatusStrategy,
  SearchUsersStrategy,
  UpdateUserLocationStrategy,
  GetUsersByLocationStrategy,
  GetUserStatisticsStrategy
} from '../../strategy/user/UserStrategies';

// Import strategy interfaces
import {
  UserOperationInput,
  UserSearchInput,
  UserLocationInput,
  UserStatisticsInput
} from '../../strategy/interfaces/ServiceStrategy';

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
