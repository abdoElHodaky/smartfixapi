# SmartFix API - Service Providers Platform

A comprehensive RESTful API for an on-demand home services platform built with Express.js, TypeScript, and MongoDB.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Service Provider System**: Provider registration, verification, and management
- **Service Requests**: Create, manage, and track service requests
- **Real-time Chat**: Communication between users and providers
- **Review System**: Rating and feedback system with provider responses
- **Admin Dashboard**: Platform administration and monitoring
- **Geolocation Services**: Location-based service matching
- **File Upload**: Profile images and service documentation
- **Security**: JWT authentication, rate limiting, input validation

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting
- **File Upload**: Multer
- **Testing**: Jest
- **Code Quality**: ESLint, Prettier

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── app.ts           # Express app configuration
└── server.ts        # Server entry point
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smartfix-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/smartfix
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/register-provider` - Register service provider
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/dashboard` - Get user dashboard
- `GET /api/user/service-requests` - Get user's service requests

### Service Providers
- `GET /api/provider/profile` - Get provider profile
- `PUT /api/provider/profile` - Update provider profile
- `GET /api/provider/dashboard` - Get provider dashboard
- `GET /api/provider/available-requests` - Get available service requests
- `POST /api/provider/proposal/:requestId` - Submit proposal

### Service Requests
- `POST /api/requests` - Create service request
- `GET /api/requests/:requestId` - Get service request details
- `PUT /api/requests/:requestId` - Update service request
- `POST /api/requests/:requestId/accept-proposal/:proposalId` - Accept proposal

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/provider/:providerId` - Get provider reviews
- `POST /api/reviews/:reviewId/response` - Add provider response

### Chat
- `GET /api/chat/service-request/:serviceRequestId` - Get chat for service request
- `POST /api/chat/:chatId/message` - Send message
- `GET /api/chat/:chatId/messages` - Get messages

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Get all users
- `GET /api/admin/providers` - Get all providers
- `PUT /api/admin/providers/:providerId/verify` - Verify provider

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 🏗️ Building for Production

Build the project:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## 📝 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet
- MongoDB injection protection

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smartfix` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `BCRYPT_SALT_ROUNDS` | Bcrypt salt rounds | `12` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

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

## 🚀 Deployment

The API can be deployed to various platforms:

- **Heroku**: Use the included `Procfile`
- **AWS**: Deploy using AWS Elastic Beanstalk or ECS
- **DigitalOcean**: Use App Platform or Droplets
- **Vercel**: Serverless deployment

Make sure to set up environment variables and MongoDB connection in your deployment platform.

