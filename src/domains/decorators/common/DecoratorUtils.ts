/**
 * Decorator Utilities
 * 
 * Common utilities and helpers for decorator implementations
 */

import 'reflect-metadata';

export class DecoratorUtils {
  /**
   * Get metadata for a target
   */
  static getMetadata<T = any>(key: string, target: any, propertyKey?: string | symbol): T | undefined {
    if (propertyKey) {
      return Reflect.getMetadata(key, target, propertyKey);
    }
    return Reflect.getMetadata(key, target);
  }

  /**
   * Set metadata for a target
   */
  static setMetadata<T = any>(key: string, value: T, target: any, propertyKey?: string | symbol): void {
    if (propertyKey) {
      Reflect.defineMetadata(key, value, target, propertyKey);
    } else {
      Reflect.defineMetadata(key, value, target);
    }
  }

  /**
   * Check if metadata exists
   */
  static hasMetadata(key: string, target: any, propertyKey?: string | symbol): boolean {
    if (propertyKey) {
      return Reflect.hasMetadata(key, target, propertyKey);
    }
    return Reflect.hasMetadata(key, target);
  }

  /**
   * Get all metadata keys
   */
  static getMetadataKeys(target: any, propertyKey?: string | symbol): any[] {
    if (propertyKey) {
      return Reflect.getMetadataKeys(target, propertyKey);
    }
    return Reflect.getMetadataKeys(target);
  }

  /**
   * Create a method decorator factory
   */
  static createMethodDecorator<T = any>(
    metadataKey: string,
    defaultValue?: T
  ): (value?: T) => MethodDecorator {
    return (value: T = defaultValue as T) => {
      return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        DecoratorUtils.setMetadata(metadataKey, value, target, propertyKey);
        return descriptor;
      };
    };
  }

  /**
   * Create a class decorator factory
   */
  static createClassDecorator<T = any>(
    metadataKey: string,
    defaultValue?: T
  ): (value?: T) => ClassDecorator {
    return (value: T = defaultValue as T) => {
      return (target: any) => {
        DecoratorUtils.setMetadata(metadataKey, value, target);
        return target;
      };
    };
  }

  /**
   * Create a property decorator factory
   */
  static createPropertyDecorator<T = any>(
    metadataKey: string,
    defaultValue?: T
  ): (value?: T) => PropertyDecorator {
    return (value: T = defaultValue as T) => {
      return (target: any, propertyKey: string | symbol) => {
        DecoratorUtils.setMetadata(metadataKey, value, target, propertyKey);
      };
    };
  }

  /**
   * Create a parameter decorator factory
   */
  static createParameterDecorator<T = any>(
    metadataKey: string,
    defaultValue?: T
  ): (value?: T) => ParameterDecorator {
    return (value: T = defaultValue as T) => {
      return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        const existingMetadata = DecoratorUtils.getMetadata(metadataKey, target, propertyKey) || {};
        existingMetadata[parameterIndex] = value;
        DecoratorUtils.setMetadata(metadataKey, existingMetadata, target, propertyKey);
      };
    };
  }

  /**
   * Combine multiple decorators
   */
  static combine(...decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[]): any {
    return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
      decorators.forEach(decorator => {
        if (descriptor) {
          // Method decorator
          (decorator as MethodDecorator)(target, propertyKey!, descriptor);
        } else if (propertyKey) {
          // Property decorator
          (decorator as PropertyDecorator)(target, propertyKey);
        } else {
          // Class decorator
          (decorator as ClassDecorator)(target);
        }
      });
    };
  }

  /**
   * Get parameter types using reflect-metadata
   */
  static getParameterTypes(target: any, propertyKey?: string | symbol): any[] {
    if (propertyKey) {
      return Reflect.getMetadata('design:paramtypes', target, propertyKey) || [];
    }
    return Reflect.getMetadata('design:paramtypes', target) || [];
  }

  /**
   * Get return type using reflect-metadata
   */
  static getReturnType(target: any, propertyKey?: string | symbol): any {
    if (propertyKey) {
      return Reflect.getMetadata('design:returntype', target, propertyKey);
    }
    return Reflect.getMetadata('design:returntype', target);
  }

  /**
   * Get property type using reflect-metadata
   */
  static getPropertyType(target: any, propertyKey: string | symbol): any {
    return Reflect.getMetadata('design:type', target, propertyKey);
  }
}

export default DecoratorUtils;
