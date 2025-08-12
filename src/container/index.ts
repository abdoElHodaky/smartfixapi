/**
 * Unified Container Index - Optimized Service Registry Only
 * 
 * Provides unified service access through the OptimizedContainer.
 * Legacy service registries have been removed for consistency.
 */

import { OptimizedContainer, optimizedContainer } from './OptimizedContainer';
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

// Export optimized systems only
export { OptimizedServiceRegistry, optimizedServiceRegistry } from '../services/ServiceRegistry.optimized';
export { OptimizedContainer, optimizedContainer } from './OptimizedContainer';
export { moduleManager } from '../decorators/module';

/**
 * Unified Service Container - Direct OptimizedContainer Access
 */
class UnifiedServiceContainer {
  private static instance: UnifiedServiceContainer;
  private optimizedContainer: OptimizedContainer;
  private initialized: boolean = false;

  constructor() {
    this.optimizedContainer = optimizedContainer;
  }

  static getInstance(): UnifiedServiceContainer {
    if (!UnifiedServiceContainer.instance) {
      UnifiedServiceContainer.instance = new UnifiedServiceContainer();
    }
    return UnifiedServiceContainer.instance;
  }

  /**
   * Initialize the unified container
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🚀 Initializing Unified Service Container...');
    
    try {
      await this.optimizedContainer.initialize();
      console.log('✅ Optimized services initialized');
      
      this.initialized = true;
      console.log('✅ Unified Service Container initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Unified Service Container:', error);
      throw error;
    }
  }

  // Direct service getter methods using optimized container
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

  /**
   * Get optimized service with full feature access
   */
  getOptimizedService<T>(serviceName: string) {
    return this.optimizedContainer.getOptimizedService<T>(serviceName);
  }

  /**
   * Get service performance metrics
   */
  getServiceMetrics(serviceName?: string) {
    return this.optimizedContainer.getServiceMetrics(serviceName);
  }

  /**
   * Check if service supports optimization features
   */
  serviceSupportsFeature(serviceName: string, feature: 'strategy' | 'commands' | 'aggregation'): boolean {
    return this.optimizedContainer.serviceSupportsFeature(serviceName, feature);
  }

  /**
   * Get container health status
   */
  async getHealthStatus() {
    const health = {
      initialized: this.initialized,
      containerType: 'unified-optimized'
    };

    try {
      const optimizedHealth = await this.optimizedContainer.healthCheck();
      return { ...health, services: optimizedHealth };
    } catch (error) {
      return { ...health, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

// Export unified container instance
export const serviceContainer = UnifiedServiceContainer.getInstance();
export const serviceRegistry = serviceContainer; // Alias for backward compatibility

// NEW: Module manager instance for the modular architecture
export { moduleManager as globalModuleManager };

// Export service interfaces for type safety
export type {
  IAuthService,
  IUserService,
  IProviderService,
  IServiceRequestService,
  IReviewService,
  IAdminService,
  IChatService
};

// Export development metrics utilities
export { devMetricsCollector } from '../utils/performance/DevMetrics';

/**
 * Initialize the unified container system
 * This should be called during application startup
 */
export async function initializeContainer(): Promise<void> {
  console.log('🔧 Initializing unified container system...');
  
  try {
    await serviceContainer.initialize();
    console.log('✅ Unified container system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize container system:', error);
    throw error;
  }
}

/**
 * Get container health status
 */
export async function getContainerHealth() {
  return await serviceContainer.getHealthStatus();
}

/**
 * Get development metrics (if enabled)
 */
export function getDevMetrics(serviceName?: string) {
  return optimizedContainer.getDevMetrics(serviceName);
}

/**
 * Generate development performance report
 */
export function generateDevReport(): string {
  return optimizedContainer.generateDevReport();
}

