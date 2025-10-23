import { IsString, IsEmail, IsOptional, IsBoolean, IsDateString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { IsObjectId } from '../../utils/validation.utils';

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

export class UserManagementDto {
  @IsObjectId()
  id: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsEnum(UserStatus)
  status: UserStatus;

  @IsBoolean()
  emailVerified: boolean;

  @IsOptional()
  @IsBoolean()
  phoneVerified?: boolean;

  @IsDateString()
  createdAt: string;

  @IsOptional()
  @IsDateString()
  lastLoginAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalOrders?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  averageRating?: number;
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UserSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

