/**
 * Optimized Service Registry
 * 
 * High-performance service registry with lazy loading, caching, and dependency injection
 */

import { IUserService } from '../domains/user/interfaces/IUserService';
import { IAuthService } from '../domains/auth/interfaces/IAuthService';
import { IProviderService } from '../domains/provider/interfaces/IProviderService';
import { IServiceRequestService } from '../domains/service-request/interfaces/IServiceRequestService';
import { IReviewService } from '../domains/review/interfaces/IReviewService';
import { IChatService } from '../domains/chat/interfaces/IChatService';
import { IAdminService } from '../domains/admin/interfaces/IAdminService';

export type ServiceType = 
  | 'UserService'
  | 'AuthService'
  | 'ProviderService'
  | 'ServiceRequestService'
  | 'ReviewService'
  | 'ChatService'
  | 'AdminService';

export type ServiceInstance = 
  | IUserService
  | IAuthService
  | IProviderService
  | IServiceRequestService
  | IReviewService
  | IChatService
  | IAdminService;

export interface ServiceFactory<T = ServiceInstance> {
  create(): T;
  singleton?: boolean;
}

/**
 * Optimized Service Registry with performance enhancements
 */
export class OptimizedServiceRegistry {
  private static instance: OptimizedServiceRegistry;
  private services = new Map<ServiceType, ServiceInstance>();
  private factories = new Map<ServiceType, ServiceFactory>();
  private singletons = new Set<ServiceType>();
  private loadingPromises = new Map<ServiceType, Promise<ServiceInstance>>();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * Get singleton instance of the registry
   */
  static getInstance(): OptimizedServiceRegistry {
    if (!OptimizedServiceRegistry.instance) {
      OptimizedServiceRegistry.instance = new OptimizedServiceRegistry();
    }
    return OptimizedServiceRegistry.instance;
  }

  /**
   * Register a service factory
   */
  register<T extends ServiceInstance>(
    type: ServiceType,
    factory: ServiceFactory<T>
  ): void {
    this.factories.set(type, factory as ServiceFactory);
    
    if (factory.singleton !== false) {
      this.singletons.add(type);
    }
  }

  /**
   * Get service instance with lazy loading and caching
   */
  async get<T extends ServiceInstance>(type: ServiceType): Promise<T> {
    // Return cached instance if available
    if (this.services.has(type)) {
      return this.services.get(type) as T;
    }

    // Return loading promise if already loading
    if (this.loadingPromises.has(type)) {
      return this.loadingPromises.get(type) as Promise<T>;
    }

    // Get factory
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Service factory not registered for type: ${type}`);
    }

    // Create loading promise
    const loadingPromise = this.createServiceInstance<T>(type, factory);
    this.loadingPromises.set(type, loadingPromise);

    try {
      const instance = await loadingPromise;
      
      // Cache singleton instances
      if (this.singletons.has(type)) {
        this.services.set(type, instance);
      }
      
      return instance;
    } finally {
      this.loadingPromises.delete(type);
    }
  }

  /**
   * Get service instance synchronously (throws if not cached)
   */
  getSync<T extends ServiceInstance>(type: ServiceType): T {
    const instance = this.services.get(type);
    if (!instance) {
      throw new Error(`Service not cached or not loaded: ${type}`);
    }
    return instance as T;
  }

  /**
   * Check if service is registered
   */
  isRegistered(type: ServiceType): boolean {
    return this.factories.has(type);
  }

  /**
   * Check if service is loaded/cached
   */
  isLoaded(type: ServiceType): boolean {
    return this.services.has(type);
  }

  /**
   * Preload services for better performance
   */
  async preload(types: ServiceType[]): Promise<void> {
    const promises = types.map(type => this.get(type));
    await Promise.all(promises);
  }

  /**
   * Clear service cache
   */
  clear(type?: ServiceType): void {
    if (type) {
      this.services.delete(type);
      this.loadingPromises.delete(type);
    } else {
      this.services.clear();
      this.loadingPromises.clear();
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    registered: number;
    loaded: number;
    loading: number;
    singletons: number;
  } {
    return {
      registered: this.factories.size,
      loaded: this.services.size,
      loading: this.loadingPromises.size,
      singletons: this.singletons.size,
    };
  }

  /**
   * Create service instance with error handling
   */
  private async createServiceInstance<T extends ServiceInstance>(
    type: ServiceType,
    factory: ServiceFactory
  ): Promise<T> {
    try {
      const instance = factory.create();
      
      // Handle async factory results
      if (instance instanceof Promise) {
        return await instance as T;
      }
      
      return instance as T;
    } catch (error) {
      throw new Error(`Failed to create service instance for ${type}: ${error}`);
    }
  }
}

/**
 * Service Registry Builder for fluent configuration
 */
export class ServiceRegistryBuilder {
  private registry = OptimizedServiceRegistry.getInstance();

  register<T extends ServiceInstance>(
    type: ServiceType,
    factory: ServiceFactory<T>
  ): ServiceRegistryBuilder {
    this.registry.register(type, factory);
    return this;
  }

  singleton<T extends ServiceInstance>(
    type: ServiceType,
    factory: () => T
  ): ServiceRegistryBuilder {
    this.registry.register(type, { create: factory, singleton: true });
    return this;
  }

  transient<T extends ServiceInstance>(
    type: ServiceType,
    factory: () => T
  ): ServiceRegistryBuilder {
    this.registry.register(type, { create: factory, singleton: false });
    return this;
  }

  build(): OptimizedServiceRegistry {
    return this.registry;
  }
}

/**
 * Service locator pattern implementation
 */
export class ServiceLocator {
  private static registry = OptimizedServiceRegistry.getInstance();

  static async resolve<T extends ServiceInstance>(type: ServiceType): Promise<T> {
    return ServiceLocator.registry.get<T>(type);
  }

  static resolveSync<T extends ServiceInstance>(type: ServiceType): T {
    return ServiceLocator.registry.getSync<T>(type);
  }

  static async preloadServices(types: ServiceType[]): Promise<void> {
    await ServiceLocator.registry.preload(types);
  }
}

// Export default instance
export default OptimizedServiceRegistry.getInstance();
