import { DIContainer } from './DIContainer';
import { AuthService } from '../services/auth/AuthService';
import { UserService } from '../services/user/UserService';
import { ProviderService } from '../services/provider/ProviderService';
import { ServiceRequestService } from '../services/request/ServiceRequestService';
import { ReviewService } from '../services/review/ReviewService';
import { AdminService } from '../services/admin/AdminService';
import { ChatService } from '../services/chat/ChatService';

/**
 * Service Registry - Configures and registers all services in the DI container
 */
export class ServiceRegistry {
  private container: DIContainer;

  constructor() {
    this.container = new DIContainer();
    this.registerServices();
  }

  /**
   * Register all services with their dependencies
   */
  private registerServices(): void {
    // Register AuthService (no dependencies)
    this.container.registerClass('AuthService', AuthService, {
      singleton: true,
      dependencies: []
    });

    // Register UserService (no external service dependencies)
    this.container.registerClass('UserService', UserService, {
      singleton: true,
      dependencies: []
    });

    // Register ProviderService (depends on UserService for user operations)
    this.container.registerClass('ProviderService', ProviderService, {
      singleton: true,
      dependencies: ['UserService']
    });

    // Register ServiceRequestService (depends on ProviderService and UserService)
    this.container.registerClass('ServiceRequestService', ServiceRequestService, {
      singleton: true,
      dependencies: ['ProviderService', 'UserService']
    });

    // Register ReviewService (depends on ServiceRequestService and ProviderService)
    this.container.registerClass('ReviewService', ReviewService, {
      singleton: true,
      dependencies: ['ServiceRequestService', 'ProviderService']
    });

    // Register AdminService (depends on all other services for admin operations)
    this.container.registerClass('AdminService', AdminService, {
      singleton: true,
      dependencies: ['UserService', 'ProviderService', 'ServiceRequestService', 'ReviewService']
    });

    // Register ChatService (depends on UserService for user validation)
    this.container.registerClass('ChatService', ChatService, {
      singleton: true,
      dependencies: ['UserService']
    });
  }

  /**
   * Get the configured DI container
   */
  getContainer(): DIContainer {
    return this.container;
  }

  /**
   * Get a service instance by name
   */
  getService<T>(serviceName: string): T {
    return this.container.resolve<T>(serviceName);
  }

  /**
   * Register additional services at runtime
   */
  registerService<T>(
    name: string,
    ServiceClass: new (...args: any[]) => T,
    dependencies: string[] = []
  ): void {
    this.container.registerClass(name, ServiceClass, {
      singleton: true,
      dependencies
    });
  }

  /**
   * Create a new registry instance (useful for testing)
   */
  static create(): ServiceRegistry {
    return new ServiceRegistry();
  }
}
