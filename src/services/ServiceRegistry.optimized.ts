/**
 * Optimized Service Registry
 * 
 * High-performance service management with advanced optimization features,
 * performance tracking, and enterprise-grade service discovery.
 */

import 'reflect-metadata';
import { Container } from '@decorators/di';
import { ServiceUtils, ServiceScope } from '../decorators/service';

// Import all optimized services
import { AuthService } from './auth/AuthService.decorator';
import { UserService } from './user/UserService.decorator';
import { ProviderService } from './provider/ProviderService.decorator';
import { ServiceRequestService } from './request/ServiceRequestService.decorator';
import { ReviewService } from './review/ReviewService.decorator';
import { AdminService } from './admin/AdminService.decorator';
import { ChatService } from './chat/ChatService.decorator';

// Import interfaces
import { 
  IAuthService, 
  IUserService, 
  IProviderService, 
  IServiceRequestService, 
  IReviewService, 
  IAdminService, 
  IChatService 
} from '../interfaces/services';

export interface OptimizedServiceDefinition {
  name: string;
  class: any;
  scope: ServiceScope;
  dependencies?: string[];
  priority?: number;
  optimizationLevel: 'basic' | 'advanced' | 'enterprise';
  features: {
    strategy?: boolean;
    commands?: boolean;
    aggregation?: boolean;
    caching?: boolean;
    metrics?: boolean;
  };
}

export interface OptimizedServiceInstance {
  name: string;
  instance: any;
  initialized: boolean;
  scope: ServiceScope;
  optimizationLevel: 'basic' | 'advanced' | 'enterprise';
  features: string[];
  metrics: {
    initializationTime: number;
    callCount: number;
    averageResponseTime: number;
    errorCount: number;
    lastAccessed: Date;
  };
}

export interface ServiceMetrics {
  serviceName: string;
  optimizationLevel: 'basic' | 'advanced' | 'enterprise';
  performance: {
    initializationTime: number;
    averageResponseTime: number;
    callCount: number;
    errorRate: number;
  };
  features: string[];
  lastUpdated: Date;
}

/**
 * Optimized Service Registry with advanced performance features
 */
export class OptimizedServiceRegistry {
  private container: Container;
  private services: Map<string, OptimizedServiceInstance> = new Map();
  private serviceDefinitions: OptimizedServiceDefinition[] = [];
  private initialized: boolean = false;
  private performanceMetrics: Map<string, ServiceMetrics> = new Map();

  constructor() {
    this.container = new Container();
    this.registerOptimizedServices();
  }

  /**
   * Register all optimized services with their configurations
   */
  private registerOptimizedServices(): void {
    const services: OptimizedServiceDefinition[] = [
      {
        name: 'AuthService',
        class: AuthService,
        scope: ServiceScope.SINGLETON,
        optimizationLevel: 'advanced',
        features: {
          strategy: true,
          caching: true,
          metrics: true
        }
      },
      {
        name: 'UserService',
        class: UserService,
        scope: ServiceScope.SINGLETON,
        optimizationLevel: 'advanced',
        features: {
          strategy: true,
          caching: true,
          metrics: true
        }
      },
      {
        name: 'ProviderService',
        class: ProviderService,
        scope: ServiceScope.SINGLETON,
        optimizationLevel: 'enterprise',
        features: {
          strategy: true,
          commands: true,
          aggregation: true,
          caching: true,
          metrics: true
        }
      },
      {
        name: 'ServiceRequestService',
        class: ServiceRequestService,
        scope: ServiceScope.SINGLETON,
        optimizationLevel: 'enterprise',
        features: {
          strategy: true,
          commands: true,
          aggregation: true,
          caching: true,
          metrics: true
        }
      },
      {
        name: 'ReviewService',
        class: ReviewService,
        scope: ServiceScope.SINGLETON,
        optimizationLevel: 'advanced',
        features: {
          strategy: true,
          aggregation: true,
          caching: true,
          metrics: true
        }
      },
      {
        name: 'AdminService',
        class: AdminService,
        scope: ServiceScope.SINGLETON,
        optimizationLevel: 'enterprise',
        features: {
          strategy: true,
          commands: true,
          aggregation: true,
          caching: true,
          metrics: true
        }
      },
      {
        name: 'ChatService',
        class: ChatService,
        scope: ServiceScope.SINGLETON,
        optimizationLevel: 'basic',
        features: {
          caching: true,
          metrics: true
        }
      }
    ];

    this.serviceDefinitions = services;
  }

  /**
   * Initialize all optimized services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🚀 Initializing Optimized Service Registry...');
    const startTime = Date.now();

    try {
      // Sort services by priority and dependencies
      const sortedServices = this.sortServicesByDependencies();

      for (const serviceDef of sortedServices) {
        await this.initializeService(serviceDef);
      }

      this.initialized = true;
      const initTime = Date.now() - startTime;
      console.log(`✅ Optimized Service Registry initialized in ${initTime}ms`);
      console.log(`📊 Services initialized: ${this.services.size}`);
      console.log(`🎯 Optimization levels: ${this.getOptimizationSummary()}`);

    } catch (error) {
      console.error('❌ Failed to initialize Optimized Service Registry:', error);
      throw error;
    }
  }

  /**
   * Initialize a single service with optimization features
   */
  private async initializeService(serviceDef: OptimizedServiceDefinition): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🔧 Initializing ${serviceDef.name} (${serviceDef.optimizationLevel})...`);

      // Create service instance
      const serviceInstance = new serviceDef.class();
      
      // Initialize service if it has an init method
      if (typeof serviceInstance.initialize === 'function') {
        await serviceInstance.initialize();
      }

      const initTime = Date.now() - startTime;

      // Create optimized service instance record
      const optimizedInstance: OptimizedServiceInstance = {
        name: serviceDef.name,
        instance: serviceInstance,
        initialized: true,
        scope: serviceDef.scope,
        optimizationLevel: serviceDef.optimizationLevel,
        features: Object.keys(serviceDef.features).filter(key => serviceDef.features[key as keyof typeof serviceDef.features]),
        metrics: {
          initializationTime: initTime,
          callCount: 0,
          averageResponseTime: 0,
          errorCount: 0,
          lastAccessed: new Date()
        }
      };

      this.services.set(serviceDef.name, optimizedInstance);

      // Initialize performance metrics
      this.initializeServiceMetrics(serviceDef.name, optimizedInstance);

      console.log(`✅ ${serviceDef.name} initialized in ${initTime}ms`);

    } catch (error) {
      console.error(`❌ Failed to initialize ${serviceDef.name}:`, error);
      throw error;
    }
  }

  /**
   * Initialize performance metrics for a service
   */
  private initializeServiceMetrics(serviceName: string, instance: OptimizedServiceInstance): void {
    const metrics: ServiceMetrics = {
      serviceName,
      optimizationLevel: instance.optimizationLevel,
      performance: {
        initializationTime: instance.metrics.initializationTime,
        averageResponseTime: 0,
        callCount: 0,
        errorRate: 0
      },
      features: instance.features,
      lastUpdated: new Date()
    };

    this.performanceMetrics.set(serviceName, metrics);
  }

  /**
   * Get service with optimization features
   */
  getService<T>(serviceName: string): T {
    const serviceInstance = this.services.get(serviceName);
    
    if (!serviceInstance) {
      throw new Error(`Service ${serviceName} not found in optimized registry`);
    }

    if (!serviceInstance.initialized) {
      throw new Error(`Service ${serviceName} not initialized`);
    }

    // Update access metrics
    serviceInstance.metrics.callCount++;
    serviceInstance.metrics.lastAccessed = new Date();

    // Update performance metrics
    const metrics = this.performanceMetrics.get(serviceName);
    if (metrics) {
      metrics.performance.callCount++;
      metrics.lastUpdated = new Date();
    }

    return serviceInstance.instance as T;
  }

  /**
   * Get services by optimization level
   */
  getServicesByOptimizationLevel(level: 'basic' | 'advanced' | 'enterprise'): string[] {
    return Array.from(this.services.values())
      .filter(service => service.optimizationLevel === level)
      .map(service => service.name);
  }

  /**
   * Get service metrics
   */
  getServiceMetrics(serviceName?: string): ServiceMetrics | ServiceMetrics[] | null {
    if (serviceName) {
      return this.performanceMetrics.get(serviceName) || null;
    }

    return Array.from(this.performanceMetrics.values());
  }

  /**
   * Check if service supports a specific feature
   */
  serviceSupportsFeature(serviceName: string, feature: 'strategy' | 'commands' | 'aggregation' | 'caching' | 'metrics'): boolean {
    const serviceInstance = this.services.get(serviceName);
    return serviceInstance ? serviceInstance.features.includes(feature) : false;
  }

  /**
   * Get optimization summary
   */
  private getOptimizationSummary(): string {
    const levels = { basic: 0, advanced: 0, enterprise: 0 };
    
    for (const service of this.services.values()) {
      levels[service.optimizationLevel]++;
    }

    return `Basic: ${levels.basic}, Advanced: ${levels.advanced}, Enterprise: ${levels.enterprise}`;
  }

  /**
   * Sort services by dependencies (simplified for now)
   */
  private sortServicesByDependencies(): OptimizedServiceDefinition[] {
    // For now, return services in priority order
    // In a real implementation, this would resolve dependency graphs
    return this.serviceDefinitions.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  /**
   * Health check for optimized services
   */
  async healthCheck(): Promise<{ [key: string]: any }> {
    const health: { [key: string]: any } = {
      initialized: this.initialized,
      serviceCount: this.services.size,
      optimizationLevels: {}
    };

    // Count services by optimization level
    const levels = { basic: 0, advanced: 0, enterprise: 0 };
    for (const service of this.services.values()) {
      levels[service.optimizationLevel]++;
    }
    health.optimizationLevels = levels;

    // Add performance summary
    health.performance = {
      totalCalls: Array.from(this.services.values()).reduce((sum, s) => sum + s.metrics.callCount, 0),
      totalErrors: Array.from(this.services.values()).reduce((sum, s) => sum + s.metrics.errorCount, 0),
      averageInitTime: Array.from(this.services.values()).reduce((sum, s) => sum + s.metrics.initializationTime, 0) / this.services.size
    };

    return health;
  }

  /**
   * Get all registered services
   */
  getAllServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const optimizedServiceRegistry = new OptimizedServiceRegistry();

