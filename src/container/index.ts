/**
 * Enhanced Container Index with Optimized Service Support
 * 
 * Provides both legacy compatibility and optimized service access
 * with automatic fallback and feature detection.
 */

import { ServiceRegistry as DecoratorServiceRegistry } from '../services/ServiceRegistry.decorator';
import { OptimizedServiceRegistry, optimizedServiceRegistry } from '../services/ServiceRegistry.optimized';
import { OptimizedContainer, optimizedContainer, legacyOptimizedServiceContainer } from './OptimizedContainer';
import { moduleManager } from '../decorators/module';
import { 
  IAuthService, 
  IUserService, 
  IProviderService, 
  IServiceRequestService, 
  IReviewService, 
  IAdminService, 
  IChatService 
} from '../interfaces/services';

// Export optimized systems
export { OptimizedServiceRegistry, optimizedServiceRegistry } from '../services/ServiceRegistry.optimized';
export { OptimizedContainer, optimizedContainer, legacyOptimizedServiceContainer } from './OptimizedContainer';
export { ServiceRegistry as DecoratorServiceRegistry } from '../services/ServiceRegistry.decorator';
export { moduleManager } from '../decorators/module';

// Configuration for container behavior
export interface ContainerMode {
  useOptimizedServices: boolean;
  enableAutoFallback: boolean;
  enablePerformanceTracking: boolean;
}

// Global container configuration
let containerMode: ContainerMode = {
  useOptimizedServices: true,
  enableAutoFallback: true,
  enablePerformanceTracking: true
};

/**
 * Enhanced Service Container with Optimization Support
 */
class EnhancedServiceContainer {
  private static instance: EnhancedServiceContainer;
  private legacyServiceRegistry: DecoratorServiceRegistry;
  private optimizedContainer: OptimizedContainer;
  private initialized: boolean = false;

  constructor() {
    this.legacyServiceRegistry = new DecoratorServiceRegistry();
    this.optimizedContainer = optimizedContainer;
  }

  static getInstance(): EnhancedServiceContainer {
    if (!EnhancedServiceContainer.instance) {
      EnhancedServiceContainer.instance = new EnhancedServiceContainer();
    }
    return EnhancedServiceContainer.instance;
  }

  /**
   * Initialize the enhanced container
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🚀 Initializing Enhanced Service Container...');
    
    try {
      if (containerMode.useOptimizedServices) {
        await this.optimizedContainer.initialize();
        console.log('✅ Optimized services initialized');
      }
      
      this.initialized = true;
      console.log('✅ Enhanced Service Container initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Service Container:', error);
      
      if (containerMode.enableAutoFallback) {
        console.log('🔄 Falling back to legacy services only...');
        containerMode.useOptimizedServices = false;
        this.initialized = true;
      } else {
        throw error;
      }
    }
  }

  /**
   * Get service with automatic optimization detection
   */
  private getServiceWithFallback<T>(serviceName: string): T {
    if (containerMode.useOptimizedServices) {
      try {
        return this.optimizedContainer.getService<T>(serviceName);
      } catch (error) {
        if (containerMode.enableAutoFallback) {
          console.warn(`⚠️ Falling back to legacy ${serviceName}:`, error instanceof Error ? error.message : String(error));
          return this.legacyServiceRegistry.getService<T>(serviceName);
        }
        throw error;
      }
    }
    return this.legacyServiceRegistry.getService<T>(serviceName);
  }

  // Service getter methods with optimization support
  getServiceRequestService(): IServiceRequestService {
    return this.getServiceWithFallback<IServiceRequestService>('ServiceRequestService');
  }

  getUserService(): IUserService {
    return this.getServiceWithFallback<IUserService>('UserService');
  }

  getProviderService(): IProviderService {
    return this.getServiceWithFallback<IProviderService>('ProviderService');
  }

  getReviewService(): IReviewService {
    return this.getServiceWithFallback<IReviewService>('ReviewService');
  }

  getAuthService(): IAuthService {
    return this.getServiceWithFallback<IAuthService>('AuthService');
  }

  getAdminService(): IAdminService {
    // Always prefer the optimized strategy-based AdminService when available
    if (containerMode.useOptimizedServices) {
      try {
        return this.optimizedContainer.getAdminService();
      } catch (error) {
        if (containerMode.enableAutoFallback) {
          console.warn('⚠️ Falling back to legacy AdminService:', error instanceof Error ? error.message : String(error));
          return this.legacyServiceRegistry.getService<IAdminService>('AdminService');
        }
        throw error;
      }
    }
    return this.legacyServiceRegistry.getService<IAdminService>('AdminService');
  }

  getChatService(): IChatService {
    return this.getServiceWithFallback<IChatService>('ChatService');
  }

  /**
   * Get optimized service with full feature access
   */
  getOptimizedService<T>(serviceName: string) {
    if (!containerMode.useOptimizedServices) {
      throw new Error('Optimized services are disabled');
    }
    return this.optimizedContainer.getOptimizedService<T>(serviceName);
  }

  /**
   * Get service performance metrics
   */
  getServiceMetrics(serviceName?: string) {
    if (!containerMode.enablePerformanceTracking) {
      throw new Error('Performance tracking is disabled');
    }
    return this.optimizedContainer.getServiceMetrics(serviceName);
  }

  /**
   * Check if service supports optimization features
   */
  serviceSupportsFeature(serviceName: string, feature: 'strategy' | 'commands' | 'aggregation'): boolean {
    if (!containerMode.useOptimizedServices) {
      return false;
    }
    return this.optimizedContainer.serviceSupportsFeature(serviceName, feature);
  }

  /**
   * Get container health status
   */
  async getHealthStatus() {
    const health = {
      initialized: this.initialized,
      mode: containerMode,
      services: {
        legacy: true,
        optimized: containerMode.useOptimizedServices
      }
    };

    if (containerMode.useOptimizedServices) {
      try {
        const optimizedHealth = await this.optimizedContainer.healthCheck();
        return { ...health, optimizedServices: optimizedHealth };
      } catch (error) {
        return { ...health, optimizedServices: { error: error instanceof Error ? error.message : String(error) } };
      }
    }

    return health;
  }

  /**
   * Switch container mode
   */
  async switchMode(newMode: Partial<ContainerMode>): Promise<void> {
    const oldMode = { ...containerMode };
    containerMode = { ...containerMode, ...newMode };

    console.log('🔄 Switching container mode:', { from: oldMode, to: containerMode });

    if (containerMode.useOptimizedServices && !oldMode.useOptimizedServices) {
      await this.optimizedContainer.initialize();
    }

    console.log('✅ Container mode switched successfully');
  }
}

// Legacy compatibility - create minimal service container interface
class LegacyServiceContainer {
  private static instance: LegacyServiceContainer;
  private enhancedContainer: EnhancedServiceContainer;

  constructor() {
    this.enhancedContainer = EnhancedServiceContainer.getInstance();
  }

  static getInstance(): LegacyServiceContainer {
    if (!LegacyServiceContainer.instance) {
      LegacyServiceContainer.instance = new LegacyServiceContainer();
    }
    return LegacyServiceContainer.instance;
  }

  // Legacy methods for backward compatibility
  getServiceRequestService(): IServiceRequestService {
    return this.enhancedContainer.getServiceRequestService();
  }

  getUserService(): IUserService {
    return this.enhancedContainer.getUserService();
  }

  getProviderService(): IProviderService {
    return this.enhancedContainer.getProviderService();
  }

  getReviewService(): IReviewService {
    return this.enhancedContainer.getReviewService();
  }

  getAuthService(): IAuthService {
    return this.enhancedContainer.getAuthService();
  }

  getAdminService(): IAdminService {
    return this.enhancedContainer.getAdminService();
  }

  getChatService(): IChatService {
    return this.enhancedContainer.getChatService();
  }
}

// Export instances
export const enhancedServiceContainer = EnhancedServiceContainer.getInstance();
export const serviceContainer = LegacyServiceContainer.getInstance();
export const serviceRegistry = new DecoratorServiceRegistry();

// NEW: Module manager instance for the modular architecture
export { moduleManager as globalModuleManager };

// Utility functions for container management
export const containerUtils = {
  /**
   * Initialize the container system
   */
  async initialize(): Promise<void> {
    await enhancedServiceContainer.initialize();
  },

  /**
   * Get current container mode
   */
  getMode(): ContainerMode {
    return { ...containerMode };
  },

  /**
   * Switch to optimized services
   */
  async enableOptimizedServices(): Promise<void> {
    await enhancedServiceContainer.switchMode({ useOptimizedServices: true });
  },

  /**
   * Switch to legacy services only
   */
  async disableOptimizedServices(): Promise<void> {
    await enhancedServiceContainer.switchMode({ useOptimizedServices: false });
  },

  /**
   * Enable performance tracking
   */
  async enablePerformanceTracking(): Promise<void> {
    await enhancedServiceContainer.switchMode({ enablePerformanceTracking: true });
  },

  /**
   * Get container health status
   */
  async getHealthStatus() {
    return await enhancedServiceContainer.getHealthStatus();
  },

  /**
   * Get service metrics (if performance tracking is enabled)
   */
  getServiceMetrics(serviceName?: string) {
    return enhancedServiceContainer.getServiceMetrics(serviceName);
  },

  /**
   * Check if service supports optimization features
   */
  serviceSupportsFeature(serviceName: string, feature: 'strategy' | 'commands' | 'aggregation'): boolean {
    return enhancedServiceContainer.serviceSupportsFeature(serviceName, feature);
  }
};
