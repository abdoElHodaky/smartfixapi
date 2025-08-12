/**
 * User Management Command DTOs
 * 
 * Structured DTOs for user management operations to replace
 * complex method signatures with well-defined command objects.
 */

import { IsString, IsOptional, IsObject, IsEnum, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * User management action types
 */
export enum UserManagementAction {
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  SUSPEND = 'suspend',
  DELETE = 'delete',
  UPDATE_ROLE = 'update_role',
  RESET_PASSWORD = 'reset_password',
  VERIFY_EMAIL = 'verify_email',
  UPDATE_PROFILE = 'update_profile'
}

/**
 * User suspension data
 */
export class UserSuspensionData {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  duration?: string; // e.g., '30d', '1y', 'permanent'

  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean = true;
}

/**
 * User role update data
 */
export class UserRoleUpdateData {
  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean = true;
}

/**
 * User profile update data
 */
export class UserProfileUpdateData {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsObject()
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}

/**
 * Main user management command DTO
 */
export class UserManagementCommand {
  @IsString()
  adminId: string;

  @IsString()
  userId: string;

  @IsEnum(UserManagementAction)
  action: UserManagementAction;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  data?: UserSuspensionData | UserRoleUpdateData | UserProfileUpdateData | Record<string, any>;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean = true;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  constructor(
    adminId: string,
    userId: string,
    action: UserManagementAction,
    data?: any,
    options?: {
      reason?: string;
      notifyUser?: boolean;
      metadata?: Record<string, any>;
    }
  ) {
    this.adminId = adminId;
    this.userId = userId;
    this.action = action;
    this.data = data;
    this.reason = options?.reason;
    this.notifyUser = options?.notifyUser ?? true;
    this.metadata = options?.metadata;
  }

  /**
   * Create a user activation command
   */
  static activate(adminId: string, userId: string, reason?: string): UserManagementCommand {
    return new UserManagementCommand(adminId, userId, UserManagementAction.ACTIVATE, undefined, { reason });
  }

  /**
   * Create a user deactivation command
   */
  static deactivate(adminId: string, userId: string, reason?: string): UserManagementCommand {
    return new UserManagementCommand(adminId, userId, UserManagementAction.DEACTIVATE, undefined, { reason });
  }

  /**
   * Create a user suspension command
   */
  static suspend(
    adminId: string,
    userId: string,
    suspensionData: UserSuspensionData
  ): UserManagementCommand {
    return new UserManagementCommand(adminId, userId, UserManagementAction.SUSPEND, suspensionData);
  }

  /**
   * Create a user deletion command
   */
  static delete(adminId: string, userId: string, reason?: string): UserManagementCommand {
    return new UserManagementCommand(adminId, userId, UserManagementAction.DELETE, undefined, { reason });
  }

  /**
   * Create a role update command
   */
  static updateRole(
    adminId: string,
    userId: string,
    roleData: UserRoleUpdateData
  ): UserManagementCommand {
    return new UserManagementCommand(adminId, userId, UserManagementAction.UPDATE_ROLE, roleData);
  }

  /**
   * Create a password reset command
   */
  static resetPassword(adminId: string, userId: string, notifyUser: boolean = true): UserManagementCommand {
    return new UserManagementCommand(adminId, userId, UserManagementAction.RESET_PASSWORD, undefined, { notifyUser });
  }

  /**
   * Create an email verification command
   */
  static verifyEmail(adminId: string, userId: string): UserManagementCommand {
    return new UserManagementCommand(adminId, userId, UserManagementAction.VERIFY_EMAIL);
  }

  /**
   * Create a profile update command
   */
  static updateProfile(
    adminId: string,
    userId: string,
    profileData: UserProfileUpdateData
  ): UserManagementCommand {
    return new UserManagementCommand(adminId, userId, UserManagementAction.UPDATE_PROFILE, profileData);
  }

  /**
   * Check if the command requires additional data
   */
  requiresData(): boolean {
    return [
      UserManagementAction.SUSPEND,
      UserManagementAction.UPDATE_ROLE,
      UserManagementAction.UPDATE_PROFILE
    ].includes(this.action);
  }

  /**
   * Validate the command data based on action type
   */
  isValid(): boolean {
    if (this.requiresData() && !this.data) {
      return false;
    }

    switch (this.action) {
      case UserManagementAction.SUSPEND:
        return this.data instanceof UserSuspensionData || (this.data && typeof this.data === 'object');
      case UserManagementAction.UPDATE_ROLE:
        return this.data instanceof UserRoleUpdateData || (this.data && 'role' in this.data);
      case UserManagementAction.UPDATE_PROFILE:
        return this.data instanceof UserProfileUpdateData || (this.data && typeof this.data === 'object');
      default:
        return true;
    }
  }

  /**
   * Get typed data for specific action
   */
  getSuspensionData(): UserSuspensionData | undefined {
    return this.action === UserManagementAction.SUSPEND ? this.data as UserSuspensionData : undefined;
  }

  /**
   * Get typed data for role update
   */
  getRoleUpdateData(): UserRoleUpdateData | undefined {
    return this.action === UserManagementAction.UPDATE_ROLE ? this.data as UserRoleUpdateData : undefined;
  }

  /**
   * Get typed data for profile update
   */
  getProfileUpdateData(): UserProfileUpdateData | undefined {
    return this.action === UserManagementAction.UPDATE_PROFILE ? this.data as UserProfileUpdateData : undefined;
  }
}
