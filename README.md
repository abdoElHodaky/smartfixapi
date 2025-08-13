# SmartFixAPI

A modern, scalable API for connecting service providers with customers in need of repairs, maintenance, and other services.

## 🚀 Project Overview

SmartFixAPI is a comprehensive backend solution that enables seamless connections between service providers and customers. The platform handles service requests, provider management, user authentication, reviews, and more through a modern, decorator-based architecture.

### Key Features

- 🔐 **Secure Authentication**: JWT-based authentication with role-based access control
- 👥 **User Management**: Complete user lifecycle management with profile customization
- 🛠️ **Service Provider Management**: Provider profiles, portfolios, and availability management
- 📋 **Service Request Handling**: Create, track, and manage service requests with real-time updates
- ⭐ **Review System**: Comprehensive review and rating system for providers and services
- 📱 **Notifications**: Real-time notifications via multiple channels (email, push, SMS)
- 📊 **Analytics**: Detailed analytics and reporting for providers and administrators
- 🌍 **Geolocation**: Location-based service matching and provider discovery

## 🏗️ Architecture

SmartFixAPI follows a modern, modular architecture with the following key components:

- **Decorator-Based Services**: Enhanced functionality through composable decorators
- **Dependency Injection**: Clean, testable code with proper dependency management
- **Repository Pattern**: Data access abstraction for flexibility and maintainability
- **Strategy Pattern**: Flexible, extensible business logic implementation
- **Middleware Pipeline**: Configurable request processing pipeline

### Service Architecture

The application is built around core services that handle specific domains:

- **UserService**: User management and authentication
- **ProviderService**: Service provider profiles and management
- **ServiceRequestService**: Service request lifecycle management
- **ReviewService**: Ratings and reviews for providers and services
- **NotificationService**: Multi-channel notification delivery
- **PaymentService**: Secure payment processing and management
- **AdminService**: Administrative functions and system management

## 🛠️ Technical Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js with custom extensions
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh token rotation
- **Validation**: Custom validation framework with decorators
- **Documentation**: OpenAPI/Swagger
- **Testing**: Jest, Supertest
- **CI/CD**: GitHub Actions

## 📦 Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (v4.4+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/abdoElHodaky/smartfixapi.git
cd smartfixapi

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with the following variables:

```
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/smartfix

# Authentication
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Services
MAIL_SERVICE=smtp
MAIL_HOST=smtp.example.com
MAIL_USER=user@example.com
MAIL_PASS=password
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=user

# Run with coverage
npm test -- --coverage
```

## 📚 API Documentation

API documentation is available at `/api-docs` when running the server. It provides detailed information about all endpoints, request/response formats, and authentication requirements.

### Key Endpoints

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Providers**: `/api/providers/*`
- **Service Requests**: `/api/requests/*`
- **Reviews**: `/api/reviews/*`
- **Admin**: `/api/admin/*`

## 🔄 Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## 📋 Project Structure

```
smartfixapi/
├── src/
│   ├── controllers/       # Request handlers
│   ├── decorators/        # Service and method decorators
│   ├── dtos/              # Data transfer objects
│   ├── interfaces/        # TypeScript interfaces
│   ├── middleware/        # Express middleware
│   ├── models/            # Mongoose models
│   ├── modules/           # Feature modules
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   ├── app.ts             # Express application setup
│   └── server.ts          # Server entry point
├── docs/                  # Documentation
├── tests/                 # Test suites
├── .env.example           # Example environment variables
├── .eslintrc              # ESLint configuration
├── .gitignore             # Git ignore file
├── jest.config.js         # Jest configuration
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For questions or support, please contact the development team at [abdo.arh38@yahoo.com](mailto:abdo.arh38@yahoo.com).

