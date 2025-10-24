/**
 * User Management DTOs
 * 
 * Interface definitions for user management and administration
 */

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned'
}

export enum UserRole {
  USER = 'user',
  PROVIDER = 'provider',
  ADMIN = 'admin'
}

export interface UserManagementDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  totalOrders?: number;
  averageRating?: number;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
  reason?: string;
}

export interface UserSearchDto {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}
