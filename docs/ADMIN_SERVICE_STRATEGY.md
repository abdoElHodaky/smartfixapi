# AdminService.strategy Pattern Guide

This document provides a comprehensive guide to the AdminService.strategy pattern used throughout the SmartFixAPI project. This pattern combines several modern TypeScript design patterns to create a maintainable, testable, and scalable service architecture.

## Core Components

The AdminService.strategy pattern consists of the following core components:

### 1. Decorator-based Architecture

```typescript
@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 2
})
export class AdminService implements IAdminService {
  // Implementation
}
```

#### Key Decorators:

- **@Injectable()**: Marks the class as injectable for dependency injection
- **@Singleton()**: Ensures only one instance of the service exists
- **@Service()**: Configures service behavior with options:
  - `scope`: Lifecycle scope ('singleton', 'request', 'transient')
  - `lazy`: Whether to initialize lazily
  - `priority`: Loading priority (higher numbers load first)

### 2. Dependency Injection

```typescript
constructor(
  @Inject('UserService') private userService: IUserService,
  @Inject('ProviderService') private providerService: IProviderService,
  @Inject('ServiceRequestService') private serviceRequestService: IServiceRequestService,
  @Inject('ReviewService') private reviewService: IReviewService
) {}
```

- Uses constructor injection with `@Inject` decorator
- References services by name to avoid circular dependencies
- Injects interfaces rather than concrete implementations
- Supports optional dependencies with `?` operator

### 3. Method-level Decorators

```typescript
@Log('Getting platform statistics')
@Cached(10 * 60 * 1000) // Cache for 10 minutes
@Retryable(2)
async getPlatformStatistics(): Promise<PlatformStatisticsDto> {
  // Implementation
}
```

#### Key Method Decorators:

- **@Log()**: Adds logging with optional configuration
  - Simple: `@Log('Operation description')`
  - Advanced: `@Log({ message: 'Operation', includeExecutionTime: true })`

- **@Cached()**: Adds caching with TTL (Time To Live)
  - Simple: `@Cached(5 * 60 * 1000)` (5 minutes)
  - Advanced: `@Cached({ ttl: 5 * 60 * 1000, key: (args) => generateKey(args) })`

- **@Retryable()**: Adds automatic retry logic
  - Simple: `@Retryable(3)` (3 attempts)
  - Advanced: `@Retryable({ attempts: 3, delay: 1000, condition: (err) => isRetryable(err) })`

### 4. Strategy Pattern Implementation

The strategy pattern is implemented in two ways:

#### A. Object Literal Approach (Simple)

```typescript
async manageUser(adminId: string, userId: string, action: string, data?: any): Promise<ApiResponseDto> {
  await this.verifyAdminPermissions(adminId);

  try {
    // Optimized action handlers using strategy pattern
    const userActionHandlers = {
      activate: async () => await User.findByIdAndUpdate(
        userId,
        { status: 'active', updatedAt: new Date() },
        { new: true }
      ).select('-password'),
      
      deactivate: async () => await User.findByIdAndUpdate(
        userId,
        { status: 'inactive', updatedAt: new Date() },
        { new: true }
      ).select('-password'),
      
      // Additional handlers...
    };

    const handler = userActionHandlers[action as keyof typeof userActionHandlers];
    if (!handler) {
      throw new ValidationError('Invalid action');
    }

    const result = await handler();

    return {
      success: true,
      message: `User ${action} completed successfully`,
      data: result
    };
  } catch (error) {
    // Optimized: Use ErrorHandlers for standardized error handling
    return ErrorHandlers.handleServiceError(error, `Failed to ${action} user`);
  }
}
```

#### B. Formal Strategy Pattern (Complex)

```typescript
async manageUserWithStrategy(adminId: string, userId: string, action: string, data?: any): Promise<ApiResponseDto> {
  await this.verifyAdminPermissions(adminId);

  try {
    // Create strategy registry using factory
    const userActionRegistry = StrategyFactory.createUserActionRegistry();
    
    // Execute appropriate strategy
    const result = await userActionRegistry.execute(action, { userId, data });
    
    return {
      success: true,
      message: `User ${action} completed successfully`,
      data: result
    };
  } catch (error) {
    return ErrorHandlers.handleServiceError(error, `Failed to ${action} user`);
  }
}
```

### 5. AggregationBuilder for MongoDB

```typescript
async searchUsersAdvanced(filters: UserFiltersDto, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
  try {
    const skip = (page - 1) * limit;
    
    // Build aggregation pipeline using AggregationBuilder
    let aggregationBuilder = AggregationBuilder.create()
      .match({ status: 'active' });

    // Apply filters using AggregationBuilder
    if (filters.role) {
      aggregationBuilder = aggregationBuilder.match({ role: filters.role });
    }

    // Additional filters...

    // Execute aggregation with pagination
    const [users, totalCount] = await Promise.all([
      aggregationBuilder
        .project({ password: 0 }) // Exclude password
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .execute(User),
      aggregationBuilder
        .group({ _id: null, count: { $sum: 1 } })
        .execute(User)
    ]);

    const total = totalCount[0]?.count || 0;

    return {
      success: true,
      message: 'Users retrieved successfully with advanced filtering',
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    throw new ValidationError('Failed to search users with advanced filtering');
  }
}
```

### 6. Standardized Error Handling

```typescript
try {
  // Implementation
} catch (error) {
  return ErrorHandlers.handleServiceError(error, 'Operation failed');
}
```

The `ErrorHandlers` utility provides:
- Type-specific error handling
- Consistent error response format
- Detailed error messages
- HTTP status code mapping

## Implementation Guidelines

### When to Use Object Literals vs. Formal Strategy Pattern

- **Use Object Literals When**:
  - The strategies are simple and contained within a single method
  - The number of strategies is small and unlikely to grow significantly
  - The strategies don't need to be reused across multiple services

- **Use Formal Strategy Pattern When**:
  - Strategies are complex and need to be tested independently
  - Strategies need to be reused across multiple services
  - The number of strategies is large or likely to grow
  - Strategies need to be dynamically selected based on complex conditions

### When to Use AggregationBuilder

- **Use AggregationBuilder When**:
  - Performing complex MongoDB aggregations
  - Building dynamic queries based on user input
  - Needing to reuse query components
  - Implementing pagination with accurate counts
  - Performing complex data transformations in the database

### Error Handling Best Practices

1. **Use Try-Catch Blocks**:
   ```typescript
   try {
     // Implementation
   } catch (error) {
     return ErrorHandlers.handleServiceError(error, 'Operation failed');
   }
   ```

2. **Use Specific Error Types**:
   ```typescript
   if (!user) {
     throw new NotFoundError('User not found');
   }
   ```

3. **Use ErrorHandlers for Consistent Responses**:
   ```typescript
   return ErrorHandlers.handleServiceError(error, 'Failed to update user');
   ```

4. **Use Conditional Error Handling When Needed**:
   ```typescript
   return ErrorHandlers.handleMultipleErrorTypes(error, {
     validation: (err) => ErrorHandlers.createErrorResponse('Validation failed', err.message),
     notfound: (err) => ErrorHandlers.handleResourceNotFound('User', err.id)
   });
   ```

## Migration Guide

When migrating existing services to the AdminService.strategy pattern:

1. **Add Required Decorators**:
   - Add `@Injectable()`, `@Singleton()`, and `@Service()` to the class
   - Add `@Log()`, `@Cached()`, and `@Retryable()` to methods as appropriate

2. **Implement Dependency Injection**:
   - Update constructor to use `@Inject()` for dependencies
   - Use interfaces rather than concrete implementations

3. **Refactor Complex Logic to Use Strategy Pattern**:
   - Identify methods with complex conditional logic
   - Choose between object literals or formal strategy pattern
   - Implement strategies accordingly

4. **Update MongoDB Queries to Use AggregationBuilder**:
   - Replace complex `find()` queries with AggregationBuilder
   - Implement proper pagination with accurate counts

5. **Standardize Error Handling**:
   - Add try-catch blocks to all methods
   - Use ErrorHandlers utility for consistent error responses
   - Use specific error types for different error scenarios

## Examples

### Basic Service Implementation

```typescript
@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 2
})
export class UserService implements IUserService {
  constructor(
    @Inject('ReviewService') private reviewService?: IReviewService,
    @Inject('ServiceRequestService') private serviceRequestService?: IServiceRequestService
  ) {}

  @Log('Getting user by ID')
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  @Retryable({
    attempts: 3,
    delay: 1000,
    condition: (error: Error) => error.message.includes('database')
  })
  async getUserById(userId: string, includePassword: boolean = false): Promise<any> {
    try {
      const selectFields = includePassword ? '+password' : '-password';
      const user = await User.findById(userId).select(selectFields);
      
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      return user;
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to get user');
    }
  }
}
```

### Complex Strategy Implementation

```typescript
@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 2
})
export class RequestService implements IRequestService {
  constructor(
    @Inject('ProviderService') private providerService: IProviderService,
    @Inject('UserService') private userService: IUserService
  ) {}

  @Log('Updating request status')
  @Retryable(2)
  async updateRequestStatus(requestId: string, newStatus: string, userId: string): Promise<ApiResponseDto> {
    try {
      // Create strategy selector
      const statusTransitionSelector = StrategyFactory.createStatusTransitionSelector();
      
      // Get current status
      const request = await ServiceRequest.findById(requestId);
      if (!request) {
        throw new NotFoundError('Service request not found');
      }
      
      // Execute appropriate strategy based on current status
      const result = await statusTransitionSelector.select({
        currentStatus: request.status,
        newStatus,
        requestId,
        userId
      });
      
      return {
        success: true,
        message: 'Service request status updated successfully',
        data: result
      };
    } catch (error) {
      return ErrorHandlers.handleServiceError(error, 'Failed to update service request status');
    }
  }
}
```

### AggregationBuilder Example

```typescript
@Log('Searching providers with advanced filters')
@Cached(2 * 60 * 1000) // Cache for 2 minutes
async searchProviders(filters: ProviderFiltersDto, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
  try {
    const skip = (page - 1) * limit;
    
    // Build base aggregation
    let aggregationBuilder = AggregationBuilder.create()
      .match({ status: 'active' });
    
    // Apply service type filter
    if (filters.serviceType) {
      aggregationBuilder = aggregationBuilder.match({
        'services.type': filters.serviceType
      });
    }
    
    // Apply location filter with geospatial query
    if (filters.location && filters.radius) {
      aggregationBuilder = aggregationBuilder.match({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [filters.location.longitude, filters.location.latitude]
            },
            $maxDistance: filters.radius * 1000 // Convert km to meters
          }
        }
      });
    }
    
    // Apply rating filter
    if (filters.minRating) {
      aggregationBuilder = aggregationBuilder.match({
        averageRating: { $gte: filters.minRating }
      });
    }
    
    // Apply availability filter
    if (filters.availableNow) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      aggregationBuilder = aggregationBuilder.match({
        [`availability.${dayOfWeek}.isAvailable`]: true,
        [`availability.${dayOfWeek}.timeSlots`]: {
          $elemMatch: {
            start: { $lte: currentTime },
            end: { $gte: currentTime }
          }
        }
      });
    }
    
    // Execute aggregation with pagination
    const [providers, totalCount] = await Promise.all([
      aggregationBuilder
        .lookup({
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        })
        .unwind('$user')
        .project({
          'user.password': 0,
          'user.resetPasswordToken': 0
        })
        .sort({ averageRating: -1 })
        .skip(skip)
        .limit(limit)
        .execute(ServiceProvider),
      aggregationBuilder
        .group({ _id: null, count: { $sum: 1 } })
        .execute(ServiceProvider)
    ]);
    
    const total = totalCount[0]?.count || 0;
    
    return {
      success: true,
      message: 'Providers retrieved successfully',
      data: providers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    return ErrorHandlers.handleServiceError(error, 'Failed to search providers');
  }
}
```

## Conclusion

The AdminService.strategy pattern provides a comprehensive approach to building maintainable, testable, and scalable services. By combining decorator-based architecture, dependency injection, strategy pattern, and AggregationBuilder, it creates a consistent and powerful service layer that can handle complex business logic while remaining easy to understand and extend.

