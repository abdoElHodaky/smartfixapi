import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { attachMiddleware } from '@decorators/express';
import { authenticateToken } from '../middleware/auth';
import { validateUserRegistration, validateUserLogin } from '../middleware/validation';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { body, validationResult } from 'express-validator';

/**
 * Authentication decorator
 * Applies JWT token authentication to the decorated method
 */
export function Auth() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    attachMiddleware(target, propertyKey, authenticateToken);
  };
}

/**
 * Validation decorator for user registration
 * Applies user registration validation to the decorated method
 */
export function ValidateUserRegistration() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    attachMiddleware(target, propertyKey, validateUserRegistration);
  };
}

/**
 * Validation decorator for user login
 * Applies user login validation to the decorated method
 */
export function ValidateUserLogin() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    attachMiddleware(target, propertyKey, validateUserLogin);
  };
}

/**
 * Rate limiting decorator
 * Applies rate limiting to the decorated method
 */
export function RateLimit(windowMs: number = 15 * 60 * 1000, max = 100) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const limiter = rateLimit({
      windowMs,
      max,
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
      },
    });
    
    attachMiddleware(target, propertyKey, limiter);
  };
}

/**
 * CORS decorator
 * Applies CORS headers to the decorated method
 */
export function EnableCors(options?: any) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const corsMiddleware = cors(options);
    
    attachMiddleware(target, propertyKey, corsMiddleware);
  };
}

/**
 * Custom validation decorator
 * Applies custom validation middleware to the decorated method
 */
export function Validate(validationRules: any[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    
    // Apply validation rules
    validationRules.forEach(rule => {
      attachMiddleware(target, propertyKey, rule);
    });
    
    // Apply validation result handler
    attachMiddleware(target, propertyKey, (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }
      next();
    });
  };
}

/**
 * Async error handler decorator
 * Wraps the decorated method with async error handling
 */
export function AsyncHandler() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const res = args.find(arg => arg && typeof arg.status === 'function');
        if (res) {
          res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error',
          });
        }
      }
    };
    
    return descriptor;
  };
}

/**
 * Cache decorator
 * Applies caching to the decorated method response
 */
export function Cache(duration = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    attachMiddleware(target, propertyKey, (req: Request, res: Response, next: NextFunction) => {
      res.set('Cache-Control', `public, max-age=${duration}`);
      next();
    });
  };
}

/**
 * Log decorator
 * Logs method execution
 */
export function Log(message?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      console.log(`🔍 ${message || `Executing ${target.constructor.name}.${propertyKey}`}`);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}
