# Decorator-Based Express Refactoring Guide

## Overview

This document describes the comprehensive refactoring of the Service Providers project from traditional Express routing to a modern decorator-based approach using `@decorators/express` and `@decorators/di`.

## Architecture Changes

### Before (Traditional Express)
```typescript
// Traditional approach
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);

export default router;
```

### After (Decorator-Based)
```typescript
// Decorator-based approach
import { Controller, Post, Get, Body, Res } from '@decorators/express';
import { Injectable } from '@decorators/di';
import { Auth, ValidateUserRegistration, RateLimit } from '../decorators/middleware';

@Injectable()
@Controller('/api/auth')
export class AuthController {
  @ValidateUserRegistration()
  @RateLimit(15 * 60 * 1000, 5)
  @Post('/register')
  @Status(201)
  async register(@Body() body: any, @Res() res: Response) {
    // Implementation
  }
}
```

## Key Benefits

### 1. **Declarative Routing**
- Routes are defined directly on controller methods using decorators
- No need for separate route files
- Clear, self-documenting code structure

### 2. **Middleware Composition**
- Middleware can be applied using decorators
- Reusable middleware decorators
- Clean separation of concerns

### 3. **Dependency Injection**
- Built-in DI support with `@decorators/di`
- Injectable services and controllers
- Better testability and maintainability

### 4. **Type Safety**
- Full TypeScript support with decorators
- Parameter decorators for request data extraction
- Compile-time route validation

## Package Dependencies

### New Dependencies Added
```json
{
  "@decorators/express": "^3.0.0",
  "@decorators/di": "^3.0.0",
  "reflect-metadata": "^0.1.13"
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Decorator Reference

### Class Decorators

#### `@Controller(basePath: string)`
Defines a controller class with a base path for all routes.

```typescript
@Controller('/api/auth')
export class AuthController {
  // All routes will be prefixed with /api/auth
}
```

#### `@Injectable()`
Marks a class as injectable for dependency injection.

```typescript
@Injectable()
export class AuthController {
  constructor(private authService: AuthService) {}
}
```

### Method Decorators

#### HTTP Method Decorators
- `@Get(path: string)` - GET requests
- `@Post(path: string)` - POST requests
- `@Put(path: string)` - PUT requests
- `@Delete(path: string)` - DELETE requests
- `@Patch(path: string)` - PATCH requests

```typescript
@Get('/profile')
@Post('/register')
@Put('/update')
@Delete('/account')
```

#### `@Status(code: number)`
Sets the HTTP status code for successful responses.

```typescript
@Post('/register')
@Status(201)
async register() {
  // Returns 201 Created on success
}
```

### Parameter Decorators

#### Request Data Extraction
- `@Body()` - Request body
- `@Params(param?: string)` - Route parameters
- `@Query(param?: string)` - Query parameters
- `@Headers(header?: string)` - Request headers
- `@Req()` - Full request object
- `@Res()` - Response object

```typescript
@Post('/users/:id')
async updateUser(
  @Params('id') userId: string,
  @Body() userData: any,
  @Query('validate') validate: string,
  @Headers('authorization') auth: string
) {
  // Implementation
}
```

### Custom Middleware Decorators

#### `@Auth()`
Applies JWT authentication middleware.

```typescript
@Auth()
@Get('/profile')
async getProfile(@Req() req: AuthRequest) {
  // User is authenticated, req.user is available
}
```

#### `@ValidateUserRegistration()`
Applies user registration validation.

```typescript
@ValidateUserRegistration()
@Post('/register')
async register(@Body() body: any) {
  // Body is validated according to registration rules
}
```

#### `@RateLimit(windowMs: number, max: number)`
Applies rate limiting to the endpoint.

```typescript
@RateLimit(15 * 60 * 1000, 5) // 5 requests per 15 minutes
@Post('/register')
async register() {
  // Rate limited endpoint
}
```

#### `@AsyncHandler()`
Wraps the method with async error handling.

```typescript
@AsyncHandler()
@Get('/data')
async getData() {
  // Automatic error handling for async operations
}
```

## Controller Examples

### AuthController
```typescript
@Injectable()
@Controller('/api/auth')
export class AuthController {
  constructor() {
    this.authService = serviceRegistry.getAuthService();
  }

  @ValidateUserRegistration()
  @RateLimit(15 * 60 * 1000, 5)
  @Post('/register')
  @Status(201)
  @AsyncHandler()
  async register(@Body() body: any, @Res() res: Response) {
    const result = await this.authService.register(body);
    res.json(result);
  }

  @Auth()
  @Get('/profile')
  @Status(200)
  async getProfile(@Req() req: AuthRequest, @Res() res: Response) {
    const profile = await this.authService.getUserProfile(req.user.id);
    res.json(profile);
  }
}
```

### UserController
```typescript
@Injectable()
@Controller('/api/users')
export class UserController {
  @Auth()
  @Get('/profile')
  @Status(200)
  async getProfile(@Req() req: AuthRequest, @Res() res: Response) {
    // Implementation
  }

  @Auth()
  @Put('/profile')
  @Status(200)
  async updateProfile(
    @Req() req: AuthRequest,
    @Body() body: any,
    @Res() res: Response
  ) {
    // Implementation
  }
}
```

## Application Setup

### New App Structure
```typescript
import 'reflect-metadata';
import express from 'express';
import { attachControllers } from '@decorators/express';
import { Container } from '@decorators/di';

// Import decorator-based controllers
import { AuthController } from './controllers/auth/AuthController.decorator';
import { UserController } from './controllers/user/UserController.decorator';

const app = express();

// Attach decorator-based controllers
attachControllers(app, [
  AuthController,
  UserController,
  ProviderController
]);

// Initialize DI container
Container.provide([
  { provide: 'AuthController', useClass: AuthController },
  { provide: 'UserController', useClass: UserController }
]);
```

## Migration Strategy

### Phase 1: Setup and Dependencies
1. ✅ Install required packages
2. ✅ Update TypeScript configuration
3. ✅ Create custom middleware decorators

### Phase 2: Controller Migration
1. ✅ Create decorator-based AuthController
2. ✅ Create decorator-based UserController
3. ✅ Create decorator-based ProviderController
4. 🔄 Migrate remaining controllers (Request, Review, Admin, Chat)

### Phase 3: Application Integration
1. ✅ Create new app.decorator.ts
2. 🔄 Update server.ts to use decorator-based app
3. 🔄 Remove traditional route files
4. 🔄 Update tests for decorator-based controllers

### Phase 4: Advanced Features
1. 🔄 Implement custom validation decorators
2. 🔄 Add caching decorators
3. 🔄 Create logging decorators
4. 🔄 Add OpenAPI/Swagger integration

## File Structure

### New Structure
```
src/
├── controllers/
│   ├── auth/
│   │   ├── AuthController.ts (original)
│   │   └── AuthController.decorator.ts (new)
│   ├── user/
│   │   ├── UserController.ts (original)
│   │   └── UserController.decorator.ts (new)
│   └── ...
├── decorators/
│   └── middleware.ts (custom decorators)
├── app.ts (original)
├── app.decorator.ts (new)
└── ...
```

## Testing

### Unit Testing with Decorators
```typescript
import { AuthController } from './AuthController.decorator';
import { Container } from '@decorators/di';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    // Mock dependencies
    Container.provide([
      { provide: 'AuthService', useValue: mockAuthService }
    ]);
    
    controller = Container.get(AuthController);
  });

  it('should register a user', async () => {
    // Test implementation
  });
});
```

### Integration Testing
```typescript
import request from 'supertest';
import { app } from './app.decorator';

describe('Auth Routes', () => {
  it('POST /api/auth/register', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(201);
  });
});
```

## Performance Considerations

### Decorator Overhead
- Minimal runtime overhead
- Metadata is processed at startup
- No performance impact on request handling

### Memory Usage
- Slightly higher memory usage due to metadata
- Negligible impact for typical applications
- Benefits outweigh the minimal overhead

## Best Practices

### 1. Decorator Order
```typescript
// Correct order: Custom decorators first, then HTTP decorators
@Auth()
@ValidateUserRegistration()
@RateLimit(15 * 60 * 1000, 5)
@Post('/register')
@Status(201)
@AsyncHandler()
async register() {}
```

### 2. Error Handling
```typescript
// Use AsyncHandler decorator for automatic error handling
@AsyncHandler()
@Get('/data')
async getData() {
  // Errors are automatically caught and handled
}
```

### 3. Validation
```typescript
// Combine validation decorators for comprehensive validation
@ValidateUserRegistration()
@Validate([
  body('email').isEmail(),
  body('password').isLength({ min: 8 })
])
@Post('/register')
async register() {}
```

## Troubleshooting

### Common Issues

1. **Decorator Order**: Ensure custom decorators come before HTTP method decorators
2. **Metadata Import**: Always import 'reflect-metadata' at the top of entry files
3. **DI Container**: Properly configure the DI container with all dependencies

### Error Messages

- `Cannot read property 'methodName' of undefined`: Check decorator order
- `Metadata not found`: Ensure reflect-metadata is imported
- `Service not found`: Verify DI container configuration

## Future Enhancements

### 1. OpenAPI Integration
```typescript
@ApiOperation({ summary: 'Register a new user' })
@ApiResponse({ status: 201, description: 'User created successfully' })
@Post('/register')
async register() {}
```

### 2. Advanced Validation
```typescript
@ValidateDto(CreateUserDto)
@Post('/users')
async createUser(@Body() userData: CreateUserDto) {}
```

### 3. Caching
```typescript
@Cache(300) // Cache for 5 minutes
@Get('/users')
async getUsers() {}
```

## Conclusion

The decorator-based refactoring provides a modern, maintainable, and scalable architecture for the Service Providers project. The new approach offers better code organization, improved developer experience, and enhanced type safety while maintaining all existing functionality.

The migration can be done incrementally, allowing for gradual adoption without disrupting the existing system. The decorator pattern aligns well with modern TypeScript practices and provides a solid foundation for future enhancements.

