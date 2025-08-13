# SmartFixAPI - Service Provider Platform

A modern, enterprise-grade service providers platform built with **ExpressJS**, **MongoDB**, and **TypeScript**, featuring a **modular architecture** with strategy-based services, dependency injection, real-time chat, and comprehensive admin management.

## 🚀 Features

### Core Features
- **User Management**: Registration, authentication, profile management
- **Service Provider System**: Provider registration, verification, service listings
- **Service Requests**: Request creation, matching, status tracking
- **Review System**: Rating and review management
- **Real-time Chat**: Messaging between users and providers
- **Admin Dashboard**: Comprehensive admin panel with analytics

### Technical Features
- **🏗️ Modular Architecture**: Module-based organization with dependency injection
- **🎯 Strategy Pattern Services**: Advanced strategy patterns for business logic
- **🏛️ CQRS Pattern**: Command Query Responsibility Segregation for scalable architecture
- **⚡ Service Optimization**: All services use strategy pattern for optimal performance
- **📦 Module System**: Clean separation of concerns with `@Module()` decorators
- **🔄 Service Discovery**: Automatic service resolution across modules
- **💉 Dependency Injection**: Enterprise-grade DI container with lifecycle management
- **🛡️ TypeScript**: Full type safety and modern JavaScript features
- **🗄️ MongoDB**: Document-based database with Mongoose ODM
- **🔐 JWT Authentication**: Secure token-based authentication
- **👥 Role-based Authorization**: User, Provider, and Admin roles
- **⚡ Advanced Caching**: Service-level caching with TTL and invalidation
- **🔄 Retry Logic**: Automatic retry with exponential backoff
- **📊 Health Monitoring**: Real-time system health and module status
- **🚨 Error Handling**: Centralized error handling with graceful recovery
- **✅ Input Validation**: Request validation and sanitization
- **📚 API Documentation**: RESTful API with comprehensive documentation

## 📁 Project Structure

```
src/
├── 🏗️ modules/           # Modular architecture
│   ├── auth/            # Authentication module
│   ├── user/            # User management module
│   ├── provider/        # Service provider module
│   ├── request/         # Service request module
│   ├── review/          # Review system module
│   ├── admin/           # Admin management module
│   ├── chat/            # Chat messaging module
│   └── AppModule.ts     # Main application module
├── 🎯 services/          # Strategy-based services
│   ├── auth/            # Authentication services
│   ├── user/            # User services
│   ├── provider/        # Provider services
│   ├── request/         # Request services
│   ├── review/          # Review services
│   ├── admin/           # Admin services
│   └── chat/            # Chat services
├── 🎯 strategy/          # Strategy Pattern Implementation
│   ├── interfaces/      # Base strategy interfaces
│   ├── admin/           # Admin operation strategies
│   ├── user/            # User operation strategies
│   ├── auth/            # Authentication strategies
│   ├── provider/        # Provider strategies
│   ├── request/         # Service request strategies
│   ├── review/          # Review strategies
│   ├── chat/            # Chat strategies
│   └── index.ts         # Strategy exports
├── 🏛️ cqrs/             # CQRS Pattern Implementation
│   ├── commands/        # Command definitions (write operations)
│   ├── queries/         # Query definitions (read operations)
│   ├── handlers/        # Command and query handlers
│   │   ├── command/     # Command handlers
│   │   └── query/       # Query handlers
│   ├── events/          # Event definitions (future)
│   ├── types/           # CQRS type definitions
│   └── index.ts         # CQRS module exports
├── 🎨 decorators/        # Service decorators
├── ⚙️ config/            # Configuration files
├── 📦 container/         # DI container
├── 🎮 controllers/       # API controllers
├── 📋 dtos/             # Data transfer objects
├── 🔌 interfaces/       # Service interfaces
├── 🛡️ middleware/        # Express middleware
├── 🗄️ models/           # Mongoose models
├── 🛤️ routes/            # API routes
├── 📝 types/            # TypeScript type definitions
├── app.ts              # Main application entry
├── app.modular.ts      # Modular server implementation
└── server.ts           # Server entry point
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartfixapi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/serviceplatform
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRES_IN=7d
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or start your local MongoDB instance
   mongod
   ```

5. **Run the application**
   ```bash
   # 🚀 MODULAR ARCHITECTURE (Default)
   npm run dev              # Development with modular architecture
   npm run build            # Build modular application
   npm start                # Start modular application
   ```

## 🌐 Application Endpoints

Once running, access these endpoints:

- **🏠 Main Application**: `http://localhost:3000`
- **💚 Health Check**: `http://localhost:3000/health`
- **📦 Module Status**: `http://localhost:3000/modules`
- **🔍 Service Discovery**: `http://localhost:3000/services`
- **📚 API Documentation**: `http://localhost:3000/api`

## 🏗️ Architecture Overview

### 🎯 Strategy Pattern Implementation

All services in SmartFixAPI use the Strategy Pattern for flexible, maintainable business logic:

```typescript
// Strategy interface
interface AuthStrategy {
  execute(credentials: any): Promise<User>;
}

// Concrete strategies
class PasswordAuthStrategy implements AuthStrategy {
  async execute(credentials: any): Promise<User> {
    // Password authentication logic
  }
}

class TokenAuthStrategy implements AuthStrategy {
  async execute(credentials: any): Promise<User> {
    // Token authentication logic
  }
}

// Strategy registry
const authStrategies = new StrategyRegistry<AuthStrategy>();
authStrategies.register('password', new PasswordAuthStrategy());
authStrategies.register('token', new TokenAuthStrategy());

// Usage
const strategy = authStrategies.get(authType);
const user = await strategy.execute(credentials);
```

### 🏛️ CQRS Pattern

The platform implements Command Query Responsibility Segregation (CQRS) for better scalability:

```typescript
// Command (Write operation)
const command = new CreateUserCommand({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
});

// Execute command
const result = await commandBus.execute(command);

// Query (Read operation)
const query = new GetUserByIdQuery('user123');

// Execute query
const user = await queryBus.execute(query);
```

### 📦 Dependency Injection

The application uses a custom DI container for clean architecture:

```typescript
// Service registration
@Injectable()
@Service({
  name: 'UserService',
  scope: 'singleton'
})
class UserServiceStrategy implements IUserService {
  // Implementation
}

// Module registration
@Module({
  imports: [AuthModule],
  providers: [
    { provide: 'UserService', useClass: UserServiceStrategy }
  ],
  exports: ['UserService']
})
export class UserModule {
  // Module implementation
}

// Service injection
@Injectable()
class UserController {
  constructor(
    @Inject('UserService') private userService: IUserService
  ) {}
}
```

## 🔄 Service Unification

The SmartFixAPI has undergone a complete service unification process:

### Phase 1-2: Initial Strategy Pattern Implementation
- Implemented strategy pattern for AdminService, AuthService, and ProviderService
- Created base strategy interfaces and registries
- Established consistent error handling patterns

### Phase 3: Controller Unification
- Unified all controllers to follow consistent patterns
- Removed legacy `.modern.ts` controller files
- Standardized error handling and validation

### Phase 4: Complete Service Unification
- Migrated all remaining services to strategy pattern:
  - ChatService
  - ReviewService
  - UserService
  - ServiceRequestService
- Standardized dependency injection across all services
- Removed all decorator-based service implementations
- Ensured consistent error handling and validation

## 📚 Documentation

- [SERVICE_UNIFICATION_GUIDE.md](docs/SERVICE_UNIFICATION_GUIDE.md) - Service migration strategy and progress
- [ADMIN_SERVICE_STRATEGY.md](docs/ADMIN_SERVICE_STRATEGY.md) - AdminService implementation details
- [SERVICE_UNIFICATION_PHASE4.md](docs/SERVICE_UNIFICATION_PHASE4.md) - Phase 4 completion details

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Request validation middleware
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers middleware
- **Rate Limiting**: API rate limiting

## 📊 Monitoring & Logging

- **Morgan**: HTTP request logging
- **Error Handling**: Centralized error handling
- **Health Checks**: System health monitoring endpoint
- **Audit Logs**: Admin action logging

---

Built with ❤️ using ExpressJS, MongoDB, and TypeScript

