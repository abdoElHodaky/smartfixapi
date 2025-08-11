/**
 * Service Decorators for Enhanced Service Layer Functionality
 * 
 * This module provides decorators for service classes and methods to add
 * cross-cutting concerns like caching, logging, validation, retry logic,
 * and lifecycle management.
 */

import 'reflect-metadata';

// Service Lifecycle Decorators
export const SERVICE_LIFECYCLE_KEY = Symbol('service:lifecycle');
export const SERVICE_CONFIG_KEY = Symbol('service:config');
export const SERVICE_CACHE_KEY = Symbol('service:cache');
export const SERVICE_RETRY_KEY = Symbol('service:retry');
export const SERVICE_LOG_KEY = Symbol('service:log');
export const SERVICE_VALIDATE_KEY = Symbol('service:validate');

/**
 * Service Lifecycle Types
 */
export enum ServiceScope {
  SINGLETON = 'singleton',
  SCOPED = 'scoped',
  TRANSIENT = 'transient'
}

export interface ServiceConfig {
  scope?: ServiceScope;
  lazy?: boolean;
  priority?: number;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  key?: string; // Custom cache key
  condition?: (args: any[]) => boolean; // Conditional caching
}

export interface RetryConfig {
  attempts: number;
  delay?: number; // Delay between retries in milliseconds
  backoff?: 'linear' | 'exponential';
  condition?: (error: Error) => boolean; // Retry condition
}

export interface LogConfig {
  level?: 'debug' | 'info' | 'warn' | 'error';
  message?: string;
  includeArgs?: boolean;
  includeResult?: boolean;
  includeExecutionTime?: boolean;
}

export interface ValidationConfig {
  schema?: any; // Joi or similar validation schema
  validateArgs?: boolean;
  validateResult?: boolean;
}

/**
 * Class Decorators
 */

/**
 * Marks a class as a singleton service
 * Only one instance will be created and reused
 */
export function Singleton(): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(SERVICE_LIFECYCLE_KEY, { scope: ServiceScope.SINGLETON }, target);
    return target;
  };
}

/**
 * Marks a class as a scoped service
 * New instance per request/scope
 */
export function Scoped(): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(SERVICE_LIFECYCLE_KEY, { scope: ServiceScope.SCOPED }, target);
    return target;
  };
}

/**
 * Marks a class as a transient service
 * New instance every time it's requested
 */
export function Transient(): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(SERVICE_LIFECYCLE_KEY, { scope: ServiceScope.TRANSIENT }, target);
    return target;
  };
}

/**
 * Service configuration decorator
 */
export function Service(config: ServiceConfig = {}): ClassDecorator {
  return function (target: any) {
    const existingConfig = Reflect.getMetadata(SERVICE_CONFIG_KEY, target) || {};
    Reflect.defineMetadata(SERVICE_CONFIG_KEY, { ...existingConfig, ...config }, target);
    return target;
  };
}

/**
 * Method Decorators
 */

/**
 * Caches method results for specified duration
 */
export function Cached(ttlOrConfig: number | CacheConfig): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const config: CacheConfig = typeof ttlOrConfig === 'number' 
      ? { ttl: ttlOrConfig } 
      : ttlOrConfig;

    const originalMethod = descriptor.value;
    const cache = new Map<string, { value: any; expiry: number }>();

    descriptor.value = async function (...args: any[]) {
      // Check cache condition
      if (config.condition && !config.condition(args)) {
        return originalMethod.apply(this, args);
      }

      // Generate cache key
      const cacheKey = config.key || `${target.constructor.name}.${String(propertyKey)}.${JSON.stringify(args)}`;
      const now = Date.now();

      // Check if cached value exists and is not expired
      const cached = cache.get(cacheKey);
      if (cached && cached.expiry > now) {
        console.log(`🎯 Cache hit for ${cacheKey}`);
        return cached.value;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      cache.set(cacheKey, {
        value: result,
        expiry: now + config.ttl
      });

      console.log(`💾 Cached result for ${cacheKey} (TTL: ${config.ttl}ms)`);
      return result;
    };

    Reflect.defineMetadata(SERVICE_CACHE_KEY, config, target, propertyKey);
    return descriptor;
  };
}

/**
 * Adds retry logic to method calls
 */
export function Retryable(attemptsOrConfig: number | RetryConfig): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const config: RetryConfig = typeof attemptsOrConfig === 'number'
      ? { attempts: attemptsOrConfig }
      : attemptsOrConfig;

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: Error;
      
      for (let attempt = 1; attempt <= config.attempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;
          
          // Check retry condition
          if (config.condition && !config.condition(lastError)) {
            throw lastError;
          }

          // Don't retry on last attempt
          if (attempt === config.attempts) {
            break;
          }

          // Calculate delay
          let delay = config.delay || 1000;
          if (config.backoff === 'exponential') {
            delay = delay * Math.pow(2, attempt - 1);
          } else if (config.backoff === 'linear') {
            delay = delay * attempt;
          }

          console.log(`🔄 Retry attempt ${attempt}/${config.attempts} for ${target.constructor.name}.${String(propertyKey)} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    };

    Reflect.defineMetadata(SERVICE_RETRY_KEY, config, target, propertyKey);
    return descriptor;
  };
}

/**
 * Adds logging to method execution
 */
export function Log(messageOrConfig?: string | LogConfig): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const config: LogConfig = typeof messageOrConfig === 'string'
      ? { message: messageOrConfig }
      : messageOrConfig || {};

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const methodName = `${target.constructor.name}.${String(propertyKey)}`;
      const message = config.message || `Executing ${methodName}`;

      // Log method entry
      console.log(`📝 ${message}`);
      if (config.includeArgs) {
        console.log(`📝 Arguments:`, args);
      }

      try {
        const result = await originalMethod.apply(this, args);
        
        // Log successful execution
        const executionTime = Date.now() - startTime;
        console.log(`✅ ${methodName} completed successfully`);
        
        if (config.includeExecutionTime) {
          console.log(`⏱️ Execution time: ${executionTime}ms`);
        }
        
        if (config.includeResult) {
          console.log(`📤 Result:`, result);
        }

        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error(`❌ ${methodName} failed after ${executionTime}ms:`, error);
        throw error;
      }
    };

    Reflect.defineMetadata(SERVICE_LOG_KEY, config, target, propertyKey);
    return descriptor;
  };
}

/**
 * Validates method arguments and/or results
 */
export function Validate(config: ValidationConfig): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Validate arguments
      if (config.validateArgs && config.schema) {
        try {
          // Assuming Joi-like validation
          if (config.schema.validate) {
            const { error } = config.schema.validate(args[0]); // Validate first argument
            if (error) {
              throw new Error(`Validation error in ${target.constructor.name}.${String(propertyKey)}: ${error.message}`);
            }
          }
        } catch (validationError) {
          console.error(`🚫 Argument validation failed for ${target.constructor.name}.${String(propertyKey)}:`, validationError);
          throw validationError;
        }
      }

      const result = await originalMethod.apply(this, args);

      // Validate result
      if (config.validateResult && config.schema) {
        try {
          if (config.schema.validate) {
            const { error } = config.schema.validate(result);
            if (error) {
              throw new Error(`Result validation error in ${target.constructor.name}.${String(propertyKey)}: ${error.message}`);
            }
          }
        } catch (validationError) {
          console.error(`🚫 Result validation failed for ${target.constructor.name}.${String(propertyKey)}:`, validationError);
          throw validationError;
        }
      }

      return result;
    };

    Reflect.defineMetadata(SERVICE_VALIDATE_KEY, config, target, propertyKey);
    return descriptor;
  };
}

/**
 * Lifecycle method decorators
 */

/**
 * Marks a method to be called after service construction
 */
export function PostConstruct(): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const existingMethods = Reflect.getMetadata('service:postConstruct', target.constructor) || [];
    existingMethods.push(propertyKey);
    Reflect.defineMetadata('service:postConstruct', existingMethods, target.constructor);
    return descriptor;
  };
}

/**
 * Marks a method to be called before service destruction
 */
export function PreDestroy(): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const existingMethods = Reflect.getMetadata('service:preDestroy', target.constructor) || [];
    existingMethods.push(propertyKey);
    Reflect.defineMetadata('service:preDestroy', existingMethods, target.constructor);
    return descriptor;
  };
}

/**
 * Configuration decorator for injecting environment variables
 */
export function ConfigValue(key: string, defaultValue?: any): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingConfig = Reflect.getMetadata('service:configValues', target) || [];
    existingConfig[parameterIndex] = { key, defaultValue };
    Reflect.defineMetadata('service:configValues', existingConfig, target);
  };
}

/**
 * Utility functions for service management
 */
export class ServiceUtils {
  /**
   * Get service lifecycle metadata
   */
  static getLifecycleMetadata(target: any): ServiceConfig | undefined {
    return Reflect.getMetadata(SERVICE_LIFECYCLE_KEY, target) || 
           Reflect.getMetadata(SERVICE_CONFIG_KEY, target);
  }

  /**
   * Execute post-construct methods
   */
  static async executePostConstruct(instance: any): Promise<void> {
    const methods = Reflect.getMetadata('service:postConstruct', instance.constructor) || [];
    for (const method of methods) {
      if (typeof instance[method] === 'function') {
        await instance[method]();
      }
    }
  }

  /**
   * Execute pre-destroy methods
   */
  static async executePreDestroy(instance: any): Promise<void> {
    const methods = Reflect.getMetadata('service:preDestroy', instance.constructor) || [];
    for (const method of methods) {
      if (typeof instance[method] === 'function') {
        await instance[method]();
      }
    }
  }

  /**
   * Inject configuration values
   */
  static injectConfigValues(instance: any, args: any[]): any[] {
    const configValues = Reflect.getMetadata('service:configValues', instance.constructor) || [];
    
    return args.map((arg, index) => {
      const config = configValues[index];
      if (config) {
        return process.env[config.key] || config.defaultValue;
      }
      return arg;
    });
  }
}

export default {
  Singleton,
  Scoped,
  Transient,
  Service,
  Cached,
  Retryable,
  Log,
  Validate,
  PostConstruct,
  PreDestroy,
  ConfigValue,
  ServiceUtils
};

