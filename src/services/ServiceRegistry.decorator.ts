/**
 * Decorator-Based Service Registry
 * 
 * Centralized service management with dependency injection,
 * lifecycle management, and service discovery.
 */

import 'reflect-metadata';
import { Container } from '@decorators/di';
import { ServiceUtils, ServiceScope } from '../decorators/service';

// Import all decorator-based services
import { AuthService } from './auth/AuthService.decorator';
import { UserService } from './user/UserService.decorator';
import { ProviderService } from './provider/ProviderService.decorator';

export interface ServiceDefinition {
  name: string;
  class: any;
  scope: ServiceScope;
  dependencies?: string[];
  priority?: number;
}

export interface ServiceInstance {
  name: string;
  instance: any;
  initialized: boolean;
  scope: ServiceScope;
}

/**
 * Service Registry for managing decorator-based services
 */
export class ServiceRegistry {
  private container: Container;
  private services: Map<string, ServiceInstance> = new Map();
  private serviceDefinitions: ServiceDefinition[] = [];
  private initialized: boolean = false;

  constructor() {
    this.container = new Container();
    this.registerServices();
  }

  /**
   * Register all available services
   */
  private registerServices(): void {
    this.serviceDefinitions = [
      {
        name: 'AuthService',
        class: AuthService,
        scope: ServiceScope.SINGLETON,
        priority: 1
      },
      {
        name: 'UserService',
        class: UserService,
        scope: ServiceScope.SINGLETON,
        dependencies: ['AuthService'],
        priority: 2
      },
      {
        name: 'ProviderService',
        class: ProviderService,
        scope: ServiceScope.SINGLETON,
        dependencies: ['AuthService', 'UserService'],
        priority: 3
      }
    ];

    console.log(`📋 Registered ${this.serviceDefinitions.length} service definitions`);
  }

  /**
   * Initialize all services with proper dependency order
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⚠️  Service registry already initialized');
      return;
    }

    console.log('🔧 Initializing Service Registry...');

    try {
      // Sort services by priority
      const sortedServices = this.serviceDefinitions.sort((a, b) => 
        (a.priority || 0) - (b.priority || 0)
      );

      // Register services in the DI container
      const providers = sortedServices.map(service => ({
        provide: service.name,
        useClass: service.class
      }));

      this.container.provide(providers);

      // Initialize services in dependency order
      for (const serviceDef of sortedServices) {
        await this.initializeService(serviceDef);
      }

      this.initialized = true;
      console.log('✅ Service Registry initialized successfully');
      this.logServiceStatus();

    } catch (error) {
      console.error('❌ Service Registry initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize a single service
   */
  private async initializeService(serviceDef: ServiceDefinition): Promise<void> {
    try {
      console.log(`🔧 Initializing ${serviceDef.name}...`);

      // Get service instance from container
      const instance = await this.container.get(serviceDef.name);

      // Execute post-construct lifecycle methods
      await ServiceUtils.executePostConstruct(instance);

      // Store service instance
      this.services.set(serviceDef.name, {
        name: serviceDef.name,
        instance,
        initialized: true,
        scope: serviceDef.scope
      });

      console.log(`✅ ${serviceDef.name} initialized successfully`);

    } catch (error) {
      console.error(`❌ Failed to initialize ${serviceDef.name}:`, error);
      throw error;
    }
  }

  /**
   * Get service instance by name
   */
  getService<T>(serviceName: string): T {
    if (!this.initialized) {
      throw new Error('Service registry not initialized. Call initialize() first.');
    }

    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found`);
    }

    if (!service.initialized) {
      throw new Error(`Service '${serviceName}' not initialized`);
    }

    return service.instance as T;
  }

  /**
   * Check if service exists
   */
  hasService(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  /**
   * Get all service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName: string): ServiceInstance | undefined {
    return this.services.get(serviceName);
  }

  /**
   * Get all services status
   */
  getAllServicesStatus(): ServiceInstance[] {
    return Array.from(this.services.values());
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Service Registry...');

    try {
      // Get services in reverse priority order for shutdown
      const sortedServices = Array.from(this.services.values())
        .sort((a, b) => {
          const aDef = this.serviceDefinitions.find(s => s.name === a.name);
          const bDef = this.serviceDefinitions.find(s => s.name === b.name);
          return (bDef?.priority || 0) - (aDef?.priority || 0);
        });

      // Execute pre-destroy lifecycle methods
      for (const service of sortedServices) {
        try {
          console.log(`🧹 Shutting down ${service.name}...`);
          await ServiceUtils.executePreDestroy(service.instance);
          service.initialized = false;
          console.log(`✅ ${service.name} shutdown completed`);
        } catch (error) {
          console.error(`❌ Error shutting down ${service.name}:`, error);
        }
      }

      this.services.clear();
      this.initialized = false;
      console.log('✅ Service Registry shutdown completed');

    } catch (error) {
      console.error('❌ Service Registry shutdown failed:', error);
      throw error;
    }
  }

  /**
   * Restart a specific service
   */
  async restartService(serviceName: string): Promise<void> {
    console.log(`🔄 Restarting ${serviceName}...`);

    const serviceDef = this.serviceDefinitions.find(s => s.name === serviceName);
    if (!serviceDef) {
      throw new Error(`Service definition for '${serviceName}' not found`);
    }

    const existingService = this.services.get(serviceName);
    if (existingService) {
      // Shutdown existing service
      await ServiceUtils.executePreDestroy(existingService.instance);
      this.services.delete(serviceName);
    }

    // Reinitialize service
    await this.initializeService(serviceDef);
    console.log(`✅ ${serviceName} restarted successfully`);
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{ [serviceName: string]: boolean }> {
    const healthStatus: { [serviceName: string]: boolean } = {};

    for (const [serviceName, service] of this.services) {
      try {
        // Check if service has a health check method
        if (typeof service.instance.healthCheck === 'function') {
          healthStatus[serviceName] = await service.instance.healthCheck();
        } else {
          // Default health check - service is healthy if initialized
          healthStatus[serviceName] = service.initialized;
        }
      } catch (error) {
        console.error(`❌ Health check failed for ${serviceName}:`, error);
        healthStatus[serviceName] = false;
      }
    }

    return healthStatus;
  }

  /**
   * Log service status
   */
  private logServiceStatus(): void {
    console.log('\n📊 Service Registry Status:');
    console.log('═'.repeat(50));
    
    for (const service of this.services.values()) {
      const status = service.initialized ? '✅ Running' : '❌ Stopped';
      const scope = service.scope;
      console.log(`  ${service.name.padEnd(20)} ${status.padEnd(12)} [${scope}]`);
    }
    
    console.log('═'.repeat(50));
    console.log(`Total Services: ${this.services.size}`);
    console.log(`Initialized: ${Array.from(this.services.values()).filter(s => s.initialized).length}`);
    console.log('');
  }

  /**
   * Get container instance for advanced usage
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Register additional service at runtime
   */
  async registerService(serviceDef: ServiceDefinition): Promise<void> {
    if (this.serviceDefinitions.find(s => s.name === serviceDef.name)) {
      throw new Error(`Service '${serviceDef.name}' already registered`);
    }

    this.serviceDefinitions.push(serviceDef);
    
    if (this.initialized) {
      // If registry is already initialized, initialize the new service
      this.container.provide([{
        provide: serviceDef.name,
        useClass: serviceDef.class
      }]);
      
      await this.initializeService(serviceDef);
    }
  }

  /**
   * Unregister service
   */
  async unregisterService(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (service) {
      await ServiceUtils.executePreDestroy(service.instance);
      this.services.delete(serviceName);
    }

    this.serviceDefinitions = this.serviceDefinitions.filter(s => s.name !== serviceName);
  }
}

// Create singleton instance
export const serviceRegistry = new ServiceRegistry();

// Export for convenience
export default serviceRegistry;

