import { ServiceContainer } from './ServiceContainer';
import { AuthService } from '../services/auth/AuthService';
import { AdminService } from '../services/admin/AdminService';
import { ChatService } from '../services/chat/ChatService';
import { 
  IAuthService, 
  IUserService, 
  IProviderService, 
  IServiceRequestService, 
  IReviewService,
  IAdminService,
  IChatService
} from '../interfaces/services';

/**
 * Service Registry - Provides access to all services via the ServiceContainer
 * Maintains backward compatibility with existing controllers
 */
export class ServiceRegistry {
  private serviceContainer: ServiceContainer;
  private authService: IAuthService;
  private adminService: IAdminService;
  private chatService: IChatService;

  constructor() {
    this.serviceContainer = ServiceContainer.getInstance();
    this.initializeAdditionalServices();
  }

  /**
   * Initialize services not handled by ServiceContainer
   */
  private initializeAdditionalServices(): void {
    // AuthService has no dependencies on other domain services
    this.authService = new AuthService();

    // AdminService depends on all core services
    this.adminService = new AdminService(
      this.serviceContainer.getUserService(),
      this.serviceContainer.getProviderService(),
      this.serviceContainer.getServiceRequestService(),
      this.serviceContainer.getReviewService()
    );

    // ChatService depends on UserService
    this.chatService = new ChatService(
      this.serviceContainer.getUserService()
    );
  }

  /**
   * Get a service instance by name (maintains backward compatibility)
   */
  getService<T>(serviceName: string): T {
    switch (serviceName) {
      case 'AuthService':
        return this.authService as T;
      case 'UserService':
        return this.serviceContainer.getUserService() as T;
      case 'ProviderService':
        return this.serviceContainer.getProviderService() as T;
      case 'ServiceRequestService':
        return this.serviceContainer.getServiceRequestService() as T;
      case 'ReviewService':
        return this.serviceContainer.getReviewService() as T;
      case 'AdminService':
        return this.adminService as T;
      case 'ChatService':
        return this.chatService as T;
      default:
        throw new Error(`Service '${serviceName}' not found`);
    }
  }

  /**
   * Get the ServiceContainer instance
   */
  getServiceContainer(): ServiceContainer {
    return this.serviceContainer;
  }

  /**
   * Get AuthService instance
   */
  getAuthService(): IAuthService {
    return this.authService;
  }

  /**
   * Get AdminService instance
   */
  getAdminService(): IAdminService {
    return this.adminService;
  }

  /**
   * Get ChatService instance
   */
  getChatService(): IChatService {
    return this.chatService;
  }

  /**
   * Create a new registry instance (useful for testing)
   */
  static create(): ServiceRegistry {
    return new ServiceRegistry();
  }

  /**
   * Reset the registry (useful for testing)
   */
  static reset(): void {
    ServiceContainer.reset();
  }
}
