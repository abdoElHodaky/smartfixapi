/**
 * Optimized Container Configuration
 * 
 * Enhanced dependency injection container that uses optimized services
 * with strategy patterns, command handlers, and aggregation builders.
 */

import 'reflect-metadata';
import { Container } from '@decorators/di';
import { optimizedServiceRegistry, OptimizedServiceRegistry } from '../services/ServiceRegistry.optimized';
import { devMetricsCollector } from '../utils/performance/DevMetrics';
import { 
  IAuthService, 
  IUserService, 
  IProviderService, 
  IServiceRequestService, 
  IReviewService, 
  IAdminService, 
  IChatService, 
} from '../interfaces/services';

// Configuration options
export interface ContainerConfig {
  enablePerformanceTracking: boolean;
  enableServiceMetrics: boolean;
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
  private initialized = false;

  private constructor(config: Partial<ContainerConfig> = {}) {
    this.config = {
      enablePerformanceTracking: true,
      enableServiceMetrics: true,
      optimizationLevel: 'advanced',
      ...config,
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
    console.log('📊 Configuration:', this.config);

    try {
      await this.optimizedRegistry.initialize();
      console.log('✅ Optimized services initialized');

      // Initialize development metrics for all services
      if (this.config.enableServiceMetrics) {
        console.log('📊 Initializing development metrics...');
        const serviceNames = this.optimizedRegistry.getServicesByOptimizationLevel('basic')
          .concat(this.optimizedRegistry.getServicesByOptimizationLevel('advanced'))
          .concat(this.optimizedRegistry.getServicesByOptimizationLevel('enterprise'));
        
        for (const serviceName of serviceNames) {
          const baseMetrics = this.optimizedRegistry.getServiceMetrics(serviceName);
          if (baseMetrics && !Array.isArray(baseMetrics)) {
            devMetricsCollector.initializeServiceMetrics(serviceName, baseMetrics);
          }
        }
        console.log('✅ Development metrics initialized');
      }

      // Register service providers in the container
      this.registerServiceProviders();

      this.initialized = true;
      console.log('✅ Optimized Container initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Optimized Container:', error);
      throw error;
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
        useFactory: () => this.getAuthService(),
      },
      {
        provide: 'UserService',
        useFactory: () => this.getUserService(),
      },
      {
        provide: 'ProviderService',
        useFactory: () => this.getProviderService(),
      },
      {
        provide: 'ServiceRequestService',
        useFactory: () => this.getServiceRequestService(),
      },
      {
        provide: 'ReviewService',
        useFactory: () => this.getReviewService(),
      },
      {
        provide: 'AdminService',
        useFactory: () => this.getAdminService(),
      },
      {
        provide: 'ChatService',
        useFactory: () => this.getChatService(),
      },
    ]);
  }

  /**
   * Initialize optimized services only
   */
  private async initializeOptimizedServices(): Promise<void> {
    console.log('🔄 Initializing optimized services...');
    await this.optimizedRegistry.initialize();
    this.initialized = true;
    console.log('✅ Optimized services initialized');
  }

  /**
   * Get AuthService with optimization features
   */
  getAuthService(): IAuthService {
    return this.optimizedRegistry.getService<IAuthService>('AuthService');
  }

  /**
   * Get UserService with optimization features
   */
  getUserService(): IUserService {
    return this.optimizedRegistry.getService<IUserService>('UserService');
  }

  /**
   * Get ProviderService with optimization features
   */
  getProviderService(): IProviderService {
    return this.optimizedRegistry.getService<IProviderService>('ProviderService');
  }

  /**
   * Get ServiceRequestService with optimization features
   */
  getServiceRequestService(): IServiceRequestService {
    return this.optimizedRegistry.getService<IServiceRequestService>('ServiceRequestService');
  }

  /**
   * Get ReviewService with optimization features
   */
  getReviewService(): IReviewService {
    return this.optimizedRegistry.getService<IReviewService>('ReviewService');
  }

  /**
   * Get AdminService with optimization features (Strategy-based)
   */
  getAdminService(): IAdminService {
    // Always use the optimized strategy-based AdminService
    return this.optimizedRegistry.getService<IAdminService>('AdminService');
  }

  /**
   * Get ChatService with optimization features
   */
  getChatService(): IChatService {
    return this.optimizedRegistry.getService<IChatService>('ChatService');
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
   * Get development performance metrics (enhanced)
   */
  getDevMetrics(serviceName?: string) {
    if (process.env.NODE_ENV === 'production' && !this.config.enablePerformanceTracking) {
      throw new Error('Development metrics are disabled in production');
    }

    if (serviceName) {
      return devMetricsCollector.getServiceMetrics(serviceName);
    }

    return devMetricsCollector.getAllMetrics();
  }

  /**
   * Get development performance summary
   */
  getDevPerformanceSummary() {
    if (process.env.NODE_ENV === 'production' && !this.config.enablePerformanceTracking) {
      throw new Error('Development metrics are disabled in production');
    }

    return devMetricsCollector.getPerformanceSummary();
  }

  /**
   * Generate development performance report
   */
  generateDevReport(): string {
    if (process.env.NODE_ENV === 'production' && !this.config.enablePerformanceTracking) {
      throw new Error('Development metrics are disabled in production');
    }

    return devMetricsCollector.generateDevReport();
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
        config: this.config,
      },
      services: optimizedHealth,
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
        enterprise: this.getServicesByOptimizationLevel('enterprise').length,
      },
      features: {
        strategyPatterns: this.getServicesByOptimizationLevel('advanced').length + 
                         this.getServicesByOptimizationLevel('enterprise').length,
        commandPatterns: this.getServicesByOptimizationLevel('enterprise').length,
        aggregationBuilders: optimizedServices,
      },
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
