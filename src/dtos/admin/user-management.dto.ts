import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested, Length, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { IsObjectId, IsUserRole, IsPhoneNumber } from '../../utils/validation.utils';

/**
 * Admin create user DTO
 */
export class AdminCreateUserDto {
  @IsString({ message: 'First name must be a string' })
  @Length(2, 50, { message: 'First name must be between 2 and 50 characters' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @Length(2, 50, { message: 'Last name must be between 2 and 50 characters' })
  lastName: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @IsPhoneNumber({ message: 'Phone must be a valid phone number' })
  phone?: string;

  @IsUserRole({ message: 'Role must be a valid user role' })
  role: string;

  @IsOptional()
  @IsBoolean({ message: 'Email verified must be a boolean' })
  emailVerified?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Active must be a boolean' })
  isActive?: boolean;

  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @Length(0, 1000, { message: 'Notes must be at most 1000 characters' })
  adminNotes?: string;
}

/**
 * Admin update user DTO
 */
export class AdminUpdateUserDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @Length(2, 50, { message: 'First name must be between 2 and 50 characters' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @Length(2, 50, { message: 'Last name must be between 2 and 50 characters' })
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @IsPhoneNumber({ message: 'Phone must be a valid phone number' })
  phone?: string;

  @IsOptional()
  @IsUserRole({ message: 'Role must be a valid user role' })
  role?: string;

  @IsOptional()
  @IsBoolean({ message: 'Email verified must be a boolean' })
  emailVerified?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Active must be a boolean' })
  isActive?: boolean;

  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @Length(0, 1000, { message: 'Notes must be at most 1000 characters' })
  adminNotes?: string;
}

/**
 * Bulk user action DTO
 */
export class BulkUserActionDto {
  @IsArray({ message: 'User IDs must be an array' })
  @ArrayMaxSize(100, { message: 'Maximum 100 users can be processed at once' })
  @IsObjectId({ each: true, message: 'Each user ID must be a valid MongoDB ObjectId' })
  userIds: string[];

  @IsEnum(['activate', 'deactivate', 'delete', 'verify_email', 'unverify_email'], {
    message: 'Action must be activate, deactivate, delete, verify_email, or unverify_email'
  })
  action: 'activate' | 'deactivate' | 'delete' | 'verify_email' | 'unverify_email';

  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  @Length(10, 500, { message: 'Reason must be between 10 and 500 characters' })
  reason?: string;
}

/**
 * User suspension DTO
 */
export class UserSuspensionDto {
  @IsString({ message: 'User ID must be a string' })
  @IsObjectId({ message: 'User ID must be a valid MongoDB ObjectId' })
  userId: string;

  @IsString({ message: 'Reason must be a string' })
  @Length(10, 500, { message: 'Reason must be between 10 and 500 characters' })
  reason: string;

  @IsOptional()
  @IsString({ message: 'Duration must be a string' })
  duration?: string; // e.g., "7d", "30d", "permanent"

  @IsOptional()
  @IsBoolean({ message: 'Notify user must be a boolean' })
  notifyUser?: boolean;
}

/**
 * User search filters DTO
 */
export class UserSearchFiltersDto {
  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  @Length(1, 100, { message: 'Search query must be between 1 and 100 characters' })
  q?: string;

  @IsOptional()
  @IsUserRole({ message: 'Role must be a valid user role' })
  role?: string;

  @IsOptional()
  @IsBoolean({ message: 'Active must be a boolean' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Email verified must be a boolean' })
  emailVerified?: boolean;

  @IsOptional()
  @IsString({ message: 'Created from must be a string' })
  createdFrom?: string; // ISO date string

  @IsOptional()
  @IsString({ message: 'Created to must be a string' })
  createdTo?: string; // ISO date string

  @IsOptional()
  @IsString({ message: 'Sort by must be a string' })
  @IsEnum(['createdAt', 'firstName', 'lastName', 'email', 'lastLogin'], {
    message: 'Sort by must be createdAt, firstName, lastName, email, or lastLogin'
  })
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort order must be asc or desc' })
  sortOrder?: 'asc' | 'desc';
}

