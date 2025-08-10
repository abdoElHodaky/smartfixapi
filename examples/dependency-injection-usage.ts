/**
 * Dependency Injection Usage Examples
 * 
 * This file demonstrates how to use the DI container and service registry
 * in various scenarios throughout the application.
 */

import { serviceRegistry, DIContainer } from '../src/container';
import { IAuthService, IUserService, IProviderService } from '../src/interfaces/services';
import { UserRegistrationDto, LoginDto } from '../src/dtos';

// Example 1: Basic Service Resolution
export function basicServiceUsage() {
  console.log('=== Basic Service Usage ===');
  
  // Get services from the registry
  const authService = serviceRegistry.getService<IAuthService>('AuthService');
  const userService = serviceRegistry.getService<IUserService>('UserService');
  
  console.log('✅ Services resolved successfully');
  console.log('Available services:', serviceRegistry.getContainer().getRegisteredServices());
}

// Example 2: Using Services in Business Logic
export async function businessLogicExample() {
  console.log('=== Business Logic Example ===');
  
  try {
    const authService = serviceRegistry.getService<IAuthService>('AuthService');
    
    // Example user registration
    const userData: UserRegistrationDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'securePassword123',
      phone: '+1234567890',
      role: 'user'
    };
    
    // Register user using the service
    const result = await authService.register(userData);
    console.log('✅ User registered:', result);
    
    // Login example
    const loginData: LoginDto = {
      email: 'john.doe@example.com',
      password: 'securePassword123'
    };
    
    const loginResult = await authService.login(loginData);
    console.log('✅ User logged in:', loginResult);
    
  } catch (error) {
    console.error('❌ Business logic error:', error);
  }
}

// Example 3: Custom Service Registration
export function customServiceRegistration() {
  console.log('=== Custom Service Registration ===');
  
  // Create a new container for testing
  const container = new DIContainer();
  
  // Register a custom service
  class EmailService {
    async sendEmail(to: string, subject: string, body: string): Promise<void> {
      console.log(`📧 Sending email to ${to}: ${subject}`);
      // Email sending logic here
    }
  }
  
  // Register the service
  container.registerClass('EmailService', EmailService, {
    singleton: true,
    dependencies: []
  });
  
  // Resolve and use the service
  const emailService = container.resolve<EmailService>('EmailService');
  emailService.sendEmail('user@example.com', 'Welcome!', 'Welcome to our platform');
  
  console.log('✅ Custom service registered and used');
}

// Example 4: Service Dependencies
export function serviceDependencyExample() {
  console.log('=== Service Dependency Example ===');
  
  const container = new DIContainer();
  
  // Define services with dependencies
  class DatabaseService {
    connect(): void {
      console.log('🔌 Database connected');
    }
  }
  
  class CacheService {
    constructor(private dbService: DatabaseService) {}
    
    get(key: string): any {
      this.dbService.connect();
      console.log(`📦 Getting ${key} from cache`);
      return null;
    }
  }
  
  class UserService {
    constructor(
      private dbService: DatabaseService,
      private cacheService: CacheService
    ) {}
    
    getUser(id: string): any {
      console.log(`👤 Getting user ${id}`);
      this.cacheService.get(`user:${id}`);
      return { id, name: 'John Doe' };
    }
  }
  
  // Register services with dependencies
  container.registerClass('DatabaseService', DatabaseService);
  container.registerClass('CacheService', CacheService, {
    dependencies: ['DatabaseService']
  });
  container.registerClass('UserService', UserService, {
    dependencies: ['DatabaseService', 'CacheService']
  });
  
  // Resolve service - dependencies are automatically injected
  const userService = container.resolve<UserService>('UserService');
  const user = userService.getUser('123');
  
  console.log('✅ Service with dependencies resolved:', user);
}

// Example 5: Testing with DI
export function testingWithDI() {
  console.log('=== Testing with DI ===');
  
  // Create a test container
  const testContainer = new DIContainer();
  
  // Mock service for testing
  class MockAuthService implements IAuthService {
    async register(userData: UserRegistrationDto) {
      return {
        success: true,
        message: 'Mock registration successful',
        data: { id: 'mock-id', ...userData }
      };
    }
    
    async login(credentials: LoginDto) {
      return {
        success: true,
        message: 'Mock login successful',
        data: { token: 'mock-token', user: { email: credentials.email } }
      };
    }
    
    // Implement other required methods...
    generateToken = jest.fn();
    verifyToken = jest.fn();
    hashPassword = jest.fn();
    comparePassword = jest.fn();
    registerProvider = jest.fn();
    changePassword = jest.fn();
    resetPassword = jest.fn();
    refreshToken = jest.fn();
    verifyEmail = jest.fn();
    getUserProfile = jest.fn();
    deactivateAccount = jest.fn();
  }
  
  // Register mock service
  testContainer.register('AuthService', () => new MockAuthService());
  
  // Use in tests
  const mockAuthService = testContainer.resolve<IAuthService>('AuthService');
  console.log('✅ Mock service ready for testing');
}

// Example 6: Service Factory Pattern
export function serviceFactoryExample() {
  console.log('=== Service Factory Example ===');
  
  const container = new DIContainer();
  
  // Factory function for creating configured services
  const createConfiguredService = (config: any) => {
    return class ConfiguredService {
      constructor() {
        console.log('🔧 Service configured with:', config);
      }
      
      doSomething(): void {
        console.log('⚡ Doing something with config:', config.feature);
      }
    };
  };
  
  // Register service using factory
  container.register('ConfiguredService', () => {
    const ServiceClass = createConfiguredService({ feature: 'advanced' });
    return new ServiceClass();
  });
  
  const service = container.resolve('ConfiguredService');
  service.doSomething();
  
  console.log('✅ Factory pattern service created');
}

// Example 7: Circular Dependency Detection
export function circularDependencyExample() {
  console.log('=== Circular Dependency Detection ===');
  
  const container = new DIContainer();
  
  class ServiceA {
    constructor(private serviceB: any) {}
  }
  
  class ServiceB {
    constructor(private serviceA: any) {}
  }
  
  // Register services with circular dependency
  container.registerClass('ServiceA', ServiceA, { dependencies: ['ServiceB'] });
  container.registerClass('ServiceB', ServiceB, { dependencies: ['ServiceA'] });
  
  try {
    container.resolve('ServiceA');
  } catch (error) {
    console.log('✅ Circular dependency detected:', error.message);
  }
}

// Example 8: Child Container
export function childContainerExample() {
  console.log('=== Child Container Example ===');
  
  const parentContainer = new DIContainer();
  
  // Register service in parent
  class ParentService {
    getName(): string {
      return 'Parent Service';
    }
  }
  
  parentContainer.registerClass('ParentService', ParentService);
  
  // Create child container
  const childContainer = parentContainer.createChild();
  
  // Override service in child
  class ChildService {
    getName(): string {
      return 'Child Service';
    }
  }
  
  childContainer.registerClass('ParentService', ChildService);
  
  // Resolve from both containers
  const parentService = parentContainer.resolve<ParentService>('ParentService');
  const childService = childContainer.resolve<ParentService>('ParentService');
  
  console.log('Parent container service:', parentService.getName());
  console.log('Child container service:', childService.getName());
  console.log('✅ Child container inheritance working');
}

// Run all examples
export function runAllExamples() {
  console.log('🚀 Running Dependency Injection Examples\n');
  
  basicServiceUsage();
  console.log();
  
  customServiceRegistration();
  console.log();
  
  serviceDependencyExample();
  console.log();
  
  testingWithDI();
  console.log();
  
  serviceFactoryExample();
  console.log();
  
  circularDependencyExample();
  console.log();
  
  childContainerExample();
  console.log();
  
  console.log('✅ All examples completed successfully!');
}

// Export for use in other files
export {
  serviceRegistry,
  DIContainer
};

