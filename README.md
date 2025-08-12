# SmartFix Service Providers Platform - Modular Architecture

A modern, enterprise-grade service providers platform built with **ExpressJS**, **MongoDB**, and **TypeScript**, featuring a **modular architecture** with decorator-based services, dependency injection, real-time chat, and comprehensive admin management.

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
- **🎯 Decorator-based Services**: Advanced decorators for caching, retry logic, and logging
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
├── 🎯 services/          # Decorator-based services
│   ├── auth/            # Authentication services
│   ├── user/            # User services
│   ├── provider/        # Provider services
│   ├── request/         # Request services
│   ├── review/          # Review services
│   ├── admin/           # Admin services
│   ├── chat/            # Chat services
│   └── ServiceRegistry.decorator.ts
├── 🎨 decorators/        # Service decorators
├── ⚙️ config/            # Configuration files
├── 📦 container/         # Legacy DI container (compatibility)
├── 🎮 controllers/       # Legacy controllers (compatibility)
├── 📋 dtos/             # Data transfer objects
├── 🔌 interfaces/       # Service interfaces
├── 🛡️ middleware/        # Express middleware
├── 🗄️ models/           # Mongoose models
├── 🛤️ routes/            # Legacy routes (compatibility)
├── 📝 types/            # TypeScript type definitions
├── app.ts              # Main application entry (UNIFIED)
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
   # 🚀 NEW MODULAR ARCHITECTURE (Default)
   npm run dev              # Development with modular architecture
   npm run build            # Build modular application
   npm start                # Start modular application
   
   # 🔄 Alternative Development Modes
   npm run dev:modular      # Explicit modular development
   npm run dev:legacy       # Legacy implementation (backup)
   npm run dev:decorators   # Decorator-based services only
   npm run dev:server       # Enhanced server with decorators
   
   # 📊 Testing and Monitoring
   npm run test:modular     # Test modular architecture
   npm run test:services    # Test decorator-based services
   ```

## 🌐 Application Endpoints

Once running, access these endpoints:

- **🏠 Main Application**: `http://localhost:3000`
- **💚 Health Check**: `http://localhost:3000/health`
- **📦 Module Status**: `http://localhost:3000/modules`
- **🔍 Service Discovery**: `http://localhost:3000/services`
- **📚 API Documentation**: `http://localhost:3000/api`

## 🏗️ Modular Architecture Overview

The SmartFix platform now uses a **modern modular architecture** that provides:

### 🎯 **Key Benefits**

- **🔧 Maintainability**: Clean separation of concerns with module boundaries
- **🚀 Scalability**: Easy to add new features as independent modules
- **🧪 Testability**: Isolated modules with dependency injection for easy testing
- **🔄 Reusability**: Services can be shared across modules through dependency injection
- **📊 Monitoring**: Built-in health checking and service discovery
- **⚡ Performance**: Advanced caching and retry logic at the service level

### 📦 **Module Structure**

Each module is self-contained with:
- **Services**: Business logic with decorator-based enhancements
- **Controllers**: API endpoints (when needed)
- **Models**: Data models and schemas
- **Dependencies**: Clear dependency declarations

### 🎨 **Decorator-Based Services**

Services use advanced decorators for:
- **@Cache()**: Automatic caching with TTL and invalidation
- **@Retry()**: Automatic retry with exponential backoff
- **@Log()**: Comprehensive logging and monitoring
- **@Validate()**: Input validation and sanitization
- **@PostConstruct/@PreDestroy**: Lifecycle management

### 🔍 **Service Discovery**

The platform provides real-time monitoring:
- **Module Health**: `/modules` - Status of all modules
- **Service Registry**: `/services` - All available services
- **System Health**: `/health` - Overall system status

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/refresh      # Refresh JWT token
POST /api/auth/logout       # User logout
```

### User Management
```
GET    /api/users/profile           # Get user profile
PUT    /api/users/profile           # Update user profile
DELETE /api/users/profile           # Delete user account
GET    /api/users/:id               # Get user by ID
```

### Provider Management
```
POST   /api/providers               # Register as provider
GET    /api/providers               # Get all providers
GET    /api/providers/:id           # Get provider details
PUT    /api/providers/:id           # Update provider profile
DELETE /api/providers/:id           # Delete provider
```

### Service Requests
```
POST   /api/service-requests        # Create service request
GET    /api/service-requests        # Get service requests
GET    /api/service-requests/:id    # Get request details
PUT    /api/service-requests/:id    # Update request
DELETE /api/service-requests/:id    # Delete request
```

### Reviews
```
POST   /api/reviews                 # Create review
GET    /api/reviews                 # Get reviews
GET    /api/reviews/:id             # Get review details
PUT    /api/reviews/:id             # Update review
DELETE /api/reviews/:id             # Delete review
```

### Chat System
```
POST   /api/chat/conversations      # Create conversation
GET    /api/chat/conversations/:id  # Get conversation
POST   /api/chat/conversations/:id/messages  # Send message
GET    /api/chat/conversations/:id/messages  # Get messages
PUT    /api/chat/messages/:id/read  # Mark message as read
```

### Admin Panel
```
GET    /api/admin/dashboard/stats   # Dashboard statistics
GET    /api/admin/users             # Manage users
GET    /api/admin/providers         # Manage providers
GET    /api/admin/reviews           # Moderate reviews
GET    /api/admin/system/health     # System health
```

## 🏗️ Architecture

### Dependency Injection
The application uses a custom DI container for clean architecture:

```typescript
// Service registration
container.registerClass('UserService', UserService, {
  singleton: true,
  dependencies: []
});

// Service resolution
const userService = container.resolve<IUserService>('UserService');
```

### Service Layer Pattern
Business logic is encapsulated in service classes:

```typescript
export class UserService implements IUserService {
  async createUser(userData: CreateUserDto): Promise<ApiResponseDto> {
    // Business logic here
  }
}
```

### Data Transfer Objects (DTOs)
Type-safe data contracts for API requests/responses:

```typescript
export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'user' | 'provider';
}
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Request validation middleware
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers middleware
- **Rate Limiting**: API rate limiting (can be added)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📊 Monitoring & Logging

- **Morgan**: HTTP request logging
- **Error Handling**: Centralized error handling
- **Health Checks**: System health monitoring endpoint
- **Audit Logs**: Admin action logging

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t service-platform .

# Run with Docker Compose
docker-compose up -d
```

### Environment Variables
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongo:27017/serviceplatform
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=7d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Migration & Backward Compatibility

### 🆕 **Unified Optimized Architecture (Current)**
The platform now uses a **unified optimized architecture** as the default implementation:
- **Entry Point**: `src/app.ts` (uses unified optimized system)
- **Services**: Optimized with performance tracking and enterprise features
- **Container**: Unified OptimizedContainer with advanced metrics
- **Performance**: Built-in development metrics and optimization tracking

### 🔙 **Legacy Support**
For backward compatibility, legacy implementations are preserved:
- **Legacy Routes**: Traditional Express routes still available
- **Legacy Services**: Original service implementations maintained
- **Legacy Container**: Original DI container accessible

### 🚀 **Migration Path**
To migrate from legacy to modular:

1. **Current Users**: No action needed - modular is now default
2. **Custom Implementations**: Use `npm run dev:legacy` for old behavior
3. **Gradual Migration**: Mix legacy and modular components as needed
4. **Full Migration**: Follow the [Modular Architecture Guide](docs/MODULAR_ARCHITECTURE.md)

### 📋 **Script Mapping**
```bash
# NEW (Default)
npm run dev              # Modular architecture
npm start                # Modular production

# LEGACY (Compatibility)
npm run dev:legacy       # Original implementation
npm run start:legacy     # Original production

# HYBRID (Development)
npm run dev:decorators   # Decorator services only
npm run dev:server       # Enhanced server
```

## 🔄 Changelog

### v2.0.0 - Modular Architecture
- **🏗️ NEW**: Complete modular architecture with dependency injection
- **🎯 NEW**: Decorator-based services with caching, retry, and logging
- **📦 NEW**: Module system with lifecycle management
- **🔍 NEW**: Service discovery and health monitoring
- **⚡ NEW**: Advanced caching and retry logic
- **🛡️ NEW**: Enhanced error handling and graceful recovery
- **📊 NEW**: Real-time system monitoring endpoints
- **🔄 MAINTAINED**: Full backward compatibility with legacy implementation

### v1.0.0 - Initial Release
- Initial release with core features
- User and provider management
- Service request system
- Review and rating system
- Real-time chat functionality
- Admin dashboard
- Dependency injection architecture

---

Built with ❤️ using ExpressJS, MongoDB, and TypeScript
