import { UserService } from '../services/user/UserService';
import { ProviderService } from '../services/provider/ProviderService';
import { ServiceRequestService } from '../services/request/ServiceRequestService';
import { ReviewService } from '../services/review/ReviewService';
import { 
  IUserService, 
  IProviderService, 
  IServiceRequestService, 
  IReviewService 
} from '../interfaces/services';

/**
 * Service Container for Dependency Injection
 * Manages service instantiation and dependency resolution
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  
  private userService: IUserService;
  private providerService: IProviderService;
  private serviceRequestService: IServiceRequestService;
  private reviewService: IReviewService;

  private constructor() {
    // Initialize services with proper dependency injection
    this.initializeServices();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  private initializeServices(): void {
    // Create base services first (no dependencies)
    this.reviewService = new ReviewService(
      undefined as any, // Will be set after ServiceRequestService is created
      undefined as any  // Will be set after ProviderService is created
    );

    // Create UserService with minimal dependencies
    this.userService = new UserService();

    // Create ProviderService with UserService dependency
    this.providerService = new ProviderService(
      this.userService,
      this.reviewService,
      undefined as any // Will be set after ServiceRequestService is created
    );

    // Create ServiceRequestService with all dependencies
    this.serviceRequestService = new ServiceRequestService(
      this.providerService,
      this.userService,
      this.reviewService
    );

    // Now inject the missing dependencies
    this.injectDependencies();
  }

  private injectDependencies(): void {
    // Inject ServiceRequestService into UserService
    (this.userService as any).serviceRequestService = this.serviceRequestService;
    (this.userService as any).reviewService = this.reviewService;

    // Inject ServiceRequestService into ProviderService
    (this.providerService as any).serviceRequestService = this.serviceRequestService;

    // Inject dependencies into ReviewService
    (this.reviewService as any).serviceRequestService = this.serviceRequestService;
    (this.reviewService as any).providerService = this.providerService;
  }

  // Getter methods for services
  public getUserService(): IUserService {
    return this.userService;
  }

  public getProviderService(): IProviderService {
    return this.providerService;
  }

  public getServiceRequestService(): IServiceRequestService {
    return this.serviceRequestService;
  }

  public getReviewService(): IReviewService {
    return this.reviewService;
  }

  /**
   * Reset the container (useful for testing)
   */
  public static reset(): void {
    ServiceContainer.instance = undefined as any;
  }
}

// Export singleton instance
export const serviceContainer = ServiceContainer.getInstance();
