/**
 * Error Handler Middleware
 * 
 * Centralized error handling for the SmartFix API
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponseDto } from '../domains/common/dtos';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

/**
 * Custom error class for application errors
 */
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public code?: string;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code?: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends CustomError {
  constructor(message = 'Authentication failed', details?: any) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends CustomError {
  constructor(message = 'Access denied', details?: any) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends CustomError {
  constructor(message = 'Validation failed', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends CustomError {
  constructor(message = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND_ERROR', details);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends CustomError {
  constructor(message = 'Resource conflict', details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends CustomError {
  constructor(message = 'Rate limit exceeded', details?: any) {
    super(message, 429, 'RATE_LIMIT_ERROR', details);
  }
}

/**
 * Error handler middleware
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  const code = error.code;
  let details = error.details;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = error.details || error.message;
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error for debugging
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: error.message,
    stack: error.stack,
    statusCode,
    code,
    details,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send error response
  const response: ApiResponseDto<null> = {
    success: false,
    message,
    data: null,
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };

  res.status(statusCode).json(response);
};

/**
 * 404 handler middleware
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new CustomError(
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error helper
 */
export const createValidationError = (
  message: string,
  details?: any
): CustomError => {
  return new CustomError(message, 400, 'VALIDATION_ERROR', details);
};

/**
 * Authentication error helper
 */
export const createAuthError = (
  message = 'Authentication required'
): CustomError => {
  return new CustomError(message, 401, 'AUTH_ERROR');
};

/**
 * Authorization error helper
 */
export const createAuthorizationError = (
  message = 'Insufficient permissions'
): CustomError => {
  return new CustomError(message, 403, 'AUTHORIZATION_ERROR');
};

/**
 * Not found error helper
 */
export const createNotFoundError = (
  resource = 'Resource'
): CustomError => {
  return new CustomError(`${resource} not found`, 404, 'NOT_FOUND');
};

/**
 * Conflict error helper
 */
export const createConflictError = (
  message: string,
  details?: any
): CustomError => {
  return new CustomError(message, 409, 'CONFLICT_ERROR', details);
};
