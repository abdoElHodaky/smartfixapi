// LEGACY COMPATIBILITY LAYER
// Note: Original container files were removed during cleanup
// This provides compatibility for any remaining legacy code

import { ServiceRegistry as DecoratorServiceRegistry } from '../services/ServiceRegistry.decorator';
import { moduleManager, ModuleManager } from '../decorators/module';

// NEW MODULAR SYSTEM
export { ServiceRegistry as DecoratorServiceRegistry } from '../services/ServiceRegistry.decorator';
export { moduleManager, ModuleManager } from '../decorators/module';

// Legacy compatibility - create minimal service container interface
class LegacyServiceContainer {
  private static instance: LegacyServiceContainer;
  private serviceRegistry: DecoratorServiceRegistry;

  constructor() {
    this.serviceRegistry = new DecoratorServiceRegistry();
  }

  static getInstance(): LegacyServiceContainer {
    if (!LegacyServiceContainer.instance) {
      LegacyServiceContainer.instance = new LegacyServiceContainer();
    }
    return LegacyServiceContainer.instance;
  }

  // Legacy methods for backward compatibility
  getServiceRequestService() {
    return this.serviceRegistry.getService('ServiceRequestService');
  }

  getUserService() {
    return this.serviceRegistry.getService('UserService');
  }

  getProviderService() {
    return this.serviceRegistry.getService('ProviderService');
  }

  getReviewService() {
    return this.serviceRegistry.getService('ReviewService');
  }

  getAuthService() {
    return this.serviceRegistry.getService('AuthService');
  }

  getAdminService() {
    return this.serviceRegistry.getService('AdminService');
  }

  getChatService() {
    return this.serviceRegistry.getService('ChatService');
  }
}

// Export legacy compatibility instances
export const serviceContainer = LegacyServiceContainer.getInstance();
export const serviceRegistry = new DecoratorServiceRegistry();

// NEW: Module manager instance for the modular architecture
export { moduleManager as globalModuleManager };
