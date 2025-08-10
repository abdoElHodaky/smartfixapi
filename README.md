# Service Providers Platform 🔧

A comprehensive ExpressJS and Mongoose-based service providers platform that connects users with service providers. Built with modern architecture patterns including dependency injection, comprehensive error handling, and real-time communication.

## 🚀 Features

### Core Functionality
- **User Management**: Registration, authentication, profile management
- **Service Provider Management**: Provider registration, profile management, service offerings
- **Service Requests**: Create, manage, and track service requests
- **Real-time Chat**: Communication between users and providers
- **Review System**: Rating and review system for completed services
- **Admin Panel**: Administrative controls and analytics

### Technical Features
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Data Validation**: Comprehensive input validation using express-validator
- **Error Handling**: Centralized error handling with custom error classes
- **Rate Limiting**: API rate limiting to prevent abuse
- **Security**: Helmet.js, CORS, input sanitization
- **File Uploads**: Support for image and document uploads
- **Database**: MongoDB with Mongoose ODM
- **TypeScript**: Full TypeScript support for type safety

## 📋 Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB (v5.0 or higher)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartfix-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration values.

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # Database connection
│   └── constants.ts  # Application constants
├── controllers/      # Route controllers organized by feature
│   ├── auth/         # Authentication controllers
│   ├── user/         # User management controllers
│   ├── provider/     # Service provider controllers
│   ├── request/      # Service request controllers
│   ├── chat/         # Chat system controllers
│   ├── review/       # Review system controllers
│   ├── admin/        # Admin panel controllers
│   └── index.ts      # Controller exports
├── middleware/       # Custom middleware
│   ├── auth.ts       # Authentication middleware
│   ├── validation.ts # Input validation middleware
│   ├── errorHandler.ts # Error handling middleware
│   └── index.ts      # Middleware exports
├── models/           # Mongoose models
│   ├── User.ts       # User model
│   ├── ServiceProvider.ts # Service provider model
│   ├── ServiceRequest.ts  # Service request model
│   ├── Chat.ts       # Chat model
│   ├── Review.ts     # Review model
│   └── index.ts      # Model exports
├── routes/           # API routes organized by feature
│   ├── auth/         # Authentication routes
│   ├── user/         # User routes
│   ├── provider/     # Provider routes
│   ├── request/      # Request routes
│   ├── chat/         # Chat routes
│   ├── review/       # Review routes
│   ├── admin/        # Admin routes
│   └── index.ts      # Route exports
├── services/         # Business logic layer
│   ├── auth/         # Authentication services
│   ├── user/         # User services
│   ├── provider/     # Provider services
│   ├── request/      # Request services
│   ├── chat/         # Chat services
│   ├── review/       # Review services
│   ├── admin/        # Admin services
│   └── index.ts      # Service exports
├── types/            # TypeScript type definitions
│   ├── auth.ts       # Authentication types
│   ├── user.ts       # User types
│   ├── provider.ts   # Provider types
│   ├── request.ts    # Request types
│   ├── chat.ts       # Chat types
│   ├── review.ts     # Review types
│   ├── common.ts     # Common types
│   └── index.ts      # Type exports
├── utils/            # Utility functions
│   ├── helpers.ts    # General helper functions
│   ├── validators.ts # Custom validators
│   └── index.ts      # Utility exports
├── app.ts            # Express app configuration
└── server.ts         # Server bootstrap
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `DELETE /api/user/profile` - Delete user account
- `GET /api/user/requests` - Get user's service requests
- `GET /api/user/reviews` - Get user's reviews

### Service Providers
- `POST /api/provider/register` - Provider registration
- `GET /api/provider/profile` - Get provider profile
- `PUT /api/provider/profile` - Update provider profile
- `GET /api/provider/search` - Search providers
- `GET /api/provider/:id` - Get provider details
- `GET /api/provider/requests` - Get provider's requests
- `PUT /api/provider/availability` - Update availability

### Service Requests
- `POST /api/requests` - Create service request
- `GET /api/requests` - Get service requests
- `GET /api/requests/:id` - Get request details
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Cancel request
- `POST /api/requests/:id/accept` - Accept request (provider)
- `POST /api/requests/:id/complete` - Mark as completed

### Chat System
- `GET /api/chat/conversations` - Get user conversations
- `GET /api/chat/:conversationId/messages` - Get messages
- `POST /api/chat/:conversationId/messages` - Send message
- `PUT /api/chat/messages/:messageId/read` - Mark as read

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/provider/:providerId` - Get provider reviews
- `GET /api/reviews/user/:userId` - Get user reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/providers` - Get all providers
- `GET /api/admin/requests` - Get all requests
- `GET /api/admin/analytics` - Get platform analytics
- `PUT /api/admin/users/:id/status` - Update user status
- `PUT /api/admin/providers/:id/verify` - Verify provider

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## 📦 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run clean` - Clean build directory
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Prevent API abuse
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Mongoose ODM protection

## 🌍 Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend application URL

## 📈 Performance

- **Compression**: Gzip compression for responses
- **Caching**: Redis caching (optional)
- **Database Indexing**: Optimized MongoDB indexes
- **Connection Pooling**: MongoDB connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@smartfix.com or create an issue in the repository.

## 🔄 API Versioning

Current API version: v1
Base URL: `/api/v1` (future versions will use `/api/v2`, etc.)

## 📊 Monitoring

- Health check endpoint: `GET /api/health`
- API documentation: `GET /api`
- Metrics endpoint: `GET /api/metrics` (admin only)
