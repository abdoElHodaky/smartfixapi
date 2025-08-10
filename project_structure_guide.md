# SmartFix API - Complete Project Setup Guide

This guide will help you set up the complete SmartFix API project structure with all files.

## 📁 Project Directory Structure

Create this folder structure in your project directory:

```
smartfix-api/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── services/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── dist/ (will be created after build)
├── node_modules/ (will be created after npm install)
├── logs/ (create this directory)
├── .env (copy from .env.example)
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
└── nodemon.json
```

## 🔧 Step-by-Step Setup

### 1. Create Root Directory and Navigate
```bash
mkdir smartfix-api
cd smartfix-api
```

### 2. Create All Directories
```bash
mkdir -p src/{controllers,models,services,routes,middleware,config,types}
mkdir -p logs
mkdir -p dist
```

### 3. Create package.json
```json
{
  "name": "smartfix-api",
  "version": "1.0.0",
  "description": "SmartFix - On-demand Home Services Platform API",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rimraf dist",
    "prebuild": "npm run clean",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "format:check": "prettier --check src/**/*.ts",
    "prepare": "husky install"
  },
  "keywords": [
    "nodejs",
    "express",
    "typescript",
    "mongodb",
    "mongoose",
    "api",
    "home-services",
    "on-demand",
    "mvc",
    "rest-api"
  ],
  "author": "SmartFix Team",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "express-validator": "^7.0.1",
    "multer": "^1.4.5"
  },
  "devDependencies": {
    "@types/node": "^20.10.4",
    "@types/express": "^4.17.21",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.11",
    "@types/jest": "^29.5.8",
    "@types/supertest": "^2.0.16",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.1",
    "ts-node-dev": "^2.0.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/parser": "^6.13.1",
    "@typescript-eslint/eslint-plugin": "^6.13.1",
    "prettier": "^3.1.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "rimraf": "^5.0.5",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### 4. Create tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": false,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/controllers/*": ["src/controllers/*"],
      "@/models/*": ["src/models/*"],
      "@/services/*": ["src/services/*"],
      "@/routes/*": ["src/routes/*"],
      "@/middleware/*": ["src/middleware/*"],
      "@/types/*": ["src/types/*"],
      "@/config/*": ["src/config/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### 5. Create .env.example
```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/smartfix

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Email Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Gateway Configuration (Optional)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 6. Create .gitignore
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# TypeScript
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Uploads directory
uploads/

# Test files
*.test.js
test/
```

## 📄 Source Files

### src/types/index.ts
```typescript
import { Request } from 'express';

export interface Location {
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'provider' | 'admin';
  };
}
```

### src/config/database.ts
```typescript
import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartfix';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
```

### src/middleware/auth.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }
    req.user = user;
    next();
  });
};

export const authorizeRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    next();
  };
};
```

## 🚀 Quick Start Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Copy Environment File
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

## 📋 Complete File List to Create

You'll need to create these files in your project. I recommend copying the content from the previous artifacts for each file:

### Models (src/models/)
- `User.ts`
- `ServiceProvider.ts`
- `ServiceRequest.ts`
- `Review.ts`
- `Chat.ts`

### Controllers (src/controllers/)
- `AuthController.ts`
- `UserController.ts`
- `ServiceProviderController.ts`
- `ServiceRequestController.ts`
- `AdminController.ts`
- `ReviewController.ts`
- `ChatController.ts`

### Services (src/services/)
- `AuthService.ts`
- `ServiceRequestService.ts`

### Routes (src/routes/)
- `authRoutes.ts`
- `userRoutes.ts`
- `serviceProviderRoutes.ts`
- `serviceRequestRoutes.ts`
- `adminRoutes.ts`
- `reviewRoutes.ts`
- `chatRoutes.ts`

### Middleware (src/middleware/)
- `auth.ts` (already provided above)
- `validation.ts`
- `errorHandler.ts`

### Main Files (src/)
- `app.ts`
- `server.ts`

## 📝 Additional Configuration Files

### .eslintrc.js
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
  },
};
```

### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### jest.config.js
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
```

## 🎯 Next Steps

1. **Create the project structure** using the commands above
2. **Copy all file contents** from the previous artifacts to their respective files
3. **Install dependencies** with `npm install`
4. **Set up environment variables** by copying `.env.example` to `.env`
5. **Start MongoDB** service
6. **Run the development server** with `npm run dev`

The API will be available at `http://localhost:3000/api` with comprehensive documentation in the README.md file.

## 🔗 API Endpoints Overview

Once set up, your API will have these main endpoints:

- **Auth**: `/api/auth/*` - User/provider authentication
- **Users**: `/api/user/*` - User profile management
- **Providers**: `/api/provider/*` - Service provider operations
- **Requests**: `/api/requests/*` - Service request management
- **Admin**: `/api/admin/*` - Admin dashboard
- **Reviews**: `/api/reviews/*` - Rating system
- **Chat**: `/api/chat/*` - Real-time messaging
- **Health**: `/api/health` - API health check

This complete structure gives you a production-ready, scalable API with TypeScript, proper error handling, authentication, and comprehensive features for the SmartFix platform!