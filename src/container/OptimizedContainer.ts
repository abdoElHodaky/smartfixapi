/**
 * Optimized Container Configuration
 * 
 * Enhanced dependency injection container that uses optimized services
 * with strategy patterns, command handlers, and aggregation builders.
 */

import 'reflect-metadata';
import { Container } from '@decorators/di';
import { optimizedServiceRegistry, OptimizedServiceRegistry } from '../services/ServiceRegistry.optimized';
import { serviceRegistry as legacyServiceRegistry } from '../services/ServiceRegistry.decorator';
import { 
  IAuthService, 
  IUserService, 
  IProviderService, 
  IServiceRequestService, 
  IReviewService, 
  IAdminService, 
  IChatService 
} from '../interfaces/services';

// Configuration options
export interface ContainerConfig {
  useOptimizedServices: boolean;
  enablePerformanceTracking: boolean;
  enableServiceMetrics: boolean;
  fallbackToLegacy: boolean;
  optimizationLevel: 'basic' | 'advanced' | 'enterprise';
}

/**
 * Optimized Container with enhanced service management
 */
export class OptimizedContainer {
  private static instance: OptimizedContainer;
  private container: Container;
  private config: ContainerConfig;
  private optimizedRegistry: OptimizedServiceRegistry;
  private initialized: boolean = false;

  private constructor(config: Partial<ContainerConfig> = {}) {
    this.config = {
      useOptimizedServices: true,
      enablePerformanceTracking: true,
      enableServiceMetrics: true,
      fallbackToLegacy: true,
      optimizationLevel: 'advanced',
      ...config
    };

    this.container = new Container();
    this.optimizedRegistry = optimizedServiceRegistry;
  }

  /**
   * Get singleton instance with configuration
   */
  static getInstance(config?: Partial<ContainerConfig>): OptimizedContainer {
    if (!OptimizedContainer.instance) {
      OptimizedContainer.instance = new OptimizedContainer(config);
    }
    return OptimizedContainer.instance;
  }

  /**
   * Initialize the optimized container
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🚀 Initializing Optimized Container...');
    console.log(`📊 Configuration:`, this.config);

    try {
      if (this.config.useOptimizedServices) {
        await this.optimizedRegistry.initialize();
        console.log('✅ Optimized services initialized');
      }

      // Register service providers in the container
      this.registerServiceProviders();

      this.initialized = true;
      console.log('✅ Optimized Container initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Optimized Container:', error);
      
      if (this.config.fallbackToLegacy) {
        console.log('🔄 Falling back to legacy services...');
        await this.initializeLegacyFallback();
      } else {
        throw error;
      }
    }
  }

  /**
   * Register service providers in the container
   */
  private registerServiceProviders(): void {
    // Register optimized service getters
    this.container.provide([
      {
        provide: 'AuthService',
        useFactory: () => this.getAuthService()
      },
      {
        provide: 'UserService',
        useFactory: () => this.getUserService()
      },
      {
        provide: 'ProviderService',
        useFactory: () => this.getProviderService()
      },
      {
        provide: 'ServiceRequestService',
        useFactory: () => this.getServiceRequestService()
      },
      {
        provide: 'ReviewService',
        useFactory: () => this.getReviewService()
      },
      {
        provide: 'AdminService',
        useFactory: () => this.getAdminService()
      },
      {
        provide: 'ChatService',
        useFactory: () => this.getChatService()
      }
    ]);
  }

  /**
   * Initialize legacy fallback services
   */
  private async initializeLegacyFallback(): void {
    console.log('🔄 Initializing legacy service fallback...');
    // Legacy services are already initialized in ServiceRegistry.decorator.ts
    this.initialized = true;
    console.log('✅ Legacy fallback initialized');
  }

  /**
   * Get AuthService with optimization features
   */
  getAuthService(): IAuthService {
    if (this.config.useOptimizedServices) {
      try {
        return this.optimizedRegistry.getService<IAuthService>('AuthService');
      } catch (error) {
        if (this.config.fallbackToLegacy) {
          console.warn('⚠️ Falling back to legacy AuthService:', error instanceof Error ? error.message : String(error));
          return legacyServiceRegistry.getService<IAuthService>('AuthService');
        }
        throw error;
      }
    }
    return legacyServiceRegistry.getService<IAuthService>('AuthService');
  }

  /**
   * Get UserService with optimization features
   */
  getUserService(): IUserService {
    if (this.config.useOptimizedServices) {
      try {
        return this.optimizedRegistry.getService<IUserService>('UserService');
      } catch (error) {
        if (this.config.fallbackToLegacy) {
          console.warn('⚠️ Falling back to legacy UserService:', error instanceof Error ? error.message : String(error));
          return legacyServiceRegistry.getService<IUserService>('UserService');
        }
        throw error;
      }
    }
    return legacyServiceRegistry.getService<IUserService>('UserService');
  }

  /**
   * Get ProviderService with optimization features
   */
  getProviderService(): IProviderService {
    if (this.config.useOptimizedServices) {
      try {
        return this.optimizedRegistry.getService<IProviderService>('ProviderService');
      } catch (error) {
        if (this.config.fallbackToLegacy) {
          console.warn('⚠️ Falling back to legacy ProviderService:', error instanceof Error ? error.message : String(error));
          return legacyServiceRegistry.getService<IProviderService>('ProviderService');
        }
        throw error;
      }
    }
    return legacyServiceRegistry.getService<IProviderService>('ProviderService');
  }

  /**
   * Get ServiceRequestService with optimization features
   */
  getServiceRequestService(): IServiceRequestService {
    if (this.config.useOptimizedServices) {
      try {
        return this.optimizedRegistry.getService<IServiceRequestService>('ServiceRequestService');
      } catch (error) {
        if (this.config.fallbackToLegacy) {
          console.warn('⚠️ Falling back to legacy ServiceRequestService:', error instanceof Error ? error.message : String(error));
          return legacyServiceRegistry.getService<IServiceRequestService>('ServiceRequestService');
        }
        throw error;
      }
    }
    return legacyServiceRegistry.getService<IServiceRequestService>('ServiceRequestService');
  }

  /**
   * Get ReviewService with optimization features
   */
  getReviewService(): IReviewService {
    if (this.config.useOptimizedServices) {
      try {
        return this.optimizedRegistry.getService<IReviewService>('ReviewService');
      } catch (error) {
        if (this.config.fallbackToLegacy) {
          console.warn('⚠️ Falling back to legacy ReviewService:', error instanceof Error ? error.message : String(error));
          return legacyServiceRegistry.getService<IReviewService>('ReviewService');
        }
        throw error;
      }
    }
    return legacyServiceRegistry.getService<IReviewService>('ReviewService');
  }

  /**
   * Get AdminService with optimization features (Strategy-based)
   */
  getAdminService(): IAdminService {
    if (this.config.useOptimizedServices) {
      try {
        // Always use the optimized strategy-based AdminService
        return this.optimizedRegistry.getService<IAdminService>('AdminService');
      } catch (error) {
        if (this.config.fallbackToLegacy) {
          console.warn('⚠️ Falling back to legacy AdminService:', error instanceof Error ? error.message : String(error));
          return legacyServiceRegistry.getService<IAdminService>('AdminService');
        }
        throw error;
      }
    }
    return legacyServiceRegistry.getService<IAdminService>('AdminService');
  }

  /**
   * Get ChatService with optimization features
   */
  getChatService(): IChatService {
    if (this.config.useOptimizedServices) {
      try {
        return this.optimizedRegistry.getService<IChatService>('ChatService');
      } catch (error) {
        if (this.config.fallbackToLegacy) {
          console.warn('⚠️ Falling back to legacy ChatService:', error instanceof Error ? error.message : String(error));
          return legacyServiceRegistry.getService<IChatService>('ChatService');
        }
        throw error;
      }
    }
    return legacyServiceRegistry.getService<IChatService>('ChatService');
  }

  /**
   * Get service with full optimization features
   */
  getOptimizedService<T>(serviceName: string): {
    service: T;
    strategies?: Map<string, any>;
    commands?: Map<string, any>;
    aggregationBuilder?: any;
    optimizationLevel: string;
  } {
    if (!this.config.useOptimizedServices) {
      throw new Error('Optimized services are disabled in configuration');
    }

    return this.optimizedRegistry.getOptimizedService<T>(serviceName);
  }

  /**
   * Get service performance metrics
   */
  getServiceMetrics(serviceName?: string) {
    if (!this.config.enableServiceMetrics) {
      throw new Error('Service metrics are disabled in configuration');
    }

    return this.optimizedRegistry.getServiceMetrics(serviceName);
  }

  /**
   * Get services by optimization level
   */
  getServicesByOptimizationLevel(level: 'basic' | 'advanced' | 'enterprise'): string[] {
    return this.optimizedRegistry.getServicesByOptimizationLevel(level);
  }

  /**
   * Check if service supports specific optimization features
   */
  serviceSupportsFeature(serviceName: string, feature: 'strategy' | 'commands' | 'aggregation'): boolean {
    return this.optimizedRegistry.serviceSupportsFeature(serviceName, feature);
  }

  /**
   * Get global utilities for direct use
   */
  getGlobalUtilities() {
    return this.optimizedRegistry.getGlobalUtilities();
  }

  /**
   * Create command context for service operations
   */
  createCommandContext(userId?: string, adminId?: string, metadata?: Record<string, any>) {
    return this.optimizedRegistry.createCommandContext(userId, adminId, metadata);
  }

  /**
   * Health check for all services
   */
  async healthCheck() {
    const optimizedHealth = await this.optimizedRegistry.healthCheck();
    
    return {
      container: {
        initialized: this.initialized,
        config: this.config
      },
      services: optimizedHealth
    };
  }

  /**
   * Update container configuration
   */
  updateConfig(newConfig: Partial<ContainerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📊 Container configuration updated:', this.config);
  }

  /**
   * Switch to optimized services
   */
  async enableOptimizedServices(): Promise<void> {
    if (this.config.useOptimizedServices) {
      return;
    }

    console.log('🔄 Switching to optimized services...');
    this.config.useOptimizedServices = true;
    
    if (this.optimizedRegistry && typeof this.optimizedRegistry.initialize === 'function') {
      await this.optimizedRegistry.initialize();
    }
    
    this.registerServiceProviders();
    console.log('✅ Switched to optimized services');
  }

  /**
   * Switch to legacy services
   */
  switchToLegacyServices(): void {
    if (!this.config.useOptimizedServices) {
      return;
    }

    console.log('🔄 Switching to legacy services...');
    this.config.useOptimizedServices = false;
    this.registerServiceProviders();
    console.log('✅ Switched to legacy services');
  }

  /**
   * Get container statistics
   */
  getContainerStats() {
    const optimizedServices = this.getServicesByOptimizationLevel('advanced').length + 
                             this.getServicesByOptimizationLevel('enterprise').length;
    const basicServices = this.getServicesByOptimizationLevel('basic').length;

    return {
      initialized: this.initialized,
      config: this.config,
      services: {
        total: optimizedServices + basicServices,
        optimized: optimizedServices,
        basic: basicServices,
        enterprise: this.getServicesByOptimizationLevel('enterprise').length
      },
      features: {
        strategyPatterns: this.getServicesByOptimizationLevel('advanced').length + 
                         this.getServicesByOptimizationLevel('enterprise').length,
        commandPatterns: this.getServicesByOptimizationLevel('enterprise').length,
        aggregationBuilders: optimizedServices
      }
    };
  }

  /**
   * Cleanup container resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Optimized Container...');
    
    if (this.optimizedRegistry) {
      await this.optimizedRegistry.cleanup();
    }

    this.initialized = false;
    console.log('✅ Optimized Container cleanup completed');
  }
}

// Legacy compatibility layer
export class LegacyOptimizedServiceContainer {
  private static instance: LegacyOptimizedServiceContainer;
  private optimizedContainer: OptimizedContainer;

  constructor() {
    this.optimizedContainer = OptimizedContainer.getInstance();
  }

  static getInstance(): LegacyOptimizedServiceContainer {
    if (!LegacyOptimizedServiceContainer.instance) {
      LegacyOptimizedServiceContainer.instance = new LegacyOptimizedServiceContainer();
    }
    return LegacyOptimizedServiceContainer.instance;
  }

  // Legacy method implementations
  getServiceRequestService(): IServiceRequestService {
    return this.optimizedContainer.getServiceRequestService();
  }

  getUserService(): IUserService {
    return this.optimizedContainer.getUserService();
  }

  getProviderService(): IProviderService {
    return this.optimizedContainer.getProviderService();
  }

  getReviewService(): IReviewService {
    return this.optimizedContainer.getReviewService();
  }

  getAuthService(): IAuthService {
    return this.optimizedContainer.getAuthService();
  }

  getAdminService(): IAdminService {
    return this.optimizedContainer.getAdminService();
  }

  getChatService(): IChatService {
    return this.optimizedContainer.getChatService();
  }
}

// Export instances
export const optimizedContainer = OptimizedContainer.getInstance();
export const legacyOptimizedServiceContainer = LegacyOptimizedServiceContainer.getInstance();
