# SmartFix Service Providers API

A comprehensive ExpressJS service providers platform built with TypeScript, MongoDB, and advanced dependency injection patterns.

## 🚀 Features

- **Dependency Injection Container**: Clean architecture with proper service management
- **Type-Safe DTOs**: Comprehensive data transfer objects for all operations
- **Service Layer Architecture**: Separated business logic with interface-based design
- **Authentication & Authorization**: JWT-based auth with role management
- **Service Provider Management**: Complete provider lifecycle management
- **Service Request System**: End-to-end service request handling
- **Review & Rating System**: Comprehensive review management
- **Location-Based Services**: Geographic search and filtering
- **Portfolio Management**: Provider portfolio and showcase features

## 🏗️ Architecture

### Dependency Injection
The application uses a custom DI container that manages service lifecycles and dependencies:

```typescript
// Services are automatically resolved with their dependencies
const authService = serviceRegistry.getService<IAuthService>('AuthService');
const userService = serviceRegistry.getService<IUserService>('UserService');
```

### Service Layer
All business logic is encapsulated in service classes that implement well-defined interfaces:

- `IAuthService` - Authentication and authorization
- `IUserService` - User management operations
- `IProviderService` - Service provider operations
- `IServiceRequestService` - Service request lifecycle
- `IReviewService` - Review and rating management

### Data Transfer Objects (DTOs)
Type-safe data contracts for all API operations:

- Request DTOs: `UserRegistrationDto`, `CreateRequestDto`, etc.
- Response DTOs: `LoginResponseDto`, `ApiResponseDto`, etc.
- Filter DTOs: `UserFiltersDto`, `ProviderFiltersDto`, etc.

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartfix-service-providers
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or use your local MongoDB installation
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Project Structure

```
src/
├── app.ts                 # Application entry point
├── config/               # Configuration files
├── container/            # Dependency injection container
├── controllers/          # Request handlers
├── dtos/                # Data transfer objects
├── interfaces/          # Service interfaces
├── middleware/          # Express middleware
├── models/              # Mongoose models
├── routes/              # Route definitions
├── services/            # Business logic services
└── utils/               # Utility functions
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - JWT expiration time
- `BCRYPT_SALT_ROUNDS` - Password hashing rounds

### Database Setup

The application uses MongoDB with Mongoose ODM. Models include:

- `User` - User accounts and profiles
- `ServiceProvider` - Service provider profiles
- `ServiceRequest` - Service requests and lifecycle
- `Review` - Reviews and ratings

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/register-provider` - Register service provider
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/reset-password` - Reset password

### User Management

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete user account
- `GET /api/users/search` - Search users
- `GET /api/users/service-requests` - Get user's service requests
- `GET /api/users/reviews` - Get user's reviews

### Service Provider Management

- `GET /api/providers/:id` - Get provider details
- `PUT /api/providers/:id` - Update provider profile
- `GET /api/providers/search` - Search providers
- `POST /api/providers/:id/portfolio` - Add portfolio item
- `PUT /api/providers/:id/portfolio/:itemId` - Update portfolio item
- `DELETE /api/providers/:id/portfolio/:itemId` - Delete portfolio item

### Service Requests

- `POST /api/service-requests` - Create service request
- `GET /api/service-requests/:id` - Get service request details
- `PUT /api/service-requests/:id` - Update service request
- `DELETE /api/service-requests/:id` - Delete service request
- `POST /api/service-requests/:id/accept` - Accept service request
- `POST /api/service-requests/:id/reject` - Reject service request
- `POST /api/service-requests/:id/start` - Start service
- `POST /api/service-requests/:id/complete` - Complete service

### Reviews

- `POST /api/reviews` - Create review
- `GET /api/reviews/:id` - Get review details
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/reviews/provider/:providerId` - Get provider reviews
- `POST /api/reviews/:id/respond` - Respond to review

## 🧪 Testing

The project includes comprehensive testing setup:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Test structure:
- Unit tests for services
- Integration tests for API endpoints
- Mock implementations for external dependencies

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup

Ensure all production environment variables are set:
- Database connection strings
- JWT secrets
- External API keys
- CORS origins

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Changelog

### v1.0.0
- Initial release with complete service provider platform
- Dependency injection container implementation
- Comprehensive DTO system
- Service layer architecture
- Authentication and authorization
- Service request lifecycle management
- Review and rating system

