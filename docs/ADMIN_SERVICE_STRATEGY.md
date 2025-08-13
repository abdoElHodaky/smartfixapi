# AdminService Strategy Pattern

This document outlines the AdminService strategy pattern implementation, which serves as the reference architecture for all services in the SmartFixAPI project.

## Core Components

The AdminService strategy pattern consists of several key components:

1. **Decorator-Based Architecture**: Using TypeScript decorators for cross-cutting concerns
2. **Dependency Injection**: Clean service composition with proper dependency management
3. **Strategy Pattern**: Flexible business logic implementation using object literals
4. **AggregationBuilder**: Fluent interface for building MongoDB aggregation pipelines
5. **ErrorHandlers**: Standardized error handling across all methods
6. **ConditionalHelpers**: Reusable conditional logic for common operations

## Implementation Guidelines

### Service Class Structure

```typescript
@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 4
})
export class AdminService implements IAdminService {
  constructor(
    @Inject('UserService') private userService: IUserService,
    @Inject('ProviderService') private providerService: IProviderService
  ) {}

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('AdminService initialized');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('AdminService cleanup completed');
  }

  // Service methods...
}
```

### Method Implementation Pattern

Each method should follow this pattern:

```typescript
@Log('Method description')
@Cached(5 * 60 * 1000) // Optional caching
@Retryable({
  attempts: 3,
  delay: 2000,
  condition: (error: Error) => error.message.includes('database')
})
async methodName(param1: Type1, param2: Type2): Promise<ReturnType> {
  try {
    // Implementation
    
    return {
      success: true,
      message: 'Operation completed successfully',
      data: result
    };
  } catch (error) {
    return ErrorHandlers.handleServiceError(error, 'Operation failed');
  }
}
```

### AggregationBuilder Usage

```typescript
async searchEntities(filters: FiltersDto, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto> {
  try {
    const skip = (page - 1) * limit;
    
    // Build aggregation pipeline
    let aggregationBuilder = AggregationBuilder.create();
    
    // Apply filters
    if (filters.status) {
      aggregationBuilder = aggregationBuilder.match({ status: filters.status });
    }
    
    if (filters.searchTerm) {
      aggregationBuilder = aggregationBuilder.match({
        $or: [
          { name: { $regex: filters.searchTerm, $options: 'i' } },
          { description: { $regex: filters.searchTerm, $options: 'i' } }
        ]
      });
    }
    
    // Execute aggregation with pagination
    const [entities, totalCount] = await Promise.all([
      aggregationBuilder
        .lookup({
          from: 'relatedCollection',
          localField: 'relatedId',
          foreignField: '_id',
          as: 'related'
        })
        .unwind({
          path: '$related',
          preserveNullAndEmptyArrays: true
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .execute(EntityModel),
      aggregationBuilder
        .group({ _id: null, count: { $sum: 1 } })
        .execute(EntityModel)
    ]);
    
    const total = totalCount[0]?.count || 0;
    
    return {
      success: true,
      message: 'Entities retrieved successfully',
      data: entities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    return ErrorHandlers.handleServiceError(error, 'Failed to search entities');
  }
}
```

### Strategy Pattern Implementation

```typescript
async updateEntityStatus(entityId: string, status: string): Promise<ApiResponseDto> {
  try {
    // Validate status
    const validStatuses = ['active', 'inactive', 'pending', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }
    
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    // Apply status-specific updates using strategy pattern
    const statusHandlers = {
      active: () => { 
        updateData.activatedAt = new Date();
        updateData.isActive = true;
      },
      inactive: () => { 
        updateData.deactivatedAt = new Date();
        updateData.isActive = false;
      },
      pending: () => { 
        updateData.pendingAt = new Date();
        updateData.isActive = false;
      },
      rejected: () => { 
        updateData.rejectedAt = new Date();
        updateData.isActive = false;
      }
    };
    
    const handler = statusHandlers[status as keyof typeof statusHandlers];
    if (handler) {
      handler();
    }
    
    // Update entity
    const entity = await EntityModel.findByIdAndUpdate(
      entityId,
      updateData,
      { new: true }
    );
    
    if (!entity) {
      throw new NotFoundError('Entity not found');
    }
    
    return {
      success: true,
      message: `Entity status updated to ${status}`,
      data: entity
    };
  } catch (error) {
    return ErrorHandlers.handleServiceError(error, 'Failed to update entity status');
  }
}
```

## Error Handling

All methods should use the `ErrorHandlers` utility for consistent error handling:

```typescript
try {
  // Implementation
} catch (error) {
  return ErrorHandlers.handleServiceError(error, 'Operation failed');
}
```

The `ErrorHandlers.handleServiceError` method:

1. Preserves original error types (ValidationError, NotFoundError, etc.)
2. Adds context to generic errors
3. Logs errors appropriately
4. Returns standardized error responses

## Decorators

### Service Decorators

- `@Injectable()`: Marks class as injectable for DI container
- `@Singleton()`: Ensures single instance throughout application
- `@Service()`: Configures service properties

### Method Decorators

- `@Log()`: Adds logging before and after method execution
- `@Cached()`: Caches method results for specified duration
- `@Retryable()`: Automatically retries failed operations
- `@Validate()`: Validates method parameters

### Lifecycle Decorators

- `@PostConstruct()`: Executes after service instantiation
- `@PreDestroy()`: Executes before service destruction

## Interface Design

Interfaces should follow this pattern:

```typescript
export interface IAdminService {
  /**
   * Method description
   * @param param1 Parameter description
   * @param param2 Parameter description
   * @returns Description of return value
   */
  methodName(param1: Type1, param2: Type2): Promise<ReturnType>;
  
  /**
   * Search entities with filters
   * @deprecated Use searchEntitiesAdvanced instead
   */
  searchEntities(filters: FiltersDto): Promise<PaginatedResponseDto<any>>;
  
  /**
   * Search entities with advanced filtering using AggregationBuilder
   */
  searchEntitiesAdvanced(filters: FiltersDto, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;
}
```

## Best Practices

1. **Consistent Method Signatures**:
   - Use consistent parameter ordering
   - Include pagination parameters for list methods
   - Return standardized DTOs (ApiResponseDto, PaginatedResponseDto)

2. **Error Handling**:
   - Always use try-catch blocks
   - Use ErrorHandlers.handleServiceError for all errors
   - Provide meaningful error messages

3. **Aggregation Optimization**:
   - Use AggregationBuilder for complex queries
   - Add proper indexes to support aggregation pipelines
   - Use projection to limit returned fields

4. **Strategy Pattern**:
   - Use object literals for strategy implementation
   - Apply for complex conditional logic
   - Keep strategies focused and simple

5. **Dependency Injection**:
   - Inject dependencies through constructor
   - Use interfaces for service dependencies
   - Make optional dependencies nullable

6. **Documentation**:
   - Document all public methods with JSDoc
   - Mark deprecated methods with @deprecated
   - Include parameter and return value descriptions

## Conclusion

The AdminService strategy pattern provides a robust, maintainable architecture for all services in the SmartFixAPI project. By following these guidelines, we ensure consistency, performance, and maintainability across the entire codebase.

