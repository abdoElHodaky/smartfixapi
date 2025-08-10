import { Request } from 'express';

export interface Location {
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'provider' | 'admin';
  };
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface ServiceRequestStatus {
  PENDING: 'pending';
  ACCEPTED: 'accepted';
  IN_PROGRESS: 'in_progress';
  COMPLETED: 'completed';
  CANCELLED: 'cancelled';
}

export interface UserRole {
  USER: 'user';
  PROVIDER: 'provider';
  ADMIN: 'admin';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

