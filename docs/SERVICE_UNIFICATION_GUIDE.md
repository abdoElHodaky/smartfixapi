# Service Unification Guide

This document outlines the strategy and implementation details for unifying all services in the SmartFixAPI project to follow the AdminService pattern.

## Overview

The service unification initiative aims to standardize all services in the SmartFixAPI project to follow the AdminService pattern, which provides:

- Consistent error handling
- Optimized database queries using AggregationBuilder
- Strategy pattern for complex business logic
- Decorator-based architecture for cross-cutting concerns
- Standardized method signatures and return types

## Core Components

### 1. AggregationBuilder

The `AggregationBuilder` provides a fluent interface for building MongoDB aggregation pipelines:

```typescript
// Example usage
const aggregationBuilder = AggregationBuilder.create()
  .match({ status: 'active' })
  .lookup({
    from: 'users',
    localField: 'userId',
    foreignField: '_id',
    as: 'user'
  })
  .unwind('$user')
  .project({
    'user.password': 0
  });

const results = await aggregationBuilder.execute(Model);
```

### 2. ErrorHandlers

The `ErrorHandlers` utility provides standardized error handling across all services:

```typescript
// Example usage
try {
  // Implementation
} catch (error) {
  return ErrorHandlers.handleServiceError(error, 'Operation failed');
}
```

### 3. ConditionalHelpers

The `ConditionalHelpers` utility provides reusable conditional logic:

```typescript
// Example usage
const statusError = ConditionalHelpers.guardServiceRequestStatus(
  serviceRequest.status, 
  ['pending', 'cancelled', 'completed']
);
if (statusError) {
  throw new ValidationError('Cannot delete service request that is in progress');
}
```

### 4. Strategy Pattern

The strategy pattern is used for implementing complex business logic with multiple variants:

```typescript
// Example usage
const statusTimestampHandlers = {
  in_progress: () => { updateData.startedAt = new Date(); },
  completed: () => { updateData.completedAt = new Date(); },
  cancelled: () => { updateData.cancelledAt = new Date(); }
};

const timestampHandler = statusTimestampHandlers[status as keyof typeof statusTimestampHandlers];
if (timestampHandler) {
  timestampHandler();
}
```

## Migration Checklist

When migrating a service to the AdminService pattern, follow these steps:

1. **Import Required Utilities**
   - Import `AggregationBuilder`, `ErrorHandlers`, and `ConditionalHelpers` from utils

2. **Update Error Handling**
   - Replace direct error throws with `ErrorHandlers.handleServiceError`
   - Add try-catch blocks to all methods
   - Ensure consistent error messages

3. **Implement Advanced Search Methods**
   - Create new methods with `Advanced` suffix (e.g., `searchUsersAdvanced`)
   - Use `AggregationBuilder` for complex queries
   - Deprecate old methods but maintain backward compatibility

4. **Update Interfaces**
   - Add new method signatures to interfaces
   - Mark deprecated methods with `@deprecated` JSDoc tag
   - Update parameter types and return types

5. **Apply Strategy Pattern**
   - Identify areas with conditional logic
   - Refactor using strategy pattern for better maintainability
   - Use object literals for strategy implementation

6. **Standardize Method Signatures**
   - Ensure consistent parameter ordering
   - Add pagination parameters where appropriate
   - Use consistent return types (ApiResponseDto, PaginatedResponseDto)

## Implementation Examples

### Before and After Examples

#### Before: Direct Error Handling

```typescript
try {
  // Implementation
} catch (error) {
  if (error instanceof ValidationError) {
    throw error;
  }
  throw new ValidationError('Operation failed');
}
```

#### After: Standardized Error Handling

```typescript
try {
  // Implementation
} catch (error) {
  return ErrorHandlers.handleServiceError(error, 'Operation failed');
}
```

#### Before: Basic Query

```typescript
const users = await User.find(query)
  .populate('roleId')
  .skip(skip)
  .limit(limit)
  .sort({ createdAt: -1 });
```

#### After: Optimized Aggregation

```typescript
const users = await AggregationBuilder.create()
  .match(query)
  .lookup({
    from: 'roles',
    localField: 'roleId',
    foreignField: '_id',
    as: 'role'
  })
  .unwind({
    path: '$role',
    preserveNullAndEmptyArrays: true
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .execute(User);
```

## Service Dependencies

Understanding service dependencies is crucial for proper migration planning:

```
ServiceRequestService
├── ProviderService
├── UserService
└── ReviewService (optional)

ProviderService
├── ReviewService (optional)
└── ServiceRequestService (optional)

UserService
├── ReviewService (optional)
└── ServiceRequestService (optional)
```

## Migration Progress

### Completed

- ✅ AdminService (reference implementation)
- ✅ UserService
- ✅ ProviderService
- ✅ ServiceRequestService

### In Progress

- 🔄 ReviewService
- 🔄 ChatService
- 🔄 NotificationService

### Pending

- ⏳ PaymentService
- ⏳ AnalyticsService
- ⏳ SettingsService

## Best Practices

1. **Maintain Backward Compatibility**
   - Keep old methods working by delegating to new implementations
   - Use `@deprecated` tags to indicate migration path

2. **Incremental Migration**
   - Migrate one service at a time
   - Start with services with fewer dependencies

3. **Comprehensive Testing**
   - Write tests for new implementations
   - Ensure old functionality continues to work

4. **Documentation**
   - Update interface documentation
   - Document migration strategy for developers

5. **Performance Monitoring**
   - Monitor performance before and after migration
   - Optimize aggregation pipelines for complex queries

## Conclusion

The service unification initiative will result in a more maintainable, consistent, and performant codebase. By following the AdminService pattern, we ensure that all services in the SmartFixAPI project adhere to the same high standards of quality and maintainability.

