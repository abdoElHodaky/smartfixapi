/**
 * Validation Middleware using class-validator
 * 
 * Provides automatic validation for request bodies using class-validator decorators
 */

import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass, ClassConstructor } from 'class-transformer';
import { ApiResponseDto } from '../dtos/common/response.dto';

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a DTO class
 */
export function validateBody<T extends object>(dtoClass: ClassConstructor<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Transform plain object to class instance
      const dto = plainToClass(dtoClass, req.body);
      
      // Validate the DTO
      const errors = await validate(dto as object, {
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
        transform: true, // Enable transformation
        validateCustomDecorators: true
      });

      if (errors.length > 0) {
        const errorMessages = formatValidationErrors(errors);
        const response: ApiResponseDto<null> = {
          success: false,
          message: 'Validation failed',
          data: null,
          error: errorMessages.join(', ')
        };
        
        res.status(400).json(response);
        return;
      }

      // Replace request body with validated and transformed DTO
      req.body = dto;
      next();
    } catch (error) {
      const response: ApiResponseDto<null> = {
        success: false,
        message: 'Validation error',
        data: null,
        error: 'Invalid request format'
      };
      
      res.status(400).json(response);
    }
  };
}

/**
 * Validation middleware for query parameters
 */
export function validateQuery<T extends object>(dtoClass: ClassConstructor<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Transform plain object to class instance
      const dto = plainToClass(dtoClass, req.query);
      
      // Validate the DTO
      const errors = await validate(dto as object, {
        whitelist: true,
        forbidNonWhitelisted: false, // More lenient for query params
        transform: true,
        validateCustomDecorators: true
      });

      if (errors.length > 0) {
        const errorMessages = formatValidationErrors(errors);
        const response: ApiResponseDto<null> = {
          success: false,
          message: 'Query validation failed',
          data: null,
          error: errorMessages.join(', ')
        };
        
        res.status(400).json(response);
        return;
      }

      // Replace request query with validated and transformed DTO
      req.query = dto as any;
      next();
    } catch (error) {
      const response: ApiResponseDto<null> = {
        success: false,
        message: 'Query validation error',
        data: null,
        error: 'Invalid query format'
      };
      
      res.status(400).json(response);
    }
  };
}

/**
 * Validation middleware for route parameters
 */
export function validateParams<T extends object>(dtoClass: ClassConstructor<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Transform plain object to class instance
      const dto = plainToClass(dtoClass, req.params);
      
      // Validate the DTO
      const errors = await validate(dto as object, {
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        validateCustomDecorators: true
      });

      if (errors.length > 0) {
        const errorMessages = formatValidationErrors(errors);
        const response: ApiResponseDto<null> = {
          success: false,
          message: 'Parameter validation failed',
          data: null,
          error: errorMessages.join(', ')
        };
        
        res.status(400).json(response);
        return;
      }

      // Replace request params with validated and transformed DTO
      req.params = dto as any;
      next();
    } catch (error) {
      const response: ApiResponseDto<null> = {
        success: false,
        message: 'Parameter validation error',
        data: null,
        error: 'Invalid parameter format'
      };
      
      res.status(400).json(response);
    }
  };
}

/**
 * Format validation errors into user-friendly messages
 */
function formatValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  
  for (const error of errors) {
    if (error.constraints) {
      // Add constraint messages
      messages.push(...Object.values(error.constraints));
    }
    
    // Handle nested validation errors
    if (error.children && error.children.length > 0) {
      const nestedMessages = formatValidationErrors(error.children);
      messages.push(...nestedMessages.map(msg => `${error.property}.${msg}`));
    }
  }
  
  return messages;
}

/**
 * Generic validation function for manual validation
 */
export async function validateDto<T extends object>(
  dtoClass: ClassConstructor<T>, 
  data: any
): Promise<{ isValid: boolean; errors?: string[]; dto?: T }> {
  try {
    const dto = plainToClass(dtoClass, data);
    const errors = await validate(dto as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true
    });

    if (errors.length > 0) {
      return {
        isValid: false,
        errors: formatValidationErrors(errors)
      };
    }

    return {
      isValid: true,
      dto
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid data format']
    };
  }
}
