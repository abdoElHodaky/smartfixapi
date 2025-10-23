/**
 * Common Types - Shared Type Definitions
 */

import { Request } from 'express';

// User-related types
export interface User {
  id: string;
  email: string;
  role: 'user' | 'provider' | 'admin';
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication types
export interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
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

// Service operation types
export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Strategy pattern types
export interface Strategy<TInput, TOutput> {
  execute(input: TInput): TOutput;
}

export interface AsyncStrategy<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

// Common input types for strategies
export interface BaseOperationInput {
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

// Filter types
export interface BaseFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ServiceError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// Admin strategy input types
export interface ProviderActionInput extends BaseOperationInput {
  providerId: string;
  action?: 'approve' | 'reject' | 'suspend';
  reason?: string;
}

export interface ReportGenerationInput extends BaseOperationInput {
  reportType: 'users' | 'providers' | 'requests' | 'revenue';
  dateRange: {
    from: Date;
    to: Date;
  };
  filters?: Record<string, any>;
}

export interface DashboardDataInput extends BaseOperationInput {
  timeframe?: 'day' | 'week' | 'month' | 'year';
  includeCharts?: boolean;
  metrics?: string[];
}
