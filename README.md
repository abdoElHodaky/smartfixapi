# SmartFix Service Providers Platform

A modern service providers platform built with **ExpressJS**, **MongoDB**, and **TypeScript**, featuring user management, service requests, reviews, real-time chat, and admin functionality.

## 🚀 Features

### Core Features
- **User Management**: Registration, authentication, profile management
- **Service Provider System**: Provider registration, verification, service listings
- **Service Requests**: Request creation, matching, status tracking
- **Review System**: Rating and review management
- **Real-time Chat**: Messaging between users and providers
- **Admin Dashboard**: Comprehensive admin panel with analytics

### Technical Features
- **🛡️ TypeScript**: Full type safety and modern JavaScript features
- **🗄️ MongoDB**: Document-based database with Mongoose ODM
- **🔐 JWT Authentication**: Secure token-based authentication
- **👥 Role-based Authorization**: User, Provider, and Admin roles
- **🚨 Error Handling**: Centralized error handling middleware
- **✅ Input Validation**: Request validation and sanitization
- **📚 API Documentation**: RESTful API with comprehensive endpoints
- **🧪 Testing**: Jest testing framework with basic test coverage
- **🔧 Development Tools**: Hot reload, linting, and formatting

## 📁 Project Structure

```
src/
├── 🎮 controllers/       # API route controllers
│   ├── admin/           # Admin management controllers
│   ├── auth/            # Authentication controllers
│   ├── chat/            # Chat messaging controllers
│   ├── provider/        # Service provider controllers
│   ├── request/         # Service request controllers
│   ├── review/          # Review system controllers
│   ├── user/            # User management controllers
│   └── BaseController.ts # Base controller with common functionality
├── 📋 dtos/             # Data transfer objects
│   ├── admin/           # Admin DTOs
│   ├── auth/            # Authentication DTOs
│   ├── chat/            # Chat DTOs
│   ├── provider/        # Provider DTOs
│   ├── request/         # Request DTOs
│   ├── review/          # Review DTOs
│   └── user/            # User DTOs
├── 🗄️ models/           # Mongoose database models
├── 🛡️ middleware/        # Express middleware
├── 🛤️ routes/            # API routes
├── 🎯 services/          # Business logic services
├── ⚙️ config/            # Configuration files
├── 🔌 interfaces/       # TypeScript interfaces
├── 📝 types/            # TypeScript type definitions
├── 🧪 __tests__/        # Test files
├── app.ts              # Main application entry point
└── server.ts           # Server configuration
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
   # Development
   npm run dev              # Start development server with hot reload
   
   # Production
   npm run build            # Build TypeScript to JavaScript
   npm start                # Start production server
   
   # Testing
   npm test                 # Run all tests
   npm run test:watch       # Run tests in watch mode
   npm run test:coverage    # Run tests with coverage report
   
   # Code Quality
   npm run lint             # Run ESLint
   npm run format           # Format code with Prettier
   npm run type-check       # TypeScript type checking
   ```

## 🌐 Application Endpoints

Once running, access these endpoints:

- **🏠 Main Application**: `http://localhost:3000`
- **💚 Health Check**: `http://localhost:3000/health`
- **📚 API Base**: `http://localhost:3000/api`

## 🏗️ Architecture Overview

The SmartFix platform uses a **traditional Express.js architecture** with TypeScript:

### 🎯 **Key Benefits**

- **🔧 Maintainability**: Clean separation of concerns with MVC pattern
- **🚀 Scalability**: Well-structured codebase for easy feature additions
- **🧪 Testability**: Jest testing framework with comprehensive test coverage
- **🔄 Reusability**: Shared DTOs and interfaces across the application
- **📊 Monitoring**: Health check endpoints and error logging
- **⚡ Performance**: Efficient MongoDB queries and response caching

### 📦 **Application Structure**

The application follows a layered architecture:
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data processing
- **Models**: Database schemas and data validation
- **DTOs**: Data transfer objects for type safety
- **Middleware**: Authentication, validation, and error handling

### 🔍 **API Design**

The platform provides RESTful APIs:
- **Health Check**: `/health` - Application health status
- **Authentication**: JWT-based secure authentication
- **Role-based Access**: User, Provider, and Admin roles
- **Input Validation**: Request validation and sanitization

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

## 🏗️ Technical Architecture

### Controller Layer
Controllers handle HTTP requests and delegate to services:

```typescript
export class UserController extends BaseController {
  async createUser(req: Request, res: Response): Promise<void> {
    const userData = req.body as CreateUserDto;
    const result = await this.userService.createUser(userData);
    this.sendSuccess(res, 'User created successfully', result);
  }
}
```

### Service Layer Pattern
Business logic is encapsulated in service classes:

```typescript
export class UserService {
  async createUser(userData: CreateUserDto): Promise<User> {
    // Validation and business logic
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return await User.create({ ...userData, password: hashedPassword });
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

The project uses Jest for testing with TypeScript support:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch

# Run specific test types
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e         # End-to-end tests only
```

### Test Structure
```
src/__tests__/
├── basic.test.ts        # Basic functionality tests
├── unit/               # Unit tests for individual components
├── integration/        # Integration tests for API endpoints
└── e2e/               # End-to-end tests
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

## 📈 Development Status

### ✅ **Current Features**
- **Authentication**: JWT-based user authentication
- **User Management**: User registration and profile management
- **Service Providers**: Provider registration and management
- **Service Requests**: Request creation and tracking
- **Reviews**: Rating and review system
- **Admin Panel**: Basic admin functionality
- **Chat System**: Real-time messaging (in development)

### 🚧 **In Development**
- Enhanced admin dashboard with analytics
- Real-time chat functionality
- Advanced search and filtering
- Payment integration
- Mobile API optimizations

### 🔮 **Planned Features**
- Push notifications
- Advanced reporting
- Multi-language support
- API rate limiting
- Advanced caching strategies

---

Built with ❤️ using ExpressJS, MongoDB, and TypeScript
