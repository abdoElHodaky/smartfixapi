# SmartFixAPI

A modern API for connecting service providers with customers, built with Node.js, Express, TypeScript, and MongoDB.

## Project Overview

SmartFixAPI is a comprehensive platform that facilitates the connection between service providers and customers. The API supports user management, service provider profiles, service requests, reviews, chat functionality, and administrative operations.

## Architecture

The project follows a modern, decorator-based architecture with the following key components:

### Core Architectural Patterns

- **Decorator-based Services**: Using `@Injectable`, `@Singleton`, and `@Service` decorators
- **Strategy Pattern**: For complex conditional logic and business rules
- **Dependency Injection**: Using `@Inject` decorators for service composition
- **Cross-cutting Concerns**: Using `@Cached`, `@Retryable`, and `@Log` decorators
- **MongoDB Aggregation**: Using `AggregationBuilder` for complex queries

### Service Layer

Services implement business logic and follow the AdminService.strategy pattern:

- **AdminService**: Reference implementation with strategy pattern
- **UserService**: User management and authentication
- **ProviderService**: Service provider profiles and availability
- **RequestService**: Service request lifecycle management
- **ReviewService**: Customer reviews and ratings
- **ChatService**: Real-time communication between users

### Controller Layer

Controllers handle HTTP requests and delegate to services:

- **Modern Approach**: Using `@UseMiddleware(validateBody(YourDto))` for validation
- **Decorator-based Middleware**: Using `@UseMiddleware()` instead of array-based middleware
- **Async/Await Pattern**: Direct usage instead of asyncHandler wrapper

## Technical Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based authentication
- **Validation**: Class-validator with custom decorators
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest (unit tests) and Supertest (integration tests)

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (v4+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/abdoElHodaky/smartfixapi.git

# Install dependencies
cd smartfixapi
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## API Endpoints

The API provides the following main endpoint groups:

- `/api/auth`: Authentication and user registration
- `/api/users`: User profile management
- `/api/providers`: Service provider operations
- `/api/requests`: Service request lifecycle
- `/api/reviews`: Customer reviews and ratings
- `/api/chat`: Real-time communication
- `/api/admin`: Administrative operations

## Development Guidelines

### Service Implementation

All services should follow the AdminService.strategy pattern:

1. Use decorator-based architecture:
   ```typescript
   @Injectable()
   @Singleton()
   @Service({
     scope: 'singleton',
     lazy: false,
     priority: 2
   })
   export class YourService implements IYourService {
     // Implementation
   }
   ```

2. Implement dependency injection:
   ```typescript
   constructor(
     @Inject('OtherService') private otherService: IOtherService
   ) {}
   ```

3. Use service decorators for cross-cutting concerns:
   ```typescript
   @Log('Operation description')
   @Cached(5 * 60 * 1000) // Cache for 5 minutes
   @Retryable(3) // Retry 3 times
   async yourMethod(): Promise<Result> {
     // Implementation
   }
   ```

4. Use strategy pattern for complex logic:
   ```typescript
   // Create strategies
   const strategies = StrategyFactory.createYourActionRegistry();
   
   // Execute appropriate strategy
   const result = await strategies.execute(actionType, input);
   ```

5. Use AggregationBuilder for complex MongoDB queries:
   ```typescript
   const result = await AggregationBuilder.create()
     .match({ status: 'active' })
     .sort({ createdAt: -1 })
     .limit(10)
     .execute(YourModel);
   ```

### Controller Implementation

Controllers should follow these guidelines:

1. Use decorator-based middleware:
   ```typescript
   @UseMiddleware(validateBody(YourDto))
   async yourEndpoint(req: Request, res: Response): Promise<void> {
     // Implementation
   }
   ```

2. Implement proper error handling:
   ```typescript
   try {
     const result = await this.yourService.yourMethod();
     res.status(200).json(result);
   } catch (error) {
     next(error);
   }
   ```

## Project Status

### Phase 2: Service Unification and Controller Modernization

Current focus:
- Unifying all services according to the AdminService.strategy pattern
- Modernizing controllers to use the unified services
- Converting remaining validation approaches to use @UseMiddleware

Progress:
- AdminService: ✅ Complete (reference implementation)
- UserService: 🔄 In Progress
- ProviderService: 📝 Planned
- RequestService: 📝 Planned
- ReviewService: 📝 Planned
- ChatService: 📝 Planned

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

