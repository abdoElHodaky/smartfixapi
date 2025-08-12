// LEGACY COMPATIBILITY LAYER
// Note: Original container files were removed during cleanup
// This provides compatibility for any remaining legacy code

import { ServiceRegistry as DecoratorServiceRegistry } from '../services/ServiceRegistry.decorator';
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

// NEW MODULAR SYSTEM
export { ServiceRegistry as DecoratorServiceRegistry } from '../services/ServiceRegistry.decorator';
export { moduleManager } from '../decorators/module';

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
  getServiceRequestService(): IServiceRequestService {
    return this.serviceRegistry.getService<IServiceRequestService>('ServiceRequestService');
  }

  getUserService(): IUserService {
    return this.serviceRegistry.getService<IUserService>('UserService');
  }

  getProviderService(): IProviderService {
    return this.serviceRegistry.getService<IProviderService>('ProviderService');
  }

  getReviewService(): IReviewService {
    return this.serviceRegistry.getService<IReviewService>('ReviewService');
  }

  getAuthService(): IAuthService {
    return this.serviceRegistry.getService<IAuthService>('AuthService');
  }

  getAdminService(): IAdminService {
    return this.serviceRegistry.getService<IAdminService>('AdminService');
  }

  getChatService(): IChatService {
    return this.serviceRegistry.getService<IChatService>('ChatService');
  }
}

// Export legacy compatibility instances
export const serviceContainer = LegacyServiceContainer.getInstance();
export const serviceRegistry = new DecoratorServiceRegistry();

// NEW: Module manager instance for the modular architecture
export { moduleManager as globalModuleManager };
