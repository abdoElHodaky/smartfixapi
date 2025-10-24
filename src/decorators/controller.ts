/**
 * Controller Decorators
 * 
 * Modern decorators for controller classes to support:
 * - Route registration
 * - Middleware application
 * - Validation
 * - Authorization
 */

import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';

// Type for Express middleware
type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

// Metadata keys
const CONTROLLER_METADATA = Symbol('controller');
const ROUTE_METADATA = Symbol('route');
const MIDDLEWARE_METADATA = Symbol('middleware');
const VALIDATION_METADATA = Symbol('validation');

/**
 * Controller decorator options
 */
export interface ControllerOptions {
  path?: string;
  middleware?: ExpressMiddleware[];
  version?: string;
}

/**
 * Route decorator options
 */
export interface RouteOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  middleware?: ExpressMiddleware[];
  validation?: any;
  roles?: string[];
}

/**
 * Controller class decorator
 */
export function Controller(options: ControllerOptions = {}) {
  return function (target: any) {
    Reflect.defineMetadata(CONTROLLER_METADATA, {
      path: options.path || '',
      middleware: options.middleware || [],
      version: options.version || 'v1',
    }, target);
    
    return target;
  };
}

/**
 * Route method decorators
 */
export function Get(path: string, options: Omit<RouteOptions, 'method' | 'path'> = {}) {
  return Route({ method: 'GET', path, ...options });
}

export function Post(path: string, options: Omit<RouteOptions, 'method' | 'path'> = {}) {
  return Route({ method: 'POST', path, ...options });
}

export function Put(path: string, options: Omit<RouteOptions, 'method' | 'path'> = {}) {
  return Route({ method: 'PUT', path, ...options });
}

export function Delete(path: string, options: Omit<RouteOptions, 'method' | 'path'> = {}) {
  return Route({ method: 'DELETE', path, ...options });
}

export function Patch(path: string, options: Omit<RouteOptions, 'method' | 'path'> = {}) {
  return Route({ method: 'PATCH', path, ...options });
}

/**
 * Generic route decorator
 */
export function Route(options: RouteOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const existingRoutes = Reflect.getMetadata(ROUTE_METADATA, target.constructor) || [];
    
    existingRoutes.push({
      method: options.method,
      path: options.path,
      handler: propertyKey,
      middleware: options.middleware || [],
      validation: options.validation,
      roles: options.roles || [],
    });
    
    Reflect.defineMetadata(ROUTE_METADATA, existingRoutes, target.constructor);
    
    return descriptor;
  };
}

/**
 * Middleware decorator
 */
export function UseMiddleware(...middleware: ExpressMiddleware[]) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (propertyKey && descriptor) {
      // Method-level middleware
      const existingMiddleware = Reflect.getMetadata(MIDDLEWARE_METADATA, target, propertyKey) || [];
      Reflect.defineMetadata(MIDDLEWARE_METADATA, [...existingMiddleware, ...middleware], target, propertyKey);
    } else {
      // Class-level middleware
      const existingMiddleware = Reflect.getMetadata(MIDDLEWARE_METADATA, target) || [];
      Reflect.defineMetadata(MIDDLEWARE_METADATA, [...existingMiddleware, ...middleware], target);
    }
    
    return descriptor;
  };
}

/**
 * Validation decorator
 */
export function Validate(schema: any) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(VALIDATION_METADATA, schema, target, propertyKey);
    return descriptor;
  };
}

/**
 * Authorization decorator
 */
export function RequireRoles(...roles: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const existingRoutes = Reflect.getMetadata(ROUTE_METADATA, target.constructor) || [];
    const routeIndex = existingRoutes.findIndex((route: any) => route.handler === propertyKey);
    
    if (routeIndex !== -1) {
      existingRoutes[routeIndex].roles = [...(existingRoutes[routeIndex].roles || []), ...roles];
      Reflect.defineMetadata(ROUTE_METADATA, existingRoutes, target.constructor);
    }
    
    return descriptor;
  };
}

/**
 * Authentication required decorator
 */
export function RequireAuth() {
  return RequireRoles(); // Empty roles means just authentication required
}

/**
 * Utility functions to extract metadata
 */
export class ControllerMetadata {
  static getControllerMetadata(target: any): ControllerOptions | undefined {
    return Reflect.getMetadata(CONTROLLER_METADATA, target);
  }

  static getRouteMetadata(target: any): RouteOptions[] {
    return Reflect.getMetadata(ROUTE_METADATA, target) || [];
  }

  static getMiddlewareMetadata(target: any, propertyKey?: string): ExpressMiddleware[] {
    if (propertyKey) {
      return Reflect.getMetadata(MIDDLEWARE_METADATA, target, propertyKey) || [];
    }
    return Reflect.getMetadata(MIDDLEWARE_METADATA, target) || [];
  }

  static getValidationMetadata(target: any, propertyKey: string): any {
    return Reflect.getMetadata(VALIDATION_METADATA, target, propertyKey);
  }
}

/**
 * Route registration helper
 */
export interface RegisteredRoute {
  method: string;
  path: string;
  handler: ExpressMiddleware;
  middleware: ExpressMiddleware[];
  validation?: any;
  roles: string[];
}

export function extractRoutes(controllerClass: any): RegisteredRoute[] {
  const controllerMetadata = ControllerMetadata.getControllerMetadata(controllerClass);
  const routeMetadata = ControllerMetadata.getRouteMetadata(controllerClass);
  const basePath = controllerMetadata?.path || '';

  return routeMetadata.map(route => ({
    method: route.method,
    path: basePath + route.path,
    handler: route.handler,
    middleware: [
      ...(controllerMetadata?.middleware || []),
      ...(route.middleware || []),
    ],
    validation: route.validation,
    roles: route.roles || [],
  }));
}
