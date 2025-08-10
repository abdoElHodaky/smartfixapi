# Service Providers Platform - ExpressJS & MongoDB

A comprehensive service providers platform built with ExpressJS, MongoDB, and TypeScript, featuring dependency injection, real-time chat, and admin management.

## 🚀 Features

### Core Features
- **User Management**: Registration, authentication, profile management
- **Service Provider System**: Provider registration, verification, service listings
- **Service Requests**: Request creation, matching, status tracking
- **Review System**: Rating and review management
- **Real-time Chat**: Messaging between users and providers
- **Admin Dashboard**: Comprehensive admin panel with analytics

### Technical Features
- **Dependency Injection**: Clean architecture with DI container
- **TypeScript**: Full type safety and modern JavaScript features
- **MongoDB**: Document-based database with Mongoose ODM
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: User, Provider, and Admin roles
- **Error Handling**: Centralized error handling middleware
- **Input Validation**: Request validation and sanitization
- **API Documentation**: RESTful API design

## 📁 Project Structure

```
src/
├── config/           # Configuration files
├── container/        # Dependency injection container
├── controllers/      # Request handlers
├── dtos/            # Data transfer objects
├── interfaces/      # Service interfaces
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── app.ts           # Express app configuration
└── server.ts        # Server entry point
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
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

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

## 🔄 Changelog

### v1.0.0
- Initial release with core features
- User and provider management
- Service request system
- Review and rating system
- Real-time chat functionality
- Admin dashboard
- Dependency injection architecture

---

Built with ❤️ using ExpressJS, MongoDB, and TypeScript

