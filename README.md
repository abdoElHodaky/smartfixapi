# SmartFixAPI

A comprehensive service marketplace API built with Node.js, TypeScript, and Express.js that connects users with service providers for various repair and maintenance needs.

## 🚀 Features

- **User Management**: Complete authentication system with JWT tokens, email verification, and password reset
- **Service Marketplace**: Connect users with qualified service providers
- **Real-time Chat**: Built-in messaging system for user-provider communication
- **Review System**: Comprehensive rating and review system for service quality
- **Admin Dashboard**: Administrative controls for platform management
- **Provider Management**: Tools for service providers to manage their offerings and availability

## 🏗️ Architecture

### Modern Controller Pattern

The project has been systematically modernized to use a consistent, decorator-based architecture:

```typescript
@Controller('/api/auth')
export class AuthController extends BaseController {
  @Post('/login')
  @UseMiddleware(validateBody(LoginDto))
  async login(req: Request, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'User Login');
      // Implementation
      this.sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      this.sendError(res, error.message, 400);
    }
  }
}
```

### Key Architectural Patterns

- **Decorator-based Middleware**: Using `@UseMiddleware()` instead of array-based middleware
- **Consistent Error Handling**: Standardized try-catch blocks with proper error responses
- **Type Safety**: Full TypeScript implementation with proper DTOs and interfaces
- **Validation**: Centralized validation using DTOs and middleware
- **Logging**: Comprehensive request logging and monitoring

## 📁 Project Structure

```
src/
├── controllers/           # API Controllers
│   ├── admin/            # ✅ Admin management (Reference Implementation)
│   ├── auth/             # ✅ Authentication & authorization (Completed)
│   ├── chat/             # 🔄 Real-time messaging (In Progress - 8/15 methods)
│   ├── provider/         # ⏳ Service provider management (Pending)
│   ├── request/          # ⏳ Service request handling (Pending)
│   ├── review/           # ⏳ Review and rating system (Pending)
│   └── user/             # ⏳ User profile management (Pending)
├── middleware/           # Custom middleware functions
├── models/              # Database models and schemas
├── services/            # Business logic layer
├── dto/                 # Data Transfer Objects
├── decorators/          # Custom decorators
├── utils/               # Utility functions
└── types/               # TypeScript type definitions
```

## 🔄 Modernization Progress

### ✅ Completed Controllers

#### AdminController (Reference Implementation)
- All methods use modern async/await pattern
- Decorator-based middleware implementation
- Consistent error handling and logging
- **Methods**: User management, system statistics, platform controls

#### AuthController (Fully Modernized)
- **register**: User registration with email verification
- **registerProvider**: Service provider registration
- **login**: JWT-based authentication
- **getProfile**: User profile retrieval
- **refreshToken**: Token refresh mechanism
- **logout**: Secure logout
- **forgotPassword**: Password reset initiation
- **resetPassword**: Password reset completion
- **verifyEmail**: Email verification
- **resendVerification**: Resend verification email

### 🔄 In Progress Controllers

#### ChatController (8/15 methods completed)
**Completed Methods:**
- `getChatByServiceRequest`: Retrieve chat for service request
- `createChatForServiceRequest`: Create new chat session
- `getMyChats`: Get user's chat list with pagination
- `getChatById`: Retrieve specific chat details
- `sendMessage`: Send message with validation
- `getMessages`: Retrieve chat messages with pagination
- `markMessagesAsRead`: Mark messages as read
- `updateMessage`: Edit existing messages

**Pending Methods:**
- `deleteMessage`: Delete messages
- `getChatParticipants`: Get chat participants
- `addParticipant`: Add participant to chat
- `removeParticipant`: Remove participant from chat
- `getUnreadCount`: Get unread message count
- `searchMessages`: Search within messages
- `archiveChat`: Archive chat sessions

### ⏳ Pending Controllers

#### ProviderController (16 methods)
- Profile management
- Service offerings
- Availability management
- Request handling
- Statistics and reviews

#### RequestController (15 methods)
- Service request creation
- Request management
- Provider matching
- Quote handling
- Status updates

#### ReviewController (17 methods)
- Review creation and management
- Rating system
- Review replies
- Moderation features
- Statistics

#### UserController (9 methods)
- Profile management
- Request history
- Notifications
- Account settings

## 🛠️ Development Guidelines

### Adding New Methods

When adding new controller methods, follow this pattern:

```typescript
@Post('/endpoint')
@RequireAuth()
@UseMiddleware(validateBody(YourDto))
async methodName(req: AuthRequest, res: Response): Promise<void> {
  try {
    this.logRequest(req, 'Operation Description');
    
    // Your business logic here
    const result = await this.service.performOperation(data);
    
    this.sendSuccess(res, result, 'Success message');
  } catch (error: any) {
    this.sendError(res, error.message, 400);
  }
}
```

### Validation DTOs

Create corresponding DTOs for request validation:

```typescript
export interface YourDto {
  field1: string;
  field2?: number;
  field3: boolean;
}
```

### Error Handling

Use consistent error handling patterns:
- Always wrap method body in try-catch
- Use `this.sendError()` for error responses
- Use `this.sendSuccess()` for success responses
- Include meaningful error messages

## 🔧 Technical Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Validation**: Custom middleware with DTOs
- **Architecture**: Decorator-based controllers
- **Testing**: Jest (configured)
- **Documentation**: Swagger/OpenAPI

## 📊 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /register-provider` - Provider registration
- `POST /login` - User login
- `GET /profile` - Get user profile
- `POST /refresh-token` - Refresh JWT token
- `POST /logout` - User logout
- `POST /forgot-password` - Initiate password reset
- `POST /reset-password` - Complete password reset
- `POST /verify-email` - Verify email address
- `POST /resend-verification` - Resend verification email

### Chat System (`/api/chats`)
- `GET /service-request/:requestId` - Get chat by service request
- `POST /service-request/:requestId` - Create chat for service request
- `GET /` - Get user's chats
- `GET /:chatId` - Get specific chat
- `POST /:chatId/messages` - Send message
- `GET /:chatId/messages` - Get messages
- `PUT /:chatId/messages/read` - Mark messages as read
- `PUT /:chatId/messages/:messageId` - Update message

### Admin (`/api/admin`)
- User management endpoints
- System statistics
- Platform controls

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartfixapi
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

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 Contributing

1. Follow the established patterns for controller modernization
2. Ensure all new methods include proper validation and error handling
3. Add appropriate tests for new functionality
4. Update documentation for API changes

## 🔄 Migration Status

**Overall Progress**: ~25% Complete

- ✅ **AdminController**: Complete (Reference)
- ✅ **AuthController**: Complete (10/10 methods)
- 🔄 **ChatController**: In Progress (8/15 methods)
- ⏳ **ProviderController**: Pending (0/16 methods)
- ⏳ **RequestController**: Pending (0/15 methods)
- ⏳ **ReviewController**: Pending (0/17 methods)
- ⏳ **UserController**: Pending (0/9 methods)

**Next Steps**:
1. Complete remaining ChatController methods
2. Modernize ProviderController
3. Modernize RequestController
4. Modernize ReviewController
5. Modernize UserController

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions, please contact the development team or create an issue in the repository.

