# Decorator-Based Services Implementation Guide

## Overview

This document describes the comprehensive implementation of decorator-based services for the SmartFix Service Providers platform. The implementation uses modern TypeScript decorators to provide enhanced functionality including dependency injection, lifecycle management, caching, retry logic, and comprehensive logging.

## Architecture

### Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   AuthService   │  │   UserService   │  │ ProviderSvc  │ │
│  │   @Singleton    │  │   @Singleton    │  │  @Singleton  │ │
│  │   @Service      │  │   @Service      │  │  @Service    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                Service Registry                             │
│  - Dependency Injection                                     │
│  - Lifecycle Management                                     │
│  - Service Discovery                                        │
├─────────────────────────────────────────────────────────────┤
│                Service Decorators                           │
│  @Cached | @Retryable | @Log | @Validate                   │
├─────────────────────────────────────────────────────────────┤
│                 @decorators/di                              │
│                 @decorators/server                          │
└─────────────────────────────────────────────────────────────┘
```

## Service Decorators

### Class Decorators

#### `@Injectable()`
Marks a class as injectable for dependency injection.

```typescript
@Injectable()
@Singleton()
export class AuthService {
  // Service implementation
}
```

#### `@Singleton()`
Ensures only one instance of the service is created.

```typescript
@Singleton()
export class AuthService {
  // Single instance across the application
}
```

#### `@Scoped()`
Creates a new instance per request scope.

```typescript
@Scoped()
export class RequestScopedService {
  // New instance per request
}
```

#### `@Transient()`
Creates a new instance every time the service is requested.

```typescript
@Transient()
export class TransientService {
  // New instance every time
}
```

#### `@Service(config)`
Configures service behavior and metadata.

```typescript
@Service({
  scope: ServiceScope.SINGLETON,
  lazy: false,
  priority: 1
})
export class AuthService {
  // Service with custom configuration
}
```

### Method Decorators

#### `@Cached(ttl | config)`
Caches method results for improved performance.

```typescript
@Cached(5 * 60 * 1000) // Cache for 5 minutes
async getUserProfile(userId: string) {
  // Method implementation
}

@Cached({
  ttl: 10 * 60 * 1000,
  key: 'custom-key',
  condition: (args) => args[0] !== 'admin'
})
async getUser(userId: string) {
  // Conditional caching
}
```

#### `@Retryable(attempts | config)`
Adds automatic retry logic for failed operations.

```typescript
@Retryable(3) // Retry 3 times
async databaseOperation() {
  // Method with retry logic
}

@Retryable({
  attempts: 5,
  delay: 2000,
  backoff: 'exponential',
  condition: (error) => error.message.includes('network')
})
async networkOperation() {
  // Advanced retry configuration
}
```

#### `@Log(message | config)`
Adds comprehensive logging to method execution.

```typescript
@Log('User registration')
async register(userData: UserRegistrationDto) {
  // Method with logging
}

@Log({
  message: 'Database operation',
  includeArgs: false,
  includeResult: true,
  includeExecutionTime: true
})
async sensitiveOperation(data: any) {
  // Advanced logging configuration
}
```

#### `@Validate(config)`
Adds input/output validation to methods.

```typescript
@Validate({
  schema: userRegistrationSchema,
  validateArgs: true,
  validateResult: false
})
async register(userData: UserRegistrationDto) {
  // Method with validation
}
```

### Lifecycle Decorators

#### `@PostConstruct()`
Marks a method to be called after service construction.

```typescript
@PostConstruct()
async initialize(): Promise<void> {
  console.log('Service initialized');
  // Initialization logic
}
```

#### `@PreDestroy()`
Marks a method to be called before service destruction.

```typescript
@PreDestroy()
async cleanup(): Promise<void> {
  console.log('Service cleanup');
  // Cleanup logic
}
```

## Service Implementation Examples

### AuthService with Decorators

```typescript
@Injectable()
@Singleton()
@Service({
  scope: ServiceScope.SINGLETON,
  lazy: false,
  priority: 1
})
export class AuthService implements IAuthService {
  constructor(
    @ConfigValue('JWT_SECRET', 'default-secret') private jwtSecret: string,
    @ConfigValue('JWT_EXPIRES_IN', '7d') private jwtExpiresIn: string
  ) {}

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('🔐 AuthService initialized');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('🔐 AuthService cleanup completed');
  }

  @Log('Generating JWT token')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { id: userId, email, role },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  @Log('User registration')
  @Retryable({
    attempts: 3,
    delay: 2000,
    condition: (error) => error.message.includes('database')
  })
  async register(userData: UserRegistrationDto): Promise<UserRegistrationResponseDto> {
    // Registration implementation with retry logic
  }

  @Log('User login')
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async login(credentials: LoginDto): Promise<LoginResponseDto> {
    // Login implementation with caching
  }
}
```

### UserService with Dependency Injection

```typescript
@Injectable()
@Singleton()
@Service({
  scope: ServiceScope.SINGLETON,
  priority: 2
})
export class UserService implements IUserService {
  constructor(
    @Inject('AuthService') private authService: AuthService,
    @Inject('ReviewService') private reviewService?: IReviewService
  ) {}

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('👤 UserService initialized');
  }

  @Log('Getting user by ID')
  @Cached(5 * 60 * 1000)
  @Retryable({
    attempts: 3,
    condition: (error) => error.message.includes('database')
  })
  async getUserById(userId: string): Promise<any> {
    // Implementation with caching and retry
  }

  @Log({
    message: 'Updating user profile',
    includeExecutionTime: true
  })
  @Retryable(2)
  async updateUserProfile(userId: string, updateData: UpdateUserDto): Promise<ApiResponseDto> {
    // Implementation with logging and retry
  }
}
```

## Service Registry

The Service Registry manages all decorator-based services with dependency injection and lifecycle management.

### Features

- **Dependency Injection**: Automatic resolution of service dependencies
- **Lifecycle Management**: Proper initialization and cleanup of services
- **Service Discovery**: Runtime service lookup and management
- **Health Checking**: Monitor service health and status
- **Graceful Shutdown**: Proper cleanup during application shutdown

### Usage

```typescript
import { serviceRegistry } from './services/ServiceRegistry.decorator';

// Initialize all services
await serviceRegistry.initialize();

// Get service instance
const authService = serviceRegistry.getService<AuthService>('AuthService');

// Check service health
const healthStatus = await serviceRegistry.healthCheck();

// Graceful shutdown
await serviceRegistry.shutdown();
```

### Service Registration

```typescript
// Register a new service at runtime
await serviceRegistry.registerService({
  name: 'NewService',
  class: NewService,
  scope: ServiceScope.SINGLETON,
  dependencies: ['AuthService'],
  priority: 4
});
```

## Enhanced Server with @decorators/server

The enhanced server implementation uses `@decorators/server` for advanced functionality.

### Features

- **Advanced Middleware Management**: Declarative middleware configuration
- **Server Lifecycle Hooks**: Pre/post startup and shutdown hooks
- **Enhanced Configuration**: Centralized server configuration
- **Service Integration**: Seamless integration with decorator-based services

### Server Configuration

```typescript
@Server({
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  compression: true,
  helmet: true,
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  }
})
export class SmartFixServer {
  // Server implementation
}
```

## Configuration Management

### Environment Variable Injection

```typescript
constructor(
  @ConfigValue('JWT_SECRET', 'default-secret') jwtSecret?: string,
  @ConfigValue('JWT_EXPIRES_IN', '7d') jwtExpiresIn?: string,
  @ConfigValue('BCRYPT_SALT_ROUNDS', '12') saltRounds?: string
) {
  // Configuration injected automatically
}
```

### Service Configuration

```typescript
@Service({
  scope: ServiceScope.SINGLETON,  // Service lifecycle
  lazy: false,                    // Eager initialization
  priority: 1                     // Initialization order
})
```

## Performance Features

### Caching Strategy

```typescript
// Method-level caching
@Cached(5 * 60 * 1000) // 5 minutes
async expensiveOperation() {}

// Conditional caching
@Cached({
  ttl: 10 * 60 * 1000,
  condition: (args) => args[0] !== 'admin'
})
async conditionalCache() {}
```

### Retry Logic

```typescript
// Simple retry
@Retryable(3)
async unreliableOperation() {}

// Advanced retry with backoff
@Retryable({
  attempts: 5,
  delay: 1000,
  backoff: 'exponential',
  condition: (error) => error.message.includes('timeout')
})
async networkOperation() {}
```

## Monitoring and Logging

### Comprehensive Logging

```typescript
@Log({
  message: 'Critical operation',
  includeArgs: false,        // Don't log sensitive data
  includeResult: true,       // Log operation result
  includeExecutionTime: true // Log performance metrics
})
async criticalOperation() {}
```

### Health Monitoring

```typescript
// Service health check
const healthStatus = await serviceRegistry.healthCheck();

// Individual service status
const serviceStatus = serviceRegistry.getServiceStatus('AuthService');
```

## Testing

### Service Testing

```typescript
import { serviceRegistry } from './ServiceRegistry.decorator';

describe('AuthService', () => {
  beforeAll(async () => {
    await serviceRegistry.initialize();
  });

  afterAll(async () => {
    await serviceRegistry.shutdown();
  });

  it('should generate valid JWT token', () => {
    const authService = serviceRegistry.getService<AuthService>('AuthService');
    const token = authService.generateToken('user-id', 'test@example.com', 'user');
    expect(token).toBeDefined();
  });
});
```

### Integration Testing

```typescript
import request from 'supertest';
import { SmartFixServer } from './app.server';

describe('Enhanced Server', () => {
  let server: SmartFixServer;

  beforeAll(async () => {
    server = new SmartFixServer();
    await server.initialize();
  });

  afterAll(async () => {
    await server.shutdown();
  });

  it('should respond to health check', async () => {
    const response = await request(server.getApp())
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
  });
});
```

## Migration Guide

### From Traditional Services

1. **Add Decorators**:
   ```typescript
   // Before
   export class AuthService {
     // Implementation
   }

   // After
   @Injectable()
   @Singleton()
   export class AuthService {
     // Implementation
   }
   ```

2. **Add Lifecycle Methods**:
   ```typescript
   @PostConstruct()
   async initialize(): Promise<void> {
     // Initialization logic
   }

   @PreDestroy()
   async cleanup(): Promise<void> {
     // Cleanup logic
   }
   ```

3. **Add Method Decorators**:
   ```typescript
   @Log('Operation description')
   @Cached(5 * 60 * 1000)
   @Retryable(3)
   async operation() {
     // Method implementation
   }
   ```

4. **Update Service Registration**:
   ```typescript
   // Register in ServiceRegistry
   await serviceRegistry.initialize();
   const service = serviceRegistry.getService<AuthService>('AuthService');
   ```

## Best Practices

### Service Design

1. **Single Responsibility**: Each service should have a single, well-defined responsibility
2. **Dependency Injection**: Use constructor injection for dependencies
3. **Lifecycle Management**: Implement proper initialization and cleanup
4. **Error Handling**: Use appropriate error types and retry strategies

### Decorator Usage

1. **Caching**: Cache expensive operations with appropriate TTL
2. **Retry Logic**: Add retry for transient failures
3. **Logging**: Log important operations without exposing sensitive data
4. **Validation**: Validate inputs and outputs where appropriate

### Performance

1. **Lazy Loading**: Use lazy initialization for non-critical services
2. **Connection Pooling**: Implement proper database connection management
3. **Memory Management**: Monitor memory usage and implement cleanup
4. **Monitoring**: Add health checks and performance metrics

## Troubleshooting

### Common Issues

1. **Circular Dependencies**:
   ```typescript
   // Avoid circular dependencies
   // Use interfaces and optional injection
   constructor(
     @Inject('ServiceB') private serviceB?: IServiceB
   ) {}
   ```

2. **Service Not Found**:
   ```typescript
   // Ensure service is registered
   await serviceRegistry.registerService({
     name: 'MyService',
     class: MyService,
     scope: ServiceScope.SINGLETON
   });
   ```

3. **Initialization Order**:
   ```typescript
   // Use priority to control initialization order
   @Service({
     priority: 1 // Lower numbers initialize first
   })
   ```

### Debugging

1. **Enable Debug Logging**:
   ```typescript
   @Log({
     level: 'debug',
     includeArgs: true,
     includeResult: true
   })
   ```

2. **Health Checks**:
   ```typescript
   const health = await serviceRegistry.healthCheck();
   console.log('Service Health:', health);
   ```

3. **Service Status**:
   ```typescript
   const status = serviceRegistry.getAllServicesStatus();
   console.log('All Services:', status);
   ```

## Conclusion

The decorator-based services implementation provides a modern, scalable, and maintainable architecture for the SmartFix Service Providers platform. With features like dependency injection, lifecycle management, caching, retry logic, and comprehensive logging, it offers significant improvements over traditional service implementations while maintaining backward compatibility and ease of use.

