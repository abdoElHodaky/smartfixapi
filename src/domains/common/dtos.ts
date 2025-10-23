/**
 * Common DTOs - Data Transfer Objects
 */

// API Response DTOs
export interface ApiResponseDto<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User DTOs
export interface UserDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

// Auth DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponseDto {
  token: string;
  user: UserDto;
  expiresIn: number;
}

// Admin DTOs
export interface AdminStatsDto {
  totalUsers: number;
  totalProviders: number;
  totalRequests: number;
  totalReviews: number;
  activeUsers: number;
  pendingRequests: number;
}

export interface AdminFiltersDto {
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
}

// Provider DTOs
export interface ProviderDto {
  id: string;
  userId: string;
  businessName: string;
  services: string[];
  rating: number;
  isVerified: boolean;
  location: string;
}

export interface CreateProviderDto {
  businessName: string;
  services: string[];
  location: string;
  description?: string;
}

// Service Request DTOs
export interface ServiceRequestDto {
  id: string;
  userId: string;
  providerId?: string;
  title: string;
  description: string;
  category: string;
  status: string;
  budget?: number;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceRequestDto {
  title: string;
  description: string;
  category: string;
  budget?: number;
  location: string;
}

// Review DTOs
export interface ReviewDto {
  id: string;
  userId: string;
  providerId: string;
  requestId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface CreateReviewDto {
  requestId: string;
  rating: number;
  comment?: string;
}

// Chat DTOs
export interface ChatMessageDto {
  id: string;
  chatId: string;
  senderId: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export interface CreateChatMessageDto {
  chatId: string;
  message: string;
}

