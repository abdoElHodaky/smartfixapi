/**
 * Optimized Container
 * 
 * High-performance dependency injection container with advanced optimization features,
 * performance tracking, and enterprise-grade service management.
 */

import 'reflect-metadata';
import { Container } from '@decorators/di';
import { optimizedServiceRegistry, OptimizedServiceRegistry } from '../services/ServiceRegistry.optimized';
import { devMetricsCollector, DevMetricsCollector } from '../utils/performance/DevMetrics';
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
  enablePerformanceTracking: boolean;
  enableServiceMetrics: boolean;
  optimizationLevel: 'basic' | 'advanced' | 'enterprise';
}

/**
 * Optimized Container with advanced performance features
 */
export class OptimizedContainer {
  private static instance: OptimizedContainer;
  private container: Container;
  private optimizedRegistry: OptimizedServiceRegistry;
  private config: ContainerConfig;
  private initialized: boolean = false;

  private constructor(config: Partial<ContainerConfig> = {}) {
    this.config = {
      enablePerformanceTracking: true,
      enableServiceMetrics: true,
      optimizationLevel: 'advanced',
      ...config
    };

    this.container = new Container();
    this.optimizedRegistry = optimizedServiceRegistry;
  }

  /**
   * Get singleton instance
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
      await this.registerServiceProviders();

      this.initialized = true;
      console.log('✅ Optimized Container initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Optimized Container:', error);
      throw error;
    }
  }

  /**
   * Register service providers in the DI container
   */
  private async registerServiceProviders(): Promise<void> {
    const services = this.optimizedRegistry.getAllServices();
    
    for (const serviceName of services) {
      const serviceInstance = this.optimizedRegistry.getService(serviceName);
      this.container.provide([
        { provide: serviceName, useValue: serviceInstance }
      ]);
    }

    console.log(`✅ Registered ${services.length} service providers`);
  }

  /**
   * Get service with performance tracking
   */
  getService<T>(serviceName: string): T {
    const startTime = Date.now();
    
    try {
      const service = this.optimizedRegistry.getService<T>(serviceName);
      
      // Record performance metrics
      if (this.config.enableServiceMetrics) {
        const responseTime = Date.now() - startTime;
        devMetricsCollector.recordServiceCall(serviceName, responseTime, true);
      }
      
      return service;
    } catch (error) {
      // Record error metrics
      if (this.config.enableServiceMetrics) {
        const responseTime = Date.now() - startTime;
        devMetricsCollector.recordServiceCall(serviceName, responseTime, false);
      }
      
      throw error;
    }
  }

  /**
   * Get optimized service with full feature access
   */
  getOptimizedService<T>(serviceName: string): T {
    return this.getService<T>(serviceName);
  }

  /**
   * Check if service supports a specific feature
   */
  serviceSupportsFeature(serviceName: string, feature: 'strategy' | 'commands' | 'aggregation'): boolean {
    return this.optimizedRegistry.serviceSupportsFeature(serviceName, feature);
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
   * Health check for the container
   */
  async healthCheck(): Promise<{ [key: string]: any }> {
    const health = {
      initialized: this.initialized,
      config: this.config,
      services: await this.optimizedRegistry.healthCheck()
    };

    return health;
  }

  /**
   * Get service performance metrics
   */
  getServiceMetrics(serviceName?: string) {
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
   * Check if container is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get container configuration
   */
  getConfig(): ContainerConfig {
    return { ...this.config };
  }
}

// Export singleton instances
export const optimizedContainer = OptimizedContainer.getInstance();

// Legacy compatibility instance (for gradual migration)
export const legacyOptimizedServiceContainer = optimizedContainer;

