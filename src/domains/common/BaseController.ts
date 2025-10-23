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

// External imports
import { Request, Response, NextFunction } from 'express';

// Internal imports
import { AuthRequest } from './types';
import { ApiResponseDto } from './dtos';

export abstract class BaseController {
  /**
   * Standard success response formatter
   */
  protected sendSuccess<T>(
    res: Response, 
    data: T, 
    message: string = 'Success', 
    statusCode: number = 200,
  ): void {
    const response: ApiResponseDto<T> = {
      success: true,
      message,
      data,
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
    error?: string,
  ): void {
    const response: ApiResponseDto<null> = {
      success: false,
      message,
      data: null,
      error,
    };
    res.status(statusCode).json(response);
  }

  /**
   * Log request for debugging
   */
  protected logRequest(req: Request, action: string): void {
    console.log(`[${new Date().toISOString()}] ${action} - ${req.method} ${req.path}`);
  }

  /**
   * Get pagination parameters from request
   */
  protected getPaginationParams(req: Request): { page: number; limit: number } {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    return { page, limit };
  }

  /**
   * Get sort parameters from request
   */
  protected getSortParams(req: Request, allowedFields: string[]): { sortBy?: string; sortOrder: 'asc' | 'desc' } {
    const sortBy = req.query.sortBy as string;
    const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc';
    
    return {
      ...(sortBy && allowedFields.includes(sortBy) && { sortBy }),
      sortOrder,
    };
  }

  /**
   * Get filter parameters from request
   */
  protected getFilterParams(req: Request, allowedFilters: string[]): Record<string, any> {
    const filters: Record<string, any> = {};
    
    allowedFilters.forEach(filter => {
      if (req.query[filter] !== undefined) {
        filters[filter] = req.query[filter];
      }
    });
    
    return filters;
  }

  /**
   * Validate request body against schema
   */
  protected validateRequest(body: any, schema: Record<string, any>): { isValid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    Object.keys(schema).forEach(field => {
      const rules = schema[field];
      const value = body[field];
      
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
      }
      
      if (value && rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be less than ${rules.maxLength} characters`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Check if user has required role
   */
  protected requireRole(req: AuthRequest, res: Response, roles: string[]): boolean {
    if (!req.user || !roles.includes(req.user.role)) {
      this.sendError(res, 'Insufficient permissions', 403);
      return false;
    }
    return true;
  }
}

