# SmartFixAPI

A comprehensive service marketplace API built with Node.js, TypeScript, and MongoDB. This platform connects service providers with customers, enabling seamless service request management, real-time communication, and secure payment processing.

## 🆕 Recent Updates

### AdminController Modernization (Latest)
- **Converted to Modern Async/Await Pattern**: Replaced legacy asyncHandler pattern with native async/await and try-catch error handling
- **Enhanced Type Safety**: Improved TypeScript integration with proper AdminFiltersDto parameter handling
- **Service Interface Alignment**: Updated all service method calls to match IAdminService interface specifications
- **Code Quality Improvements**: Removed unused variables, fixed compilation errors, and standardized error handling
- **Maintained Backward Compatibility**: All existing functionality preserved while modernizing the underlying implementation

### Architecture Improvements
- **Standardized Error Handling**: Consistent try-catch patterns across all controller methods
- **Improved Parameter Validation**: Enhanced request parameter processing with proper type safety
- **Service Layer Integration**: Better alignment between controllers and service interfaces
- **TypeScript Compilation**: Resolved compilation errors for improved development experience

### Development Status
- **Active Development**: Continuous modernization and improvement of codebase
- **TypeScript Compliance**: Ongoing efforts to resolve compilation issues and improve type safety
- **Code Quality**: Regular refactoring to maintain modern Node.js and TypeScript best practices
- **Backward Compatibility**: All updates maintain existing API functionality

## 🚀 Features

### Core Functionality
- **User Management**: Registration, authentication, profile management with role-based access control
- **Service Marketplace**: Browse, search, and filter service providers by category, location, and ratings
- **Service Requests**: Create, manage, and track service requests with real-time status updates
- **Provider Management**: Provider registration, approval workflow, portfolio management
- **Real-time Communication**: WebSocket-based chat system for customer-provider communication
- **Review & Rating System**: Comprehensive feedback system with detailed reviews and ratings
- **Payment Integration**: Secure payment processing with multiple payment methods
- **Admin Dashboard**: Complete administrative interface for platform management

### Advanced Features
- **Geolocation Services**: Location-based service matching and distance calculations
- **Smart Notifications**: Real-time notifications via WebSocket, email, and push notifications
- **File Upload Management**: Secure file handling for portfolios, service images, and documents
- **Advanced Search**: Full-text search with filters, sorting, and pagination
- **Analytics & Reporting**: Comprehensive analytics for users, providers, and administrators
- **API Rate Limiting**: Intelligent rate limiting to prevent abuse
- **Caching Layer**: Redis-based caching for improved performance

## 🏗️ Architecture

### Modern TypeScript Architecture
- **Decorator-based Controllers**: Clean, maintainable controller architecture using decorators
- **Modern Async/Await Pattern**: Native async/await with comprehensive try-catch error handling (recently modernized)
- **Dependency Injection**: Modern DI container for loose coupling and testability
- **Service Layer Pattern**: Separation of business logic from controllers with strict interface compliance
- **Repository Pattern**: Data access abstraction for flexible database operations
- **Middleware Pipeline**: Comprehensive middleware for authentication, validation, and error handling
- **Type-Safe Error Handling**: Standardized error responses with proper TypeScript integration

### Optimized Conditional Logic
The codebase features extensively optimized conditional patterns for improved maintainability:

#### ConditionalHelpers Utility
- **Guard Clauses**: Early return patterns for cleaner code flow
- **Validation Helpers**: Reusable validation functions for common patterns
- **Role-based Access Control**: Centralized permission checking
- **Status Transition Management**: Controlled state transitions with validation
- **Parameter Validation**: Standardized request parameter validation

#### Strategy Pattern Implementation
- **Pluggable Business Logic**: Strategy pattern for complex conditional logic
- **User Action Strategies**: Modular user management operations
- **Provider Action Strategies**: Flexible provider workflow management
- **Validation Strategies**: Composable validation rules
- **Status Transition Strategies**: State machine-like status management

### Database Design
- **MongoDB with Mongoose**: Flexible document-based data modeling
- **Optimized Indexes**: Strategic indexing for query performance
- **Data Relationships**: Efficient relationship modeling with population
- **Schema Validation**: Comprehensive data validation at the database level

## 📁 Project Structure

```
src/
├── controllers/           # Request handlers with decorator-based routing
│   ├── admin/            # Administrative functionality
│   ├── auth/             # Authentication and authorization
│   ├── chat/             # Real-time messaging
│   ├── payment/          # Payment processing
│   ├── provider/         # Service provider management
│   ├── request/          # Service request handling
│   ├── review/           # Review and rating system
│   └── user/             # User management
├── services/             # Business logic layer
│   ├── admin/            # Admin service implementations
│   ├── auth/             # Authentication services
│   ├── chat/             # Chat service logic
│   ├── notification/     # Notification services
│   ├── payment/          # Payment processing services
│   ├── provider/         # Provider management services
│   ├── request/          # Service request services
│   ├── review/           # Review services
│   └── user/             # User services
├── models/               # Database models and schemas
├── middleware/           # Express middleware functions
├── utils/                # Utility functions and helpers
│   ├── conditions/       # Conditional logic optimization
│   │   ├── ConditionalHelpers.ts    # Guard clauses and validation helpers
│   │   └── StrategyPatterns.ts      # Strategy pattern implementations
│   ├── validation/       # Input validation utilities
│   ├── email/            # Email service utilities
│   ├── upload/           # File upload utilities
│   └── cache/            # Caching utilities
├── interfaces/           # TypeScript interfaces and types
├── decorators/           # Custom decorators for controllers and services
├── dtos/                 # Data Transfer Objects
├── config/               # Configuration files
└── types/                # TypeScript type definitions
```

## 🛠️ Technology Stack

### Backend Core
- **Node.js**: Runtime environment
- **TypeScript**: Type-safe JavaScript development
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling

### Authentication & Security
- **JWT**: JSON Web Token authentication
- **bcrypt**: Password hashing
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API protection

### Real-time Features
- **Socket.IO**: WebSocket communication
- **Redis**: Session storage and caching
- **Bull Queue**: Background job processing

### File & Media
- **Multer**: File upload handling
- **Sharp**: Image processing
- **AWS S3**: Cloud storage (optional)

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Nodemon**: Development server
- **Docker**: Containerization

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smartfixapi.git
   cd smartfixapi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/smartfix
   REDIS_URL=redis://localhost:6379
   
   # Authentication
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # Server
   PORT=3000
   NODE_ENV=development
   
   # Email Service
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # File Upload
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   
   # Payment (Stripe)
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB and Redis
   mongod
   redis-server
   
   # Run database migrations (if any)
   npm run migrate
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register          # User registration
POST /api/auth/login             # User login
POST /api/auth/logout            # User logout
POST /api/auth/refresh           # Refresh JWT token
POST /api/auth/forgot-password   # Password reset request
POST /api/auth/reset-password    # Password reset confirmation
```

### User Management
```
GET    /api/users/profile        # Get user profile
PUT    /api/users/profile        # Update user profile
DELETE /api/users/profile        # Delete user account
POST   /api/users/upload-avatar  # Upload profile picture
```

### Service Requests
```
GET    /api/requests             # List service requests
POST   /api/requests             # Create service request
GET    /api/requests/:id         # Get specific request
PUT    /api/requests/:id         # Update service request
DELETE /api/requests/:id         # Delete service request
POST   /api/requests/:id/accept-provider/:providerId  # Accept provider
POST   /api/requests/:id/reject-provider/:providerId  # Reject provider
```

### Provider Management
```
GET    /api/providers            # List service providers
POST   /api/providers/register   # Register as provider
GET    /api/providers/:id        # Get provider details
PUT    /api/providers/:id        # Update provider profile
POST   /api/providers/:id/portfolio  # Add portfolio item
GET    /api/providers/search     # Search providers
```

### Reviews & Ratings
```
GET    /api/reviews/:providerId  # Get provider reviews
POST   /api/reviews             # Create review
PUT    /api/reviews/:id         # Update review
DELETE /api/reviews/:id         # Delete review
```

### Real-time Chat
```
GET    /api/chat/conversations   # Get user conversations
POST   /api/chat/conversations   # Start new conversation
GET    /api/chat/conversations/:id/messages  # Get messages
POST   /api/chat/conversations/:id/messages  # Send message
```

### Admin Endpoints
```
GET    /api/admin/dashboard      # Admin dashboard stats
GET    /api/admin/users          # Manage users
PUT    /api/admin/users/:id/status  # Update user status
GET    /api/admin/providers      # Manage providers
PUT    /api/admin/providers/:id/approve  # Approve provider
GET    /api/admin/reports        # Generate reports
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/smartfix |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `SMTP_HOST` | Email SMTP host | - |
| `SMTP_PORT` | Email SMTP port | 587 |
| `SMTP_USER` | Email username | - |
| `SMTP_PASS` | Email password | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |
| `UPLOAD_PATH` | File upload directory | ./uploads |
| `MAX_FILE_SIZE` | Maximum file size | 5242880 |

### Database Configuration

The application uses MongoDB with Mongoose for data modeling. Key collections include:

- **users**: User accounts and profiles
- **serviceproviders**: Provider profiles and services
- **servicerequests**: Service requests and bookings
- **reviews**: Reviews and ratings
- **conversations**: Chat conversations
- **messages**: Chat messages
- **notifications**: User notifications

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "User Service"
```

### Test Structure
```
tests/
├── unit/                 # Unit tests
│   ├── controllers/      # Controller tests
│   ├── services/         # Service tests
│   ├── models/           # Model tests
│   └── utils/            # Utility tests
├── integration/          # Integration tests
│   ├── auth/             # Authentication flow tests
│   ├── api/              # API endpoint tests
│   └── database/         # Database tests
└── e2e/                  # End-to-end tests
    ├── user-journey/     # Complete user workflows
    └── admin-workflow/   # Admin functionality tests
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build the Docker image
docker build -t smartfixapi .

# Run with Docker Compose
docker-compose up -d
```

### Production Environment
```bash
# Install production dependencies
npm ci --only=production

# Build the application
npm run build

# Start the production server
npm start
```

### Environment-specific Configurations

#### Development
- Hot reloading with nodemon
- Detailed error messages
- Development database
- Local file storage

#### Production
- Optimized builds
- Error logging
- Production database with replicas
- Cloud storage (AWS S3)
- Load balancing
- SSL/TLS encryption

## 📊 Performance Optimization

### Conditional Logic Optimization
The codebase implements several optimization patterns:

#### Guard Clauses
```typescript
// Before: Nested conditions
if (user) {
  if (user.isActive) {
    if (user.role === 'admin') {
      // Process admin logic
    } else {
      throw new Error('Insufficient permissions');
    }
  } else {
    throw new Error('User inactive');
  }
} else {
  throw new Error('User not found');
}

// After: Guard clauses with ConditionalHelpers
const authError = ConditionalHelpers.guardAuthenticated(user);
if (authError) {
  throw new Error(authError);
}

const roleError = ConditionalHelpers.guardAuthorized(user.role, ['admin']);
if (roleError) {
  throw new Error(roleError);
}

// Process admin logic
```

#### Strategy Pattern
```typescript
// Before: Complex switch statements
switch (action) {
  case 'activate':
    // Activation logic
    break;
  case 'deactivate':
    // Deactivation logic
    break;
  case 'suspend':
    // Suspension logic
    break;
  default:
    throw new Error('Invalid action');
}

// After: Strategy pattern
const userActionRegistry = StrategyFactory.createUserActionRegistry();
const result = await userActionRegistry.execute(action, { userId, data });
```

#### Modern Async/Await Pattern
```typescript
// Before: AsyncHandler pattern
getAllUsers = this.asyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, ...filters } = req.query;
  const result = await this.adminService.getAllUsers({
    page, limit, sortBy, sortOrder, ...filters
  });
  this.sendSuccess(res, result, 'Users retrieved successfully');
});

// After: Modern async/await with proper error handling
async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page, limit, sortBy, sortOrder, ...filters } = req.query;
    const result = await this.adminService.getAllUsers({
      page,
      limit,
      ...(sortBy && { sortBy }),
      sortOrder,
      ...filters
    });
    this.sendSuccess(res, result, 'Users retrieved successfully');
  } catch (error: any) {
    this.sendError(res, error.message || 'Failed to retrieve users', 400);
  }
}
```

### Database Optimization
- Strategic indexing on frequently queried fields
- Aggregation pipelines for complex queries
- Connection pooling for better resource management
- Query optimization with explain plans

### Caching Strategy
- Redis caching for frequently accessed data
- API response caching
- Session storage optimization
- Cache invalidation strategies

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Account lockout after failed attempts

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting

### File Upload Security
- File type validation
- Size limitations
- Virus scanning (optional)
- Secure file storage

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive tests
- Document new features
- Follow conventional commit messages

### Pull Request Guidelines
- Provide clear description of changes
- Include relevant tests
- Update documentation if needed
- Ensure CI/CD checks pass
- Request review from maintainers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Express.js community for the robust web framework
- MongoDB team for the flexible database solution
- TypeScript team for type-safe JavaScript development
- All contributors who have helped improve this project

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@smartfixapi.com
- Documentation: [docs.smartfixapi.com](https://docs.smartfixapi.com)

---

**SmartFixAPI** - Connecting service providers with customers through intelligent technology.
