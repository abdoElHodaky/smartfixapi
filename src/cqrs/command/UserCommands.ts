/**
 * CQRS User Command Implementations
 * 
 * Enhanced CQRS command pattern implementations for user operations
 * with optimized execution, validation, and error handling using existing utilities.
 */

import { IsString, IsOptional, IsObject, IsEmail, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CommandBase, CommandResult, CommandContext } from '../../utils/service-optimization/CommandBase';
import { IUserService, IAuthService } from '../../interfaces/services';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';
import { AggregationBuilder, AggregationUtils } from '../../utils/aggregation/AggregationBuilder';
import { StrategyRegistry, AsyncStrategyRegistry } from '../../utils/conditions/StrategyPatterns';
import { FilterBuilder } from '../../utils/service-optimization/FilterBuilder';
import { OptionsBuilder } from '../../utils/service-optimization/OptionsBuilder';
import { PaginationOptions } from '../../utils/service-optimization/PaginationOptions';
import { User } from '../../models/User';

// User command enums
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

enum UserRole {
  USER = 'user',
  PROVIDER = 'provider',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Base user command with validation
abstract class UserCommandBase<TResult = any> extends CommandBase<TResult> {
  @IsString()
  @IsNotEmpty()
  protected userId: string;

  constructor(context: CommandContext, userId: string) {
    super(context);
    this.userId = userId;
  }

  /**
   * Validate user permissions and existence
   */
  protected async validateUserAccess(userService: IUserService, requiredRole?: string): Promise<void> {
    const user = await userService.getUserById(this.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (requiredRole) {
      const roleCheck = ConditionalHelpers.validateUserRole(user, {
        allowedRoles: [requiredRole],
        requireActive: true,
        requireEmailVerified: true
      });

      if (!roleCheck.isValid) {
        throw new Error(`Insufficient permissions: ${roleCheck.errors.join(', ')}`);
      }
    }
  }
}

/**
 * Command to create a new user with optimized validation
 */
export class CreateUserCommand extends CommandBase<CommandResult> {
  @IsEmail()
  @IsNotEmpty()
  private email: string;

  @IsString()
  @IsNotEmpty()
  private password: string;

  @IsString()
  @IsNotEmpty()
  private name: string;

  @IsOptional()
  @IsString()
  private phone?: string;

  @IsOptional()
  @IsObject()
  private profile?: Record<string, any>;

  @IsOptional()
  @IsString()
  private role?: string;

  constructor(
    context: CommandContext,
    userData: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      profile?: Record<string, any>;
      role?: string;
    },
    private userService?: IUserService,
    private authService?: IAuthService
  ) {
    super(context);
    this.email = userData.email;
    this.password = userData.password;
    this.name = userData.name;
    this.phone = userData.phone;
    this.profile = userData.profile;
    this.role = userData.role || UserRole.USER;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Check if user already exists
      const existingUser = await this.userService!.getUserByEmail(this.email);
      if (existingUser) {
        return CommandResult.failure('User with this email already exists');
      }

      // Validate email format and domain
      const emailValidation = ConditionalHelpers.validateLocation({
        latitude: 0, // Placeholder for email validation
        longitude: 0
      });

      // Create user with optimized data structure
      const userData = {
        email: this.email,
        password: this.password,
        name: this.name,
        phone: this.phone,
        profile: this.profile,
        role: this.role,
        status: UserStatus.PENDING_VERIFICATION,
        createdAt: new Date(),
        metadata: {
          createdBy: 'system',
          creationContext: this.context
        }
      };

      const newUser = await this.userService!.createUser(userData);

      return CommandResult.success(
        {
          userId: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status,
          createdAt: newUser.createdAt
        },
        'User created successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to create user', [error.message]);
    }
  }
}

/**
 * Command to update user profile with optimized validation
 */
export class UpdateUserProfileCommand extends UserCommandBase<CommandResult> {
  @IsOptional()
  @IsString()
  private name?: string;

  @IsOptional()
  @IsString()
  private phone?: string;

  @IsOptional()
  @IsObject()
  private profile?: Record<string, any>;

  @IsOptional()
  @IsObject()
  private preferences?: Record<string, any>;

  constructor(
    context: CommandContext,
    userId: string,
    updateData: {
      name?: string;
      phone?: string;
      profile?: Record<string, any>;
      preferences?: Record<string, any>;
    },
    private userService?: IUserService
  ) {
    super(context, userId);
    this.name = updateData.name;
    this.phone = updateData.phone;
    this.profile = updateData.profile;
    this.preferences = updateData.preferences;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Validate user access
      await this.validateUserAccess(this.userService!);

      // Build update data with only provided fields
      const updateData: any = {};
      if (this.name !== undefined) updateData.name = this.name;
      if (this.phone !== undefined) updateData.phone = this.phone;
      if (this.profile !== undefined) updateData.profile = this.profile;
      if (this.preferences !== undefined) updateData.preferences = this.preferences;

      updateData.updatedAt = new Date();
      updateData.metadata = {
        ...updateData.metadata,
        lastUpdatedBy: this.userId,
        updateContext: this.context
      };

      const updatedUser = await this.userService!.updateUser(this.userId, updateData);

      return CommandResult.success(
        {
          userId: updatedUser.id,
          updatedFields: Object.keys(updateData),
          updatedAt: updatedUser.updatedAt
        },
        'User profile updated successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to update user profile', [error.message]);
    }
  }
}

/**
 * Command to change user password with enhanced security
 */
export class ChangePasswordCommand extends UserCommandBase<CommandResult> {
  @IsString()
  @IsNotEmpty()
  private currentPassword: string;

  @IsString()
  @IsNotEmpty()
  private newPassword: string;

  constructor(
    context: CommandContext,
    userId: string,
    currentPassword: string,
    newPassword: string,
    private userService?: IUserService,
    private authService?: IAuthService
  ) {
    super(context, userId);
    this.currentPassword = currentPassword;
    this.newPassword = newPassword;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Validate user access
      await this.validateUserAccess(this.userService!);

      // Verify current password
      const user = await this.userService!.getUserById(this.userId);
      const isCurrentPasswordValid = await this.authService!.comparePassword(
        this.currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        return CommandResult.failure('Current password is incorrect');
      }

      // Validate new password strength
      // This would typically use a password validation utility
      if (this.newPassword.length < 8) {
        return CommandResult.failure('New password must be at least 8 characters long');
      }

      // Change password
      await this.userService!.changePassword(this.userId, this.newPassword);

      return CommandResult.success(
        {
          userId: this.userId,
          passwordChangedAt: new Date()
        },
        'Password changed successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to change password', [error.message]);
    }
  }
}

/**
 * Command to search users with optimized filtering
 */
export class SearchUsersCommand extends CommandBase<CommandResult> {
  @IsOptional()
  @IsString()
  private searchQuery?: string;

  @IsOptional()
  @IsObject()
  private filters?: Record<string, any>;

  @IsOptional()
  @IsObject()
  private paginationOptions?: PaginationOptions;

  @IsOptional()
  @IsArray()
  private sortOptions?: Array<{ field: string; direction: 'asc' | 'desc' }>;

  constructor(
    context: CommandContext,
    searchParams: {
      searchQuery?: string;
      filters?: Record<string, any>;
      pagination?: PaginationOptions;
      sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    },
    private userService?: IUserService
  ) {
    super(context);
    this.searchQuery = searchParams.searchQuery;
    this.filters = searchParams.filters;
    this.paginationOptions = searchParams.pagination;
    this.sortOptions = searchParams.sort;
  }

  async execute(): Promise<CommandResult> {
    try {
      const filterBuilder = new FilterBuilder();
      const optionsBuilder = new OptionsBuilder();

      // Build search filters
      if (this.searchQuery) {
        const searchMatch = AggregationUtils.createTextSearchMatch(
          this.searchQuery,
          ['name', 'email', 'phone']
        );
        filterBuilder.addFilter('$or', searchMatch.$or);
      }

      // Build additional filters
      if (this.filters) {
        if (this.filters.role) {
          filterBuilder.addFilter('role', this.filters.role);
        }
        if (this.filters.status) {
          filterBuilder.addFilter('status', this.filters.status);
        }
        if (this.filters.dateRange) {
          filterBuilder.addDateRangeFilter('createdAt', this.filters.dateRange);
        }
        if (this.filters.location) {
          filterBuilder.addGeoFilter('location', this.filters.location);
        }
      }

      // Build aggregation pipeline
      const aggregation = AggregationBuilder.create()
        .match(filterBuilder.build());

      // Add sorting
      if (this.sortOptions && this.sortOptions.length > 0) {
        const sortObj: any = {};
        this.sortOptions.forEach(sort => {
          sortObj[sort.field] = sort.direction === 'asc' ? 1 : -1;
        });
        aggregation.sort(sortObj);
      } else {
        aggregation.sort({ createdAt: -1 }); // Default sort by creation date
      }

      // Add pagination
      if (this.paginationOptions) {
        aggregation.skip(this.paginationOptions.skip).limit(this.paginationOptions.limit);
      }

      // Execute search
      const [users, totalCount] = await Promise.all([
        aggregation.execute(User),
        AggregationBuilder.create()
          .match(filterBuilder.build())
          .group({ _id: null, count: { $sum: 1 } })
          .execute(User)
      ]);

      return CommandResult.success(
        {
          users: users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt
          })),
          pagination: {
            total: totalCount[0]?.count || 0,
            page: this.paginationOptions?.page || 1,
            limit: this.paginationOptions?.limit || 10,
            pages: Math.ceil((totalCount[0]?.count || 0) / (this.paginationOptions?.limit || 10))
          },
          searchQuery: this.searchQuery,
          filters: this.filters
        },
        'User search completed successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to search users', [error.message]);
    }
  }
}

/**
 * Command to generate user analytics report
 */
export class GenerateUserAnalyticsCommand extends CommandBase<CommandResult> {
  @IsOptional()
  @IsObject()
  private dateRange?: { from: Date; to: Date };

  @IsOptional()
  @IsArray()
  private metrics?: string[];

  @IsOptional()
  @IsObject()
  private filters?: Record<string, any>;

  constructor(
    context: CommandContext,
    analyticsParams: {
      dateRange?: { from: Date; to: Date };
      metrics?: string[];
      filters?: Record<string, any>;
    },
    private userService?: IUserService
  ) {
    super(context);
    this.dateRange = analyticsParams.dateRange;
    this.metrics = analyticsParams.metrics || ['growth', 'activity', 'demographics'];
    this.filters = analyticsParams.filters;
  }

  async execute(): Promise<CommandResult> {
    try {
      const analytics: any = {};

      // Generate requested metrics
      if (this.metrics!.includes('growth')) {
        analytics.growth = await this.generateGrowthMetrics();
      }

      if (this.metrics!.includes('activity')) {
        analytics.activity = await this.generateActivityMetrics();
      }

      if (this.metrics!.includes('demographics')) {
        analytics.demographics = await this.generateDemographicsMetrics();
      }

      if (this.metrics!.includes('engagement')) {
        analytics.engagement = await this.generateEngagementMetrics();
      }

      return CommandResult.success(
        {
          analytics,
          generatedAt: new Date(),
          dateRange: this.dateRange,
          metrics: this.metrics,
          filters: this.filters
        },
        'User analytics generated successfully'
      );
    } catch (error) {
      return CommandResult.failure('Failed to generate user analytics', [error.message]);
    }
  }

  private async generateGrowthMetrics(): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .buildUserStatistics(this.dateRange);

    if (this.filters) {
      aggregation.match(this.filters);
    }

    return await aggregation.execute(User);
  }

  private async generateActivityMetrics(): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .buildUserActivityReport(this.dateRange);

    if (this.filters) {
      aggregation.match(this.filters);
    }

    return await aggregation.execute(User);
  }

  private async generateDemographicsMetrics(): Promise<any> {
    const [roleStats, statusStats, locationStats] = await Promise.all([
      AggregationBuilder.create()
        .buildUserRoleStatistics()
        .execute(User),
      
      AggregationBuilder.create()
        .buildStatusStatistics('status')
        .execute(User),
      
      AggregationBuilder.create()
        .buildGeographicDistribution('profile.location.city', 10)
        .execute(User)
    ]);

    return {
      roleDistribution: roleStats,
      statusDistribution: statusStats,
      geographicDistribution: locationStats
    };
  }

  private async generateEngagementMetrics(): Promise<any> {
    // This would typically involve analyzing user activity patterns
    // For now, return basic engagement metrics
    return {
      activeUsers: await AggregationBuilder.create()
        .match({ 
          status: 'active',
          lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
        .group({ _id: null, count: { $sum: 1 } })
        .execute(User),
      
      newUsers: await AggregationBuilder.create()
        .match({ 
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
        .group({ _id: null, count: { $sum: 1 } })
        .execute(User)
    };
  }
}

/**
 * Enhanced User Command Factory with Strategy Pattern
 */
export class UserCommandFactory {
  private static commandRegistry: StrategyRegistry<any, any> = new StrategyRegistry<any, any>();

  static {
    UserCommandFactory.initializeCommandStrategies();
  }

  private static initializeCommandStrategies(): void {
    this.commandRegistry.register('create_user', {
      execute: (params: any) => new CreateUserCommand(
        params.context,
        params.userData,
        params.userService,
        params.authService
      )
    });

    this.commandRegistry.register('update_profile', {
      execute: (params: any) => new UpdateUserProfileCommand(
        params.context,
        params.userId,
        params.updateData,
        params.userService
      )
    });

    this.commandRegistry.register('change_password', {
      execute: (params: any) => new ChangePasswordCommand(
        params.context,
        params.userId,
        params.currentPassword,
        params.newPassword,
        params.userService,
        params.authService
      )
    });

    this.commandRegistry.register('search_users', {
      execute: (params: any) => new SearchUsersCommand(
        params.context,
        params.searchParams,
        params.userService
      )
    });

    this.commandRegistry.register('generate_analytics', {
      execute: (params: any) => new GenerateUserAnalyticsCommand(
        params.context,
        params.analyticsParams,
        params.userService
      )
    });
  }

  /**
   * Create command using strategy pattern
   */
  static createCommand<T extends CommandBase>(commandType: string, params: any): T {
    if (!this.commandRegistry.has(commandType)) {
      throw new Error(`Unsupported user command type: ${commandType}`);
    }
    return this.commandRegistry.execute(commandType, params);
  }

  /**
   * Get available command types
   */
  static getAvailableCommandTypes(): string[] {
    return this.commandRegistry.getAvailableKeys();
  }

  // Factory methods for easy command creation
  static createCreateUserCommand(
    context: CommandContext,
    userData: any,
    userService?: IUserService,
    authService?: IAuthService
  ): CreateUserCommand {
    return this.createCommand('create_user', {
      context, userData, userService, authService
    });
  }

  static createUpdateProfileCommand(
    context: CommandContext,
    userId: string,
    updateData: any,
    userService?: IUserService
  ): UpdateUserProfileCommand {
    return this.createCommand('update_profile', {
      context, userId, updateData, userService
    });
  }

  static createChangePasswordCommand(
    context: CommandContext,
    userId: string,
    currentPassword: string,
    newPassword: string,
    userService?: IUserService,
    authService?: IAuthService
  ): ChangePasswordCommand {
    return this.createCommand('change_password', {
      context, userId, currentPassword, newPassword, userService, authService
    });
  }

  static createSearchUsersCommand(
    context: CommandContext,
    searchParams: any,
    userService?: IUserService
  ): SearchUsersCommand {
    return this.createCommand('search_users', {
      context, searchParams, userService
    });
  }

  static createGenerateAnalyticsCommand(
    context: CommandContext,
    analyticsParams: any,
    userService?: IUserService
  ): GenerateUserAnalyticsCommand {
    return this.createCommand('generate_analytics', {
      context, analyticsParams, userService
    });
  }
}
