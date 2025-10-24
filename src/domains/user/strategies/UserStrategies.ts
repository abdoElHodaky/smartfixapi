/**
 * User Service Strategy Implementations
 * 
 * Strategy classes for user operations extracted from UserService
 */

import { AsyncStrategy } from '../../../utils/conditions/StrategyPatterns';
import { CommandResult } from '../../../utils/service-optimization/CommandBase';
import { AggregationBuilder } from '../../../utils/aggregation/AggregationBuilder';
import { ConditionalHelpers } from '../../../utils/conditions/ConditionalHelpers';
import { User } from '../../../models/User';
import { ServiceRequest } from '../../../models/ServiceRequest';
import { Review } from '../../../models/Review';
import { UserOperationInput, UserSearchInput, UserLocationInput, UserStatisticsInput } from '../interfaces/ServiceStrategy';
import { StatisticsOperationInput } from '../interfaces/BaseStrategy';

// User operation strategies
export class GetUserByIdStrategy implements AsyncStrategy<UserOperationInput, CommandResult> {
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
          password: input.includePassword ? 1 : 0,
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

export class UpdateUserProfileStrategy implements AsyncStrategy<UserOperationInput, CommandResult> {
  async execute(input: UserOperationInput): Promise<CommandResult> {
    try {
      if (!input.data || Object.keys(input.data).length === 0) {
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
          ...input.data, 
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

export class DeleteUserAccountStrategy implements AsyncStrategy<UserOperationInput, CommandResult> {
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

export class UpdateUserStatusStrategy implements AsyncStrategy<UserOperationInput, CommandResult> {
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
export class SearchUsersStrategy implements AsyncStrategy<UserSearchInput, CommandResult> {
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
export class UpdateUserLocationStrategy implements AsyncStrategy<UserLocationInput, CommandResult> {
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

export class GetUsersByLocationStrategy implements AsyncStrategy<UserLocationInput, CommandResult> {
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
export class GetUserStatisticsStrategy implements AsyncStrategy<UserStatisticsInput, CommandResult> {
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
          .match({ _id: input.entityId })
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
            userId: input.entityId,
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
            userId: input.entityId,
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
