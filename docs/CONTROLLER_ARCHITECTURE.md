# Controller Architecture Documentation

## Overview

This document describes the updated controller architecture for the Service Providers project, which now uses dependency injection and instance-based controllers instead of static methods.

## Architecture Changes

### Before (Static Methods)
```typescript
// Old approach - static methods
export class AuthController {
  static async register(req: Request, res: Response) {
    // Implementation
  }
}

// Route usage
router.post('/register', AuthController.register);
```

### After (Dependency Injection)
```typescript
// New approach - instance methods with DI
export class AuthController {
  private authService: IAuthService;

  constructor() {
    this.authService = serviceRegistry.getAuthService();
  }

  async register(req: Request, res: Response) {
    // Implementation using this.authService
  }
}

// Route usage
const authController = new AuthController();
router.post('/register', authController.register);
```

## Benefits

1. **Testability**: Controllers can be easily unit tested with mocked services
2. **Dependency Injection**: Services are injected through the service registry
3. **Loose Coupling**: Controllers depend on interfaces, not concrete implementations
4. **Maintainability**: Easier to modify and extend functionality
5. **Consistency**: All controllers follow the same pattern

## Controller Structure

### Service Dependencies
Each controller receives its dependencies through the service registry:

```typescript
export class UserController {
  private userService: IUserService;

  constructor() {
    this.userService = serviceContainer.getUserService();
  }
}
```

### Method Binding
All controller methods are properly bound to maintain `this` context:

```typescript
// In routes
const userController = new UserController();
router.get('/profile', authenticateToken, userController.getProfile);
```

## Updated Controllers

### 1. AuthController
- **Location**: `src/controllers/auth/AuthController.ts`
- **Service**: `IAuthService`
- **Routes**: `src/routes/auth/authRoutes.ts`
- **Methods**: register, login, getProfile, updateProfile, changePassword, resetPassword, refreshToken, verifyEmail, deactivateAccount, logout, verifyToken

### 2. UserController
- **Location**: `src/controllers/user/UserController.ts`
- **Service**: `IUserService`
- **Routes**: `src/routes/user/userRoutes.ts`
- **Methods**: getProfile, updateProfile, uploadProfileImage, getServiceRequests, getMyReviews, getDashboard, updateLocation, deleteAccount, getUserById, searchUsers

### 3. ProviderController
- **Location**: `src/controllers/provider/ProviderController.ts`
- **Service**: `IProviderService`
- **Routes**: `src/routes/provider/providerRoutes.ts`
- **Methods**: getProfile, updateProfile, getServiceRequests, getAvailableRequests, submitProposal, getDashboard, updateAvailability, addPortfolioItem, getProviderById, searchProviders

### 4. RequestController
- **Location**: `src/controllers/request/RequestController.ts`
- **Service**: `IServiceRequestService`
- **Routes**: `src/routes/request/requestRoutes.ts`
- **Methods**: createRequest, getRequestById, updateRequest, acceptProposal, startService, completeService, approveCompletion, cancelRequest, getRequests, getStatistics

### 5. ReviewController
- **Location**: `src/controllers/review/ReviewController.ts`
- **Service**: `IReviewService`
- **Routes**: `src/routes/review/reviewRoutes.ts`
- **Methods**: createReview, getReviewById, updateReview, deleteReview, getProviderReviews, addProviderResponse, markHelpful, getUserReviews, getRecentReviews, getReviewStatistics

### 6. AdminController
- **Location**: `src/controllers/admin/AdminController.ts`
- **Service**: `IAdminService`
- **Routes**: `src/routes/admin/adminRoutes.ts`
- **Methods**: getDashboard, getUsers, getProviders, verifyProvider, toggleUserStatus, getServiceRequests, getReviews, toggleReviewVerification, getStatistics, deleteUser, getSystemHealth

### 7. ChatController
- **Location**: `src/controllers/chat/ChatController.ts`
- **Service**: `IChatService`
- **Routes**: `src/routes/chat/chatRoutes.ts`
- **Methods**: getChatByServiceRequest, sendMessage, getMessages, markAsRead, getUserChats, editMessage, getUnreadCount, createChat

## Service Registry

The service registry manages all service instances and provides them to controllers:

```typescript
// Service Registry Usage
export class ServiceRegistry {
  getAuthService(): IAuthService {
    return this.authService;
  }
  
  getUserService(): IUserService {
    return this.userService;
  }
  
  // ... other services
}

// Global instance
export const serviceRegistry = new ServiceRegistry();
```

## Route Configuration

Each route file now creates controller instances:

```typescript
// Example: src/routes/auth/authRoutes.ts
import { Router } from 'express';
import { AuthController } from '../../controllers/auth';

const router = Router();
const authController = new AuthController();

router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);
// ... other routes

export default router;
```

## Testing

Controllers can now be easily unit tested:

```typescript
describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<IAuthService>;

  beforeEach(() => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      // ... other methods
    };
    
    // Mock the service registry
    jest.spyOn(serviceRegistry, 'getAuthService').mockReturnValue(mockAuthService);
    
    authController = new AuthController();
  });

  it('should register a user', async () => {
    // Test implementation
  });
});
```

## Migration Checklist

- [x] Update all controllers to use instance methods
- [x] Update all route files to create controller instances
- [x] Update all route handlers to use instance methods
- [x] Create comprehensive tests
- [x] Update documentation
- [x] Verify all routes work correctly

## Next Steps

1. **Add Unit Tests**: Create comprehensive unit tests for all controllers
2. **Integration Tests**: Add integration tests to verify route functionality
3. **Performance Testing**: Ensure the new architecture doesn't impact performance
4. **Documentation**: Keep this documentation updated as the system evolves

## Troubleshooting

### Common Issues

1. **Method Binding**: Ensure controller methods are properly bound when used in routes
2. **Service Initialization**: Make sure the service registry is initialized before creating controllers
3. **Import Paths**: Verify all import paths are correct after restructuring

### Error Messages

- `Cannot read property 'methodName' of undefined`: Method binding issue
- `Service not found`: Service registry not properly initialized
- `Module not found`: Import path issue

## Conclusion

The updated controller architecture provides a more maintainable, testable, and scalable foundation for the Service Providers project. All controllers now follow consistent patterns and can be easily extended or modified as requirements evolve.

