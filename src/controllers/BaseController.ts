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
import { AuthRequest } from '../types';
import { serviceContainer } from '../container';

// DTO imports
import { ApiResponseDto } from '../dtos';

export abstract class BaseController {
  protected serviceRegistry = serviceContainer;

  /**
   * Standard success response formatter
   */
  protected sendSuccess<T>(
    res: Response, 
    data: T, 
    message = 'Success', 
    statusCode = 200,
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
      ...(error && { error }),
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
   * Validation is now handled by middleware using class-validator
   * This method is deprecated and will be removed
   * @deprecated Use validation middleware instead
   */
  protected validateRequest(_data: any, _validationRules: any): { isValid: boolean; errors?: string[] } {
    console.warn('validateRequest is deprecated. Use validation middleware with class-validator instead.');
    return { isValid: true };
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
  protected getSortParams(req: Request, allowedFields: string[] = []): { sortBy?: string; sortOrder: 'asc' | 'desc' } {
    const sortBy = req.query.sortBy as string;
    const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc';

    const validSortBy = allowedFields.includes(sortBy) ? sortBy : undefined;
    return {
      ...(validSortBy && { sortBy: validSortBy }),
      sortOrder,
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
