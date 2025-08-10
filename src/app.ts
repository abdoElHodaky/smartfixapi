import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler';

// Import routes
import {
  authRoutes,
  userRoutes,
  providerRoutes,
  requestRoutes,
  reviewRoutes,
  chatRoutes,
  adminRoutes
} from './routes';

// Load environment variables
dotenv.config();

// Create Express application
const app: Application = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'Rate limit exceeded'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'SmartFix API is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// API documentation endpoint
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to SmartFix API',
    data: {
      version: '1.0.0',
      description: 'On-demand Home Services Platform API',
      endpoints: {
        auth: '/api/auth',
        users: '/api/user',
        providers: '/api/provider',
        requests: '/api/requests',
        reviews: '/api/reviews',
        chat: '/api/chat',
        admin: '/api/admin',
        health: '/api/health'
      },
      documentation: 'https://api-docs.smartfix.com' // Placeholder
    }
  });
});

// Serve static files (for uploaded images, documents, etc.)
app.use('/uploads', express.static('uploads'));

// Handle 404 for undefined routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
