import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { attachControllers } from '@decorators/express';
import { Container } from '@decorators/di';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { serviceRegistry } from './container';

// Import decorator-based controllers
import { AuthController } from './controllers/auth/AuthController.decorator';
import { UserController } from './controllers/user/UserController.decorator';
import { ProviderController } from './controllers/provider/ProviderController.decorator';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'connected',
      container: 'initialized',
      decorators: 'enabled'
    }
  });
});

// Attach decorator-based controllers
attachControllers(app, [
  AuthController,
  UserController,
  ProviderController
]);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully');

    // Initialize service registry
    await serviceRegistry.initialize?.();
    console.log('✅ Service Registry initialized');

    // Initialize DI container
    const container = new Container();
    container.provide([
      { provide: 'AuthController', useClass: AuthController },
      { provide: 'UserController', useClass: UserController },
      { provide: 'ProviderController', useClass: ProviderController }
    ]);
    console.log('✅ DI Container initialized with decorator-based controllers');

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log('🎯 Using decorator-based routing with @decorators/express');
      console.log('📋 Available routes:');
      console.log('  - POST /api/auth/register');
      console.log('  - POST /api/auth/login');
      console.log('  - GET  /api/auth/profile');
      console.log('  - GET  /api/users/profile');
      console.log('  - GET  /api/providers/profile');
      console.log('  - GET  /api/providers/search');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

export { app };
