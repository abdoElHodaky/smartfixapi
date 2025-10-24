/**
 * Optimized Service Registry
 * 
 * Enhanced service registry with support for strategy patterns, command handlers,
 * and optimized service injection using utility patterns.
 */

import 'reflect-metadata';
import { Container } from '@decorators/di';
import { ServiceUtils, ServiceScope } from '../decorators/service';

// Import optimized services
import { AdminServiceStrategy } from './admin/AdminService.strategy';
import { AuthService } from './auth/AuthService.decorator';
import { UserService } from './user/UserService.decorator';
import { ProviderService } from './provider/ProviderService.decorator';
import { ServiceRequestService } from './request/ServiceRequestService.decorator';
import { ReviewService } from './review/ReviewService.decorator';
import { ChatService } from './chat/ChatService.decorator';

// Import utility classes
import { AggregationBuilder } from '../utils/aggregation/AggregationBuilder';
import { StrategyRegistry, AsyncStrategyRegistry } from '../utils/conditions/StrategyPatterns';
import { ConditionalHelpers } from '../utils/conditions/ConditionalHelpers';
import { CommandBase, CommandContext } from '../utils/service-optimization/CommandBase';

// Import CQRS command factories
import { AdminCommandFactory } from '../cqrs/command/AdminCommands';

export interface OptimizedServiceDefinition {
  name: string;
  class: any;
  scope: ServiceScope;
  dependencies?: string[];
  priority?: number;
  useStrategy?: boolean;
  useCommands?: boolean;
  useAggregation?: boolean;
  optimizationLevel?: 'basic' | 'advanced' | 'enterprise';
}

export interface OptimizedServiceInstance {
  name: string;
  instance: any;
  initialized: boolean;
  scope: ServiceScope;
  strategies?: Map<string, any>;
  commands?: Map<string, any>;
  aggregationBuilder?: AggregationBuilder;
  optimizationLevel: 'basic' | 'advanced' | 'enterprise';
}

export interface ServiceMetrics {
  name: string;
  callCount: number;
  averageExecutionTime: number;
  errorCount: number;
  lastUsed: Date;
  optimizationLevel: string;
}

/**
 * Optimized Service Registry with enhanced capabilities
 */
export class OptimizedServiceRegistry {
  private container: Container;
  private services: Map<string, OptimizedServiceInstance> = new Map();
  private serviceDefinitions: OptimizedServiceDefinition[] = [];
  private serviceMetrics: Map<string, ServiceMetrics> = new Map();
  private initialized = false;

  // Utility instances
  private globalAggregationBuilder: AggregationBuilder;
  private globalStrategyRegistry: StrategyRegistry<any, any>;
  private globalAsyncStrategyRegistry: AsyncStrategyRegistry<any, any>;

  constructor() {
    this.container = new Container();
    this.initializeUtilities();
    this.registerOptimizedServices();
  }

  /**
   * Initialize global utility instances
   */
  private initializeUtilities(): void {
    this.globalAggregationBuilder = AggregationBuilder.create();
    this.globalStrategyRegistry = new StrategyRegistry<any, any>();
    this.globalAsyncStrategyRegistry = new AsyncStrategyRegistry<any, any>();
  }

  /**
   * Register all optimized services with their configurations
   */
  private registerOptimizedServices(): void {
    this.serviceDefinitions = [
      {
        name: 'AuthService',
        class: AuthService,
        scope: ServiceScope.SINGLETON,
        priority: 1,
        useStrategy: false,
        useCommands: false,
        useAggregation: false,
        optimizationLevel: 'basic',
      },
      {
        name: 'UserService',
        class: UserService,
        scope: ServiceScope.SINGLETON,
        dependencies: ['AuthService'],
        priority: 2,
        useStrategy: true,
        useCommands: true,
        useAggregation: true,
        optimizationLevel: 'advanced',
      },
      {
        name: 'ProviderService',
        class: ProviderService,
        scope: ServiceScope.SINGLETON,
        dependencies: ['AuthService', 'UserService'],
        priority: 3,
        useStrategy: true,
        useCommands: true,
        useAggregation: true,
        optimizationLevel: 'advanced',
      },
      {
        name: 'ServiceRequestService',
        class: ServiceRequestService,
        scope: ServiceScope.SINGLETON,
        dependencies: ['AuthService', 'UserService', 'ProviderService'],
        priority: 4,
        useStrategy: true,
        useCommands: true,
        useAggregation: true,
        optimizationLevel: 'advanced',
      },
      {
        name: 'ReviewService',
        class: ReviewService,
        scope: ServiceScope.SINGLETON,
        dependencies: ['AuthService', 'UserService', 'ProviderService', 'ServiceRequestService'],
        priority: 5,
        useStrategy: true,
        useCommands: false,
        useAggregation: true,
        optimizationLevel: 'advanced',
      },
      {
        name: 'AdminService',
        class: AdminServiceStrategy, // Use the optimized strategy-based implementation
        scope: ServiceScope.SINGLETON,
        dependencies: ['AuthService', 'UserService', 'ProviderService', 'ServiceRequestService', 'ReviewService'],
        priority: 10, // Highest priority for strategy-based service
        useStrategy: true,
        useCommands: true,
        useAggregation: true,
        optimizationLevel: 'enterprise',
      },
      {
        name: 'ChatService',
        class: ChatService,
        scope: ServiceScope.SINGLETON,
        dependencies: ['AuthService', 'UserService', 'ServiceRequestService'],
        priority: 7,
        useStrategy: true,
        useCommands: false,
        useAggregation: true,
        optimizationLevel: 'advanced',
      },
    ];

    // Sort by priority for proper initialization order
    this.serviceDefinitions.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  /**
   * Initialize all services with their optimizations
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🚀 Initializing Optimized Service Registry...');

    for (const definition of this.serviceDefinitions) {
      await this.initializeService(definition);
    }

    this.initialized = true;
    console.log('✅ Optimized Service Registry initialized successfully');
  }

  /**
   * Initialize a single service with optimizations
   */
  private async initializeService(definition: OptimizedServiceDefinition): Promise<void> {
    try {
      // Create service instance
      const serviceInstance = this.createServiceInstance(definition);

      // Initialize optimization features
      const optimizedInstance: OptimizedServiceInstance = {
        name: definition.name,
        instance: serviceInstance,
        initialized: false,
        scope: definition.scope,
        optimizationLevel: definition.optimizationLevel || 'basic',
      };

      // Add strategy support if enabled
      if (definition.useStrategy) {
        optimizedInstance.strategies = new Map();
        await this.initializeServiceStrategies(optimizedInstance, definition);
      }

      // Add command support if enabled
      if (definition.useCommands) {
        optimizedInstance.commands = new Map();
        await this.initializeServiceCommands(optimizedInstance, definition);
      }

      // Add aggregation support if enabled
      if (definition.useAggregation) {
        optimizedInstance.aggregationBuilder = AggregationBuilder.create();
      }

      // Initialize service metrics
      this.serviceMetrics.set(definition.name, {
        name: definition.name,
        callCount: 0,
        averageExecutionTime: 0,
        errorCount: 0,
        lastUsed: new Date(),
        optimizationLevel: definition.optimizationLevel || 'basic',
      });

      // Register in container
      this.container.provide([
        { provide: definition.name, useValue: serviceInstance },
      ]);

      // Store optimized instance
      this.services.set(definition.name, optimizedInstance);
      optimizedInstance.initialized = true;

      console.log(`✅ Service ${definition.name} initialized with ${definition.optimizationLevel} optimization`);
    } catch (error) {
      console.error(`❌ Failed to initialize service ${definition.name}:`, error);
      throw error;
    }
  }

  /**
   * Create service instance with dependency injection
   */
  private createServiceInstance(definition: OptimizedServiceDefinition): any {
    if (definition.dependencies && definition.dependencies.length > 0) {
      const dependencies = definition.dependencies.map(dep => this.getService(dep));
      return new definition.class(...dependencies);
    }
    return new definition.class();
  }

  /**
   * Initialize strategy patterns for a service
   */
  private async initializeServiceStrategies(
    serviceInstance: OptimizedServiceInstance,
    definition: OptimizedServiceDefinition,
  ): Promise<void> {
    // Service-specific strategy initialization
    switch (definition.name) {
    case 'AdminService':
      // AdminService strategies are initialized internally
      break;
    case 'UserService':
        // Initialize user-specific strategies
        serviceInstance.strategies!.set('validation', new StrategyRegistry<any, any>());
      break;
    case 'ProviderService':
        // Initialize provider-specific strategies
        serviceInstance.strategies!.set('approval', new AsyncStrategyRegistry<any, any>());
      break;
      // Add more service-specific strategy initializations as needed
    }
  }

  /**
   * Initialize command patterns for a service
   */
  private async initializeServiceCommands(
    serviceInstance: OptimizedServiceInstance,
    definition: OptimizedServiceDefinition,
  ): Promise<void> {
    // Service-specific command initialization
    switch (definition.name) {
    case 'AdminService':
        // AdminService commands are handled by AdminCommandFactory
        serviceInstance.commands!.set('factory', AdminCommandFactory);
      break;
    case 'UserService':
      // Initialize user-specific commands
      break;
    case 'ProviderService':
      // Initialize provider-specific commands
      break;
      // Add more service-specific command initializations as needed
    }
  }

  /**
   * Get service with performance tracking
   */
  getService<T>(serviceName: string): T {
    const startTime = Date.now();
    
    try {
      const serviceInstance = this.services.get(serviceName);
      if (!serviceInstance) {
        throw new Error(`Service ${serviceName} not found`);
      }

      if (!serviceInstance.initialized) {
        throw new Error(`Service ${serviceName} not initialized`);
      }

      // Update metrics
      this.updateServiceMetrics(serviceName, Date.now() - startTime, false);

      return serviceInstance.instance as T;
    } catch (error) {
      // Update error metrics
      this.updateServiceMetrics(serviceName, Date.now() - startTime, true);
      throw error;
    }
  }

  /**
   * Get service with optimization features
   */
  getOptimizedService<T>(serviceName: string): {
    service: T;
    strategies?: Map<string, any>;
    commands?: Map<string, any>;
    aggregationBuilder?: AggregationBuilder;
    optimizationLevel: string;
  } {
    const serviceInstance = this.services.get(serviceName);
    if (!serviceInstance) {
      throw new Error(`Service ${serviceName} not found`);
    }

    return {
      service: serviceInstance.instance as T,
      strategies: serviceInstance.strategies,
      commands: serviceInstance.commands,
      aggregationBuilder: serviceInstance.aggregationBuilder,
      optimizationLevel: serviceInstance.optimizationLevel,
    };
  }

  /**
   * Update service performance metrics
   */
  private updateServiceMetrics(serviceName: string, executionTime: number, isError: boolean): void {
    const metrics = this.serviceMetrics.get(serviceName);
    if (metrics) {
      metrics.callCount++;
      metrics.averageExecutionTime = (metrics.averageExecutionTime + executionTime) / 2;
      metrics.lastUsed = new Date();
      
      if (isError) {
        metrics.errorCount++;
      }
    }
  }

  /**
   * Get service performance metrics
   */
  getServiceMetrics(serviceName?: string): ServiceMetrics | ServiceMetrics[] {
    if (serviceName) {
      const metrics = this.serviceMetrics.get(serviceName);
      if (!metrics) {
        throw new Error(`Metrics for service ${serviceName} not found`);
      }
      return metrics;
    }
    
    return Array.from(this.serviceMetrics.values());
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
   * Check if service supports feature
   */
  serviceSupportsFeature(serviceName: string, feature: 'strategy' | 'commands' | 'aggregation'): boolean {
    const serviceInstance = this.services.get(serviceName);
    if (!serviceInstance) {
      return false;
    }

    switch (feature) {
    case 'strategy':
      return !!serviceInstance.strategies;
    case 'commands':
      return !!serviceInstance.commands;
    case 'aggregation':
      return !!serviceInstance.aggregationBuilder;
    default:
      return false;
    }
  }

  /**
   * Get global utilities
   */
  getGlobalUtilities(): {
    aggregationBuilder: AggregationBuilder;
    strategyRegistry: StrategyRegistry<any, any>;
    asyncStrategyRegistry: AsyncStrategyRegistry<any, any>;
    conditionalHelpers: typeof ConditionalHelpers;
    } {
    return {
      aggregationBuilder: this.globalAggregationBuilder,
      strategyRegistry: this.globalStrategyRegistry,
      asyncStrategyRegistry: this.globalAsyncStrategyRegistry,
      conditionalHelpers: ConditionalHelpers,
    };
  }

  /**
   * Create command context for service operations
   */
  createCommandContext(userId?: string, adminId?: string, metadata?: Record<string, any>): CommandContext {
    return {
      userId,
      adminId,
      timestamp: new Date(),
      metadata,
    };
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{ healthy: boolean; services: { name: string; status: string; optimizationLevel: string }[] }> {
    const serviceStatuses = [];
    let allHealthy = true;

    for (const [name, instance] of this.services) {
      try {
        const status = instance.initialized ? 'healthy' : 'not_initialized';
        serviceStatuses.push({
          name,
          status,
          optimizationLevel: instance.optimizationLevel,
        });
        
        if (!instance.initialized) {
          allHealthy = false;
        }
      } catch (error) {
        serviceStatuses.push({
          name,
          status: 'error',
          optimizationLevel: instance.optimizationLevel,
        });
        allHealthy = false;
      }
    }

    return {
      healthy: allHealthy,
      services: serviceStatuses,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Optimized Service Registry...');
    
    for (const [name, instance] of this.services) {
      try {
        if (instance.instance && typeof instance.instance.cleanup === 'function') {
          await instance.instance.cleanup();
        }
      } catch (error) {
        console.error(`Error cleaning up service ${name}:`, error);
      }
    }

    this.services.clear();
    this.serviceMetrics.clear();
    this.initialized = false;
    
    console.log('✅ Optimized Service Registry cleanup completed');
  }
}

// Export singleton instance
export const optimizedServiceRegistry = new OptimizedServiceRegistry();
