# SmartFixAPI - Modern Validation System

## 🚀 Overview

SmartFixAPI is a comprehensive service request management platform built with Node.js, TypeScript, and Express. This project features a modern, decorator-based architecture with comprehensive input validation using class-validator.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Validation System](#validation-system)
- [API Endpoints](#api-endpoints)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Contributing](#contributing)

## 🏗️ Architecture Overview

### Modern Controller Architecture

The API uses a decorator-based controller architecture with:

- **BaseController**: Provides standardized patterns for all controllers
- **Dependency Injection**: Modern service registry pattern
- **Decorator-based Routing**: `@Controller`, `@Get`, `@Post`, etc.
- **Middleware Integration**: `@UseMiddleware` for validation and authentication
- **Role-based Authorization**: `@RequireAuth`, `@RequireRoles`

### Project Structure

```
src/
├── controllers/           # API Controllers
│   ├── admin/            # Admin management endpoints
│   ├── auth/             # Authentication endpoints
│   ├── chat/             # Chat and messaging
│   ├── provider/         # Service provider management
│   ├── request/          # Service request management
│   ├── review/           # Review and rating system
│   └── user/             # User management
├── dtos/                 # Data Transfer Objects with validation
│   ├── admin/            # Admin operation DTOs
│   ├── auth/             # Authentication DTOs
│   ├── chat/             # Chat message DTOs
│   ├── common/           # Shared DTOs (pagination, params)
│   ├── provider/         # Provider service DTOs
│   ├── request/          # Service request DTOs
│   ├── review/           # Review DTOs
│   ├── statistics/       # Analytics DTOs
│   └── user/             # User profile DTOs
├── middleware/           # Express middleware
├── services/             # Business logic services
├── decorators/           # Custom decorators
└── validators/           # Custom validation rules
```

## 🛡️ Validation System

### Overview

The SmartFixAPI implements a comprehensive validation system using **class-validator** and **class-transformer** libraries, providing:

- **Type Safety**: Automatic type conversion and validation
- **Custom Validators**: Business-specific validation rules
- **Comprehensive Error Handling**: Detailed validation error messages
- **Security**: Input sanitization and whitelist validation
- **Performance**: Efficient validation with caching

### Validation Architecture

#### 1. Validation DTOs

All API endpoints use Data Transfer Objects (DTOs) with validation decorators:

```typescript
// Example: CreateRequestDto
export class CreateRequestDto {
  @IsNotEmpty({ message: 'Service type is required' })
  @IsEnum(ServiceType, { message: 'Invalid service type' })
  serviceType: ServiceType;

  @IsString({ message: 'Title must be a string' })
  @Length(5, 100, { message: 'Title must be between 5 and 100 characters' })
  title: string;

  @IsString({ message: 'Description must be a string' })
  @Length(20, 1000, { message: 'Description must be between 20 and 1000 characters' })
  description: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsEnum(UrgencyLevel, { message: 'Invalid urgency level' })
  urgency: UrgencyLevel;
}
```

#### 2. Custom Validators

The system includes custom validators for business-specific rules:

```typescript
// Time format validation (HH:MM)
@IsTimeFormat({ message: 'Time must be in HH:MM format' })
availableFrom: string;

// Currency code validation (ISO 4217)
@IsCurrencyCode({ message: 'Invalid currency code' })
currency: string;

// Price validation with range
@IsPrice({ min: 0, max: 10000, message: 'Price must be between 0 and 10000' })
price: number;

// Duration validation in minutes
@IsDurationMinutes({ min: 15, max: 480, message: 'Duration must be between 15 and 480 minutes' })
estimatedDuration: number;
```

#### 3. Validation Middleware

Three types of validation middleware are available:

```typescript
// Request body validation
@UseMiddleware(validateBody(CreateRequestDto))

// Query parameter validation
@UseMiddleware(validateQuery(RequestQueryDto))

// Route parameter validation
@UseMiddleware(validateParams(RequestIdParamDto))
```

### Validation Coverage

#### Request Management
- **CreateRequestDto**: Service request creation with location, urgency, and service type validation
- **UpdateRequestDto**: Partial updates with optional field validation
- **RequestQueryDto**: Search and filtering with pagination support
- **RequestLocationQueryDto**: Location-based search with radius validation
- **RequestMatchingQueryDto**: Provider matching with service type and availability filters

#### User Management
- **UpdateUserDto**: Profile updates with phone number and location validation
- **UserQueryDto**: User search and filtering with role-based access
- **UserLocationDto**: Location updates with coordinate validation

#### Provider Management
- **UpdateProviderDto**: Provider profile updates with service area validation
- **ServiceOfferingDto**: Service catalog with pricing and availability
- **AvailabilityDto**: Schedule management with time slot validation
- **PricingDto**: Dynamic pricing with currency and range validation

#### Review System
- **CreateReviewDto**: Review creation with rating and content validation
- **UpdateReviewDto**: Review updates with moderation support
- **ReviewQueryDto**: Query parameters with pagination, filtering by provider, rating, and sorting
- **ReviewSearchQueryDto**: Search functionality with query validation (2-100 characters)
- **ReviewReplyDto**: Provider replies to reviews with content length validation (1-500 characters)
- **FlagReviewDto**: Review flagging with reason validation (1-200 characters)
- **RecentReviewsQueryDto**: Recent reviews endpoint with limit validation
- **TopProvidersQueryDto**: Top-rated providers with limit and service type filtering

#### Chat System
- **SendMessageDto**: Message validation with content and attachment support
- **CreateConversationDto**: Conversation creation with participant validation

#### Admin Operations
- **UserManagementDto**: Bulk user operations with role validation
- **StatisticsQueryDto**: Analytics queries with date range validation

### Custom Validation Rules

#### 1. Time Format Validator
```typescript
@ValidatorConstraint({ name: 'isTimeFormat', async: false })
export class IsTimeFormatConstraint implements ValidatorConstraintInterface {
  validate(time: string): boolean {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }
}
```

#### 2. Currency Code Validator
```typescript
@ValidatorConstraint({ name: 'isCurrencyCode', async: false })
export class IsCurrencyCodeConstraint implements ValidatorConstraintInterface {
  validate(code: string): boolean {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED'];
    return validCurrencies.includes(code.toUpperCase());
  }
}
```

#### 3. Price Range Validator
```typescript
@ValidatorConstraint({ name: 'isPrice', async: false })
export class IsPriceConstraint implements ValidatorConstraintInterface {
  validate(price: number, args: ValidationArguments): boolean {
    const [min = 0, max = Number.MAX_SAFE_INTEGER] = args.constraints;
    return typeof price === 'number' && price >= min && price <= max;
  }
}
```

### Error Handling

The validation system provides comprehensive error handling:

```typescript
// Validation error response format
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "error": "Title must be between 5 and 100 characters, Invalid service type"
}
```

#### Error Types
- **Required Field Errors**: Missing required fields
- **Type Validation Errors**: Invalid data types
- **Format Validation Errors**: Invalid formats (email, phone, etc.)
- **Range Validation Errors**: Values outside allowed ranges
- **Business Rule Errors**: Custom validation rule violations

## 🔌 API Endpoints

### Service Request Management

#### Create Service Request
```http
POST /api/requests
Content-Type: application/json
Authorization: Bearer <token>

{
  "serviceType": "PLUMBING",
  "title": "Kitchen sink repair",
  "description": "Kitchen sink is leaking and needs immediate repair",
  "location": {
    "address": "123 Main St, Cairo, Egypt",
    "coordinates": {
      "latitude": 30.0444,
      "longitude": 31.2357
    }
  },
  "urgency": "HIGH",
  "preferredDate": "2024-08-15",
  "budget": {
    "min": 100,
    "max": 300,
    "currency": "EGP"
  }
}
```

#### Get User Requests
```http
GET /api/requests/my-requests?page=1&limit=10&status=PENDING&serviceType=PLUMBING
Authorization: Bearer <token>
```

#### Update Service Request
```http
PUT /api/requests/:requestId
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Updated kitchen sink repair",
  "description": "Updated description with more details",
  "urgency": "MEDIUM"
}
```

### Provider Management

#### Update Provider Profile
```http
PUT /api/providers/profile
Content-Type: application/json
Authorization: Bearer <token>

{
  "businessName": "Cairo Plumbing Services",
  "serviceArea": {
    "radius": 25,
    "center": {
      "latitude": 30.0444,
      "longitude": 31.2357
    }
  },
  "services": [
    {
      "serviceType": "PLUMBING",
      "basePrice": 150,
      "currency": "EGP",
      "estimatedDuration": 120
    }
  ]
}
```

#### Set Availability
```http
POST /api/providers/availability
Content-Type: application/json
Authorization: Bearer <token>

{
  "dayOfWeek": "MONDAY",
  "timeSlots": [
    {
      "startTime": "09:00",
      "endTime": "17:00",
      "isAvailable": true
    }
  ],
  "exceptions": [
    {
      "date": "2024-08-15",
      "isAvailable": false,
      "reason": "Holiday"
    }
  ]
}
```

### User Management

#### Update User Profile
```http
PUT /api/users/profile
Content-Type: application/json
Authorization: Bearer <token>

{
  "firstName": "Ahmed",
  "lastName": "Hassan",
  "phoneNumber": "+201234567890",
  "location": {
    "address": "New Cairo, Egypt",
    "coordinates": {
      "latitude": 30.0444,
      "longitude": 31.2357
    }
  },
  "preferences": {
    "language": "ar",
    "currency": "EGP",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    }
  }
}
```

### Review System

#### Create Review
```http
POST /api/reviews
Content-Type: application/json
Authorization: Bearer <token>

{
  "requestId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "providerId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "rating": 5,
  "comment": "Excellent service, very professional and timely",
  "categories": {
    "quality": 5,
    "timeliness": 5,
    "communication": 4,
    "value": 5
  }
}
```

#### Get Provider Reviews with Filtering
```http
GET /api/reviews/provider/64f8a1b2c3d4e5f6a7b8c9d1?page=1&limit=10&rating=5&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <token>
```

#### Search Reviews
```http
GET /api/reviews/search?query=excellent service&providerId=64f8a1b2c3d4e5f6a7b8c9d1&rating=5&page=1&limit=10
Authorization: Bearer <token>
```

#### Reply to Review (Provider)
```http
POST /api/reviews/64f8a1b2c3d4e5f6a7b8c9d2/reply
Content-Type: application/json
Authorization: Bearer <provider-token>

{
  "reply": "Thank you for your positive feedback! We're glad you were satisfied with our service."
}
```

#### Flag Review
```http
POST /api/reviews/64f8a1b2c3d4e5f6a7b8c9d2/flag
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "Inappropriate content or spam"
}
```

#### Get Recent Reviews
```http
GET /api/reviews/recent?limit=20
```

#### Get Top Rated Providers
```http
GET /api/reviews/top-providers?limit=10&serviceType=PLUMBING
```

### Chat System

#### Send Message
```http
POST /api/chats/:conversationId/messages
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Hello, I have a question about the service",
  "messageType": "TEXT",
  "attachments": [
    {
      "type": "IMAGE",
      "url": "https://example.com/image.jpg",
      "filename": "problem_photo.jpg"
    }
  ]
}
```

### Admin Operations

#### Get System Statistics
```http
GET /api/admin/statistics?startDate=2024-08-01&endDate=2024-08-31&metrics=requests,users,revenue
Authorization: Bearer <admin-token>
```

#### Manage Users
```http
POST /api/admin/users/bulk-action
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "action": "SUSPEND",
  "userIds": ["64f8a1b2c3d4e5f6a7b8c9d0", "64f8a1b2c3d4e5f6a7b8c9d1"],
  "reason": "Policy violation",
  "duration": 30
}
```

## 🚀 Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB 5.0+
- Redis (for caching)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/abdoElHodaky/smartfixapi.git
cd smartfixapi
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Database setup**
```bash
# Start MongoDB and Redis
npm run db:setup
```

5. **Run the application**
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/smartfixapi
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# External Services
GOOGLE_MAPS_API_KEY=your-google-maps-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run validation tests
npm run test:validation

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/
│   ├── validators/       # Custom validator tests
│   ├── dtos/            # DTO validation tests
│   └── services/        # Service logic tests
├── integration/
│   ├── controllers/     # Controller integration tests
│   ├── middleware/      # Middleware tests
│   └── validation/      # End-to-end validation tests
└── fixtures/            # Test data and mocks
```

### Example Test

```typescript
describe('CreateRequestDto Validation', () => {
  it('should validate a valid service request', async () => {
    const dto = new CreateRequestDto();
    dto.serviceType = ServiceType.PLUMBING;
    dto.title = 'Kitchen sink repair';
    dto.description = 'Kitchen sink is leaking and needs repair';
    dto.location = new LocationDto();
    dto.urgency = UrgencyLevel.HIGH;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation for invalid title length', async () => {
    const dto = new CreateRequestDto();
    dto.title = 'Hi'; // Too short

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.length).toContain('Title must be between 5 and 100 characters');
  });
});
```

## 🔧 Migration Status

### ✅ Completed Migrations

- **Request Controller**: Fully migrated to modern validation system
  - All endpoints use class-validator DTOs
  - Legacy validation methods removed
  - Comprehensive parameter, query, and body validation

- **Review Controller**: ✨ **NEWLY COMPLETED** ✨
  - All 13 endpoints migrated to modern validation middleware
  - Created comprehensive DTOs: ReviewQueryDto, ReviewSearchQueryDto, ReviewReplyDto, FlagReviewDto
  - Added parameter validation for all route parameters (reviewId, providerId, userId, serviceRequestId)
  - Removed all legacy validation code and manual validation logic
  - Enhanced type safety with proper query parameter transformation

- **Switch Block Optimizations**: ✨ **COMPLETED** ✨
  - AdminService: Optimized 3 switch blocks using strategy pattern
    - User action handlers (activate, deactivate, suspend, delete, update_role)
    - Provider action handlers (approve, reject, suspend)
    - Report generators (user_activity, provider_performance, service_requests, revenue)
  - ServiceRequestService: Optimized status timestamp handlers (in_progress, completed, cancelled)
  - Improved code maintainability and reduced cyclomatic complexity

### 🚧 In Progress

- **User Controller**: Migration in progress  
- **Provider Controller**: Migration in progress
- **Chat Controller**: Migration in progress
- **Admin Controller**: Migration in progress
- **Auth Controller**: Migration in progress

### 📋 Next Steps

1. **Complete Controller Migrations**: Migrate remaining controllers to use modern validation
2. **Legacy Code Cleanup**: Remove deprecated validation methods
3. **Test Coverage**: Add comprehensive validation tests
4. **Documentation**: Update API documentation with validation schemas
5. **Performance Optimization**: Optimize validation middleware performance

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/validation-enhancement
```

3. **Make your changes**
   - Follow the existing validation patterns
   - Add comprehensive tests
   - Update documentation

4. **Run tests**
```bash
npm test
npm run lint
```

5. **Submit a pull request**

### Validation Guidelines

When adding new validation:

1. **Create DTOs** for all input data
2. **Use appropriate decorators** from class-validator
3. **Add custom validators** for business rules
4. **Include comprehensive error messages**
5. **Write tests** for all validation scenarios
6. **Update documentation** with examples

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Write comprehensive JSDoc comments
- Follow naming conventions

## 📚 Additional Resources

- [class-validator Documentation](https://github.com/typestack/class-validator)
- [class-transformer Documentation](https://github.com/typestack/class-transformer)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

---

**SmartFixAPI** - Building the future of service request management with modern validation and type safety! 🚀
