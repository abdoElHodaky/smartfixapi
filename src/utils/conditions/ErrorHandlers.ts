/**
 * Error Handling Utilities
 * 
 * Provides standardized error handling patterns to reduce code duplication
 * and ensure consistent error responses across the API.
 */

// Removed unused Response import
import { ApiResponseDto } from '../../dtos';

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode: number;
}

export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  statusCode: number;
}

export type ApiResponse<T = any> = ErrorResponse | SuccessResponse<T>;

export class ErrorHandlers {
  /**
   * Check if error is a validation error
   */
  static isValidationError(error: any): boolean {
    return error && (
      error.name === 'ValidationError' ||
      error.constructor.name === 'ValidationError' ||
      error instanceof Error && error.message.includes('validation')
    );
  }

  /**
   * Check if error is a not found error
   */
  static isNotFoundError(error: any): boolean {
    return error && (
      error.name === 'NotFoundError' ||
      error.constructor.name === 'NotFoundError' ||
      error.statusCode === 404
    );
  }

  /**
   * Check if error is an authentication error
   */
  static isAuthenticationError(error: any): boolean {
    return error && (
      error.name === 'AuthenticationError' ||
      error.constructor.name === 'AuthenticationError' ||
      error.statusCode === 401
    );
  }

  /**
   * Check if error is an authorization error
   */
  static isAuthorizationError(error: any): boolean {
    return error && (
      error.name === 'AuthorizationError' ||
      error.constructor.name === 'AuthorizationError' ||
      error.statusCode === 403
    );
  }

  /**
   * Handle common service errors with standardized responses
   */
  static handleServiceError(error: any): ApiResponseDto {
    if (this.isValidationError(error)) {
      return {
        success: false,
        message: 'Validation failed',
        error: error.message || 'Invalid input data'
      };
    }

    if (this.isNotFoundError(error)) {
      return {
        success: false,
        message: 'Resource not found',
        error: error.message || 'The requested resource was not found'
      };
    }

    if (this.isAuthenticationError(error)) {
      return {
        success: false,
        message: 'Authentication failed',
        error: error.message || 'Invalid credentials'
      };
    }

    if (this.isAuthorizationError(error)) {
      return {
        success: false,
        message: 'Access denied',
        error: error.message || 'Insufficient permissions'
      };
    }

    // Default error handling
    return {
      success: false,
      message: 'An error occurred',
      error: error.message || 'Internal server error'
    };
  }

  /**
   * Handle multiple error types with custom logic
   */
  static handleMultipleErrorTypes(
    error: any,
    handlers: { [key: string]: (error: any) => ApiResponseDto }
  ): ApiResponseDto {
    for (const [errorType, handler] of Object.entries(handlers)) {
      if (this.isErrorType(error, errorType)) {
        return handler(error);
      }
    }

    return this.handleServiceError(error);
  }

  /**
   * Check if error matches a specific type
   */
  static isErrorType(error: any, errorType: string): boolean {
    switch (errorType.toLowerCase()) {
      case 'validation':
        return this.isValidationError(error);
      case 'notfound':
        return this.isNotFoundError(error);
      case 'authentication':
        return this.isAuthenticationError(error);
      case 'authorization':
        return this.isAuthorizationError(error);
      default:
        return false;
    }
  }

  /**
   * Create standardized success response
   */
  static createSuccessResponse<T>(
    message: string,
    data?: T,
    statusCode = 200
  ): ApiResponseDto {
    return {
      success: true,
      message,
      data,
      statusCode
    };
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(
    message: string,
    error?: string,
    statusCode = 400
  ): ApiResponseDto {
    return {
      success: false,
      message,
      error,
      statusCode
    };
  }

  /**
   * Handle async operation with error catching
   */
  static async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    errorMessage = 'Operation failed'
  ): Promise<ApiResponse<T>> {
    try {
      const result = await operation();
      return {
        success: true,
        message: 'Operation completed successfully',
        data: result,
        statusCode: 200
      };
    } catch (error: any) {
      return {
        success: false,
        message: errorMessage,
        error: error.message || 'Unknown error occurred',
        statusCode: 500
      };
    }
  }

  /**
   * Validate and handle common service patterns
   */
  static async validateAndExecute<T>(
    validationFn: () => boolean | { isValid: boolean; errors: string[] },
    executionFn: () => Promise<T>,
    validationErrorMessage = 'Validation failed'
  ): Promise<ApiResponse<T>> {
    try {
      const validation = validationFn();
      
      if (typeof validation === 'boolean') {
        if (!validation) {
          return this.createErrorResponse(validationErrorMessage, undefined, 400);
        }
      } else {
        if (!validation.isValid) {
          return this.createErrorResponse(
            validationErrorMessage,
            validation.errors.join(', '),
            400
          );
        }
      }

      const result = await executionFn();
      return {
        success: true,
        message: 'Operation completed successfully',
        data: result,
        statusCode: 200
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Operation failed',
        error: error.message || 'Unknown error occurred',
        statusCode: 500
      };
    }
  }

  /**
   * Handle role-based access control errors
   */
  static handleRoleAccessError(userRole: string, requiredRoles: string[]): ApiResponseDto {
    return this.createErrorResponse(
      'Access denied',
      `Required role: ${requiredRoles.join(' or ')}. Current role: ${userRole}`,
      403
    );
  }

  /**
   * Handle resource not found errors
   */
  static handleResourceNotFound(resourceType: string, resourceId?: string): ApiResponseDto {
    const message = resourceId 
      ? `${resourceType} with ID ${resourceId} not found`
      : `${resourceType} not found`;
    
    return this.createErrorResponse(message, undefined, 404);
  }

  /**
   * Handle duplicate resource errors
   */
  static handleDuplicateResource(resourceType: string, field?: string): ApiResponseDto {
    const message = field 
      ? `${resourceType} with this ${field} already exists`
      : `${resourceType} already exists`;
    
    return this.createErrorResponse(message, undefined, 409);
  }

  /**
   * Handle rate limiting errors
   */
  static handleRateLimitError(retryAfter?: number): ApiResponseDto {
    const message = retryAfter 
      ? `Rate limit exceeded. Try again in ${retryAfter} seconds`
      : 'Rate limit exceeded';
    
    return this.createErrorResponse(message, undefined, 429);
  }

  /**
   * Handle file upload errors
   */
  static handleFileUploadError(error: any): ApiResponseDto {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return this.createErrorResponse('File too large', error.message, 413);
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return this.createErrorResponse('Too many files', error.message, 413);
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return this.createErrorResponse('Unexpected file field', error.message, 400);
    }
    
    return this.createErrorResponse('File upload failed', error.message, 400);
  }

  /**
   * Handle database connection errors
   */
  static handleDatabaseError(error: any): ApiResponseDto {
    if (error.name === 'MongooseServerSelectionError') {
      return this.createErrorResponse('Database connection failed', 'Unable to connect to database', 503);
    }
    
    if (error.name === 'MongoParseError') {
      return this.createErrorResponse('Database query error', 'Invalid query format', 400);
    }
    
    if (error.code === 11000) {
      return this.createErrorResponse('Duplicate entry', 'Resource already exists', 409);
    }
    
    return this.createErrorResponse('Database error', error.message, 500);
  }

  /**
   * Create conditional error response based on user role
   */
  static createRoleBasedErrorResponse(
    userRole: string,
    adminMessage: string,
    userMessage: string
  ): ApiResponseDto {
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    return this.createErrorResponse(
      isAdmin ? adminMessage : userMessage,
      undefined,
      403
    );
  }

  /**
   * Handle paginated response errors
   */
  static handlePaginationError(page: number, limit: number, total: number): ApiResponseDto | null {
    if (page < 1) {
      return this.createErrorResponse('Invalid page number', 'Page must be greater than 0', 400);
    }
    
    if (limit < 1 || limit > 100) {
      return this.createErrorResponse('Invalid limit', 'Limit must be between 1 and 100', 400);
    }
    
    const maxPage = Math.ceil(total / limit);
    if (page > maxPage && total > 0) {
      return this.createErrorResponse(
        'Page out of range',
        `Page ${page} exceeds maximum page ${maxPage}`,
        400
      );
    }
    
    return null; // No error
  }
}
