# Service Providers API Documentation

## Overview
This is a comprehensive ExpressJS and Mongoose-based service providers platform that connects users with service providers. The platform includes features for user management, service requests, provider management, chat functionality, reviews, and administrative controls.

## Architecture

### Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **File Upload**: Multer for handling file uploads
- **Real-time Communication**: Socket.io for chat functionality
- **Security**: bcrypt for password hashing, helmet for security headers

### Project Structure
```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── middleware/       # Custom middleware
├── models/          # Mongoose schemas
├── routes/          # API routes
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "role": "user" // or "provider"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/refresh-token
Refresh the access token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new_jwt_token_here"
  }
}
```

#### POST /api/auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

#### POST /api/auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "newSecurePassword123"
}
```

### User Management Endpoints

#### GET /api/users/profile
Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "profileImage": "image_url",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### PUT /api/users/profile
Update user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }
}
```

#### POST /api/users/upload-avatar
Upload profile picture.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
avatar: <image_file>
```

### Service Provider Endpoints

#### POST /api/providers/register
Register as a service provider.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "businessName": "John's Plumbing Services",
  "description": "Professional plumbing services",
  "services": ["plumbing", "pipe-repair"],
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128]
  },
  "address": {
    "street": "123 Business Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "businessHours": {
    "monday": { "open": "09:00", "close": "17:00" },
    "tuesday": { "open": "09:00", "close": "17:00" }
  },
  "pricing": {
    "hourlyRate": 75,
    "minimumCharge": 100
  }
}
```

#### GET /api/providers/search
Search for service providers.

**Query Parameters:**
- `service`: Service category
- `lat`: Latitude for location-based search
- `lng`: Longitude for location-based search
- `radius`: Search radius in kilometers
- `minRating`: Minimum rating filter
- `maxPrice`: Maximum price filter
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Providers retrieved successfully",
  "data": {
    "providers": [
      {
        "_id": "provider_id",
        "businessName": "John's Plumbing Services",
        "services": ["plumbing"],
        "rating": 4.5,
        "reviewCount": 25,
        "location": {
          "type": "Point",
          "coordinates": [-74.006, 40.7128]
        },
        "pricing": {
          "hourlyRate": 75
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### GET /api/providers/:id
Get provider details by ID.

**Response:**
```json
{
  "success": true,
  "message": "Provider retrieved successfully",
  "data": {
    "provider": {
      "_id": "provider_id",
      "businessName": "John's Plumbing Services",
      "description": "Professional plumbing services",
      "services": ["plumbing", "pipe-repair"],
      "rating": 4.5,
      "reviewCount": 25,
      "location": {
        "type": "Point",
        "coordinates": [-74.006, 40.7128]
      },
      "businessHours": { /* business hours */ },
      "pricing": { /* pricing info */ },
      "portfolio": ["image1.jpg", "image2.jpg"]
    }
  }
}
```

### Service Request Endpoints

#### POST /api/requests
Create a new service request.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Kitchen Sink Repair",
  "description": "My kitchen sink is leaking and needs immediate repair",
  "category": "plumbing",
  "urgency": "high",
  "budget": {
    "min": 100,
    "max": 300
  },
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128]
  },
  "address": {
    "street": "123 Home St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "preferredDate": "2024-01-15T10:00:00.000Z",
  "images": ["image1.jpg", "image2.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Service request created successfully",
  "data": {
    "request": {
      "_id": "request_id",
      "title": "Kitchen Sink Repair",
      "description": "My kitchen sink is leaking and needs immediate repair",
      "category": "plumbing",
      "urgency": "high",
      "status": "pending",
      "user": { /* user info */ },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### GET /api/requests
Get user's service requests.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status

**Response:**
```json
{
  "success": true,
  "message": "Requests retrieved successfully",
  "data": {
    "requests": [
      {
        "_id": "request_id",
        "title": "Kitchen Sink Repair",
        "category": "plumbing",
        "status": "pending",
        "urgency": "high",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

#### GET /api/requests/:id
Get service request details.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Request retrieved successfully",
  "data": {
    "request": {
      "_id": "request_id",
      "title": "Kitchen Sink Repair",
      "description": "My kitchen sink is leaking and needs immediate repair",
      "category": "plumbing",
      "status": "pending",
      "user": { /* user info */ },
      "quotes": [
        {
          "_id": "quote_id",
          "provider": { /* provider info */ },
          "price": 200,
          "description": "I can fix this today",
          "estimatedDuration": "2 hours",
          "submittedAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  }
}
```

#### PUT /api/requests/:id
Update service request.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Updated Kitchen Sink Repair",
  "description": "Updated description",
  "urgency": "medium"
}
```

#### DELETE /api/requests/:id
Delete service request.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST /api/requests/:id/quotes
Submit a quote for a service request (Provider only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "price": 200,
  "description": "I can complete this job within 2 hours",
  "estimatedDuration": "2 hours",
  "materials": [
    {
      "name": "Pipe fitting",
      "cost": 25
    }
  ]
}
```

#### POST /api/requests/:id/quotes/:quoteId/accept
Accept a quote (User only).

**Headers:**
```
Authorization: Bearer <access_token>
```

### Chat Endpoints

#### GET /api/chats
Get user's chats.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `type`: Filter by chat type ('direct' or 'service')

**Response:**
```json
{
  "success": true,
  "message": "Chats retrieved successfully",
  "data": {
    "chats": [
      {
        "_id": "chat_id",
        "type": "service",
        "participants": [
          {
            "_id": "user_id",
            "firstName": "John",
            "lastName": "Doe",
            "profileImage": "image_url"
          }
        ],
        "serviceRequest": {
          "_id": "request_id",
          "title": "Kitchen Sink Repair"
        },
        "lastMessage": {
          "content": "When can you start?",
          "timestamp": "2024-01-01T00:00:00.000Z"
        },
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### GET /api/chats/:id
Get chat details and messages.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number for messages (default: 1)
- `limit`: Messages per page (default: 50)

**Response:**
```json
{
  "success": true,
  "message": "Chat retrieved successfully",
  "data": {
    "chat": {
      "_id": "chat_id",
      "participants": [ /* participant info */ ],
      "serviceRequest": { /* service request info */ }
    },
    "messages": [
      {
        "_id": "message_id",
        "sender": {
          "_id": "user_id",
          "firstName": "John",
          "lastName": "Doe"
        },
        "content": "Hello, when can you start the repair?",
        "type": "text",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "readBy": [
          {
            "user": "user_id",
            "readAt": "2024-01-01T00:00:00.000Z"
          }
        ]
      }
    ]
  }
}
```

#### POST /api/chats/:id/messages
Send a message in a chat.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "I can start tomorrow morning",
  "type": "text",
  "attachments": [
    {
      "url": "file_url",
      "type": "image",
      "name": "photo.jpg",
      "size": 1024000
    }
  ]
}
```

#### PUT /api/chats/:id/read
Mark messages as read.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Review Endpoints

#### POST /api/reviews
Create a review for a service provider.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "serviceRequest": "request_id",
  "provider": "provider_id",
  "rating": 5,
  "comment": "Excellent service! Very professional and completed the job quickly.",
  "categories": {
    "quality": 5,
    "timeliness": 5,
    "communication": 4,
    "value": 5
  }
}
```

#### GET /api/reviews/provider/:providerId
Get reviews for a specific provider.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `rating`: Filter by rating

**Response:**
```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "_id": "review_id",
        "user": {
          "firstName": "John",
          "lastName": "D.",
          "profileImage": "image_url"
        },
        "rating": 5,
        "comment": "Excellent service!",
        "categories": {
          "quality": 5,
          "timeliness": 5,
          "communication": 4,
          "value": 5
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": { /* pagination info */ },
    "summary": {
      "averageRating": 4.5,
      "totalReviews": 25,
      "ratingDistribution": {
        "5": 15,
        "4": 8,
        "3": 2,
        "2": 0,
        "1": 0
      }
    }
  }
}
```

### Admin Endpoints

#### GET /api/admin/dashboard
Get admin dashboard statistics.

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "stats": {
      "totalUsers": 1250,
      "totalProviders": 350,
      "totalRequests": 2500,
      "totalReviews": 1800,
      "activeRequests": 125,
      "completedRequests": 2200,
      "averageRating": 4.3
    },
    "recentActivity": [
      {
        "type": "user_registration",
        "data": { /* activity data */ },
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ],
    "charts": {
      "requestsByCategory": { /* chart data */ },
      "userGrowth": { /* chart data */ },
      "revenueByMonth": { /* chart data */ }
    }
  }
}
```

#### GET /api/admin/users
Get all users with pagination and filters.

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `role`: Filter by role
- `status`: Filter by status
- `search`: Search by name or email

#### PUT /api/admin/users/:id/status
Update user status (activate/deactivate).

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "status": "active" // or "inactive"
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Expiration
- Access tokens expire in 24 hours
- Refresh tokens expire in 7 days
- Use the refresh token endpoint to get new access tokens

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- General endpoints: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- File upload endpoints: 10 requests per hour

## File Upload

File uploads are handled using multipart/form-data:
- Maximum file size: 10MB
- Supported formats: JPG, PNG, PDF
- Files are stored securely and accessible via CDN URLs

## Real-time Features

The platform supports real-time features using Socket.io:
- Chat messages
- Request status updates
- New quote notifications
- Provider availability updates

### Socket Events
- `join_chat`: Join a chat room
- `send_message`: Send a chat message
- `message_received`: Receive a chat message
- `request_update`: Service request status update
- `new_quote`: New quote received notification

## Database Schema

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String (enum: ['user', 'provider', 'admin']),
  profileImage: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  isVerified: Boolean,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Service Provider Model
```javascript
{
  user: ObjectId (ref: User),
  businessName: String,
  description: String,
  services: [String],
  location: {
    type: String (default: 'Point'),
    coordinates: [Number] // [longitude, latitude]
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  businessHours: {
    monday: { open: String, close: String },
    // ... other days
  },
  pricing: {
    hourlyRate: Number,
    minimumCharge: Number
  },
  portfolio: [String], // image URLs
  rating: Number,
  reviewCount: Number,
  isVerified: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Service Request Model
```javascript
{
  user: ObjectId (ref: User),
  title: String,
  description: String,
  category: String,
  urgency: String (enum: ['low', 'medium', 'high']),
  status: String (enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']),
  budget: {
    min: Number,
    max: Number
  },
  location: {
    type: String (default: 'Point'),
    coordinates: [Number]
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  preferredDate: Date,
  images: [String],
  quotes: [{
    provider: ObjectId (ref: ServiceProvider),
    price: Number,
    description: String,
    estimatedDuration: String,
    materials: [{
      name: String,
      cost: Number
    }],
    submittedAt: Date
  }],
  assignedProvider: ObjectId (ref: ServiceProvider),
  acceptedQuote: Object,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/service-providers

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=10485760

# External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Redis (for caching and sessions)
REDIS_URL=redis://localhost:6379
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   cd service-providers-api
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
   mongod
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

6. **Run tests**
   ```bash
   npm test
   ```

## API Testing

Use the provided Postman collection or test with curl:

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "phone": "+1234567890"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
