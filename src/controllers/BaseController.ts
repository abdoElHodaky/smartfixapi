/**
 * BaseController - Modern Base Controller Class
 * 
 * Provides standardized patterns for all controllers including:
 * - Modern dependency injection
 * - Error handling
 * - Response formatting
 * - Validation
 * - Logging
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ValidationError, AuthenticationError } from '../middleware/errorHandler';
import { ApiResponseDto } from '../dtos/common/response.dto';
import { serviceRegistry } from '../container';

export abstract class BaseController {
  protected serviceRegistry = serviceRegistry;

  /**
   * Standard success response formatter
   */
  protected sendSuccess<T>(
    res: Response, 
    data: T, 
    message: string = 'Success', 
    statusCode: number = 200
  ): void {
    const response: ApiResponseDto<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    res.status(statusCode).json(response);
  }

  /**
   * Standard error response formatter
   */
  protected sendError(
    res: Response, 
    message: string, 
    statusCode: number = 400, 
    errors?: any[]
  ): void {
    const response: ApiResponseDto<null> = {
      success: false,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString()
    };
    res.status(statusCode).json(response);
  }

  /**
   * Authentication check helper
   */
  protected requireAuth(req: AuthRequest, res: Response): boolean {
    if (!req.user) {
      this.sendError(res, 'Authentication required', 401);
      return false;
    }
    return true;
  }

  /**
   * Role-based authorization check
   */
  protected requireRole(req: AuthRequest, res: Response, allowedRoles: string[]): boolean {
    if (!this.requireAuth(req, res)) {
      return false;
    }

    if (!allowedRoles.includes(req.user!.role)) {
      this.sendError(res, 'Insufficient permissions', 403);
      return false;
    }
    return true;
  }

  /**
   * Validation helper
   */
  protected validateRequest(data: any, validationRules: any): { isValid: boolean; errors?: string[] } {
    // Basic validation - can be extended with more sophisticated validation
    const errors: string[] = [];
    
    for (const [field, rules] of Object.entries(validationRules)) {
      const value = data[field];
      const fieldRules = rules as any;

      if (fieldRules.required && (!value || value === '')) {
        errors.push(`${field} is required`);
      }

      if (fieldRules.email && value && !this.isValidEmail(value)) {
        errors.push(`${field} must be a valid email`);
      }

      if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
        errors.push(`${field} must be at least ${fieldRules.minLength} characters`);
      }

      if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
        errors.push(`${field} must be no more than ${fieldRules.maxLength} characters`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Email validation helper
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Async handler wrapper for error handling
   */
  protected asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Log request helper
   */
  protected logRequest(req: Request, action: string): void {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${action} - User: ${(req as AuthRequest).user?.id || 'Anonymous'}`);
  }

  /**
   * Extract pagination parameters
   */
  protected getPaginationParams(req: Request): { page: number; limit: number; offset: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Extract sorting parameters
   */
  protected getSortParams(req: Request, allowedFields: string[] = []): { sortBy?: string; sortOrder: 'ASC' | 'DESC' } {
    const sortBy = req.query.sortBy as string;
    const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    return {
      sortBy: allowedFields.includes(sortBy) ? sortBy : undefined,
      sortOrder
    };
  }

  /**
   * Extract filter parameters
   */
  protected getFilterParams(req: Request, allowedFilters: string[] = []): Record<string, any> {
    const filters: Record<string, any> = {};

    for (const filter of allowedFilters) {
      if (req.query[filter] !== undefined) {
        filters[filter] = req.query[filter];
      }
    }

    return filters;
  }
}

