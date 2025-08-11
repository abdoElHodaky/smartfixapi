/**
 * Enhanced Decorator-Based Express Application with @decorators/server
 * 
 * This implementation uses @decorators/server for advanced server functionality
 * including lifecycle management, enhanced middleware, and service integration.
 */

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { attachControllers } from '@decorators/express';
import { Container } from '@decorators/di';
import { Server } from '@decorators/server';

// Import database connection
import { connectDB } from './config/database';

// Import decorator-based controllers
import { AuthController } from './controllers/auth/AuthController.decorator';
import { UserController } from './controllers/user/UserController.decorator';
import { ProviderController } from './controllers/provider/ProviderController.decorator';

// Import decorator-based services
import { AuthService } from './services/auth/AuthService.decorator';
import { UserService } from './services/user/UserService.decorator';
import { ProviderService } from './services/provider/ProviderService.decorator';

// Import service utilities
import { ServiceUtils } from './decorators/service';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

/**
 * Enhanced Server Configuration with Decorators
 */
@Server({
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  compression: true,
  helmet: true,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
})
export class SmartFixServer {
  private app: express.Application;
  private container: Container;
  private services: Map<string, any> = new Map();

  constructor() {
    this.app = express();
    this.container = new Container();
  }

  /**
   * Initialize the server with all components
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing SmartFix Server with @decorators/server...');

    try {
      // Connect to database
      await this.connectDatabase();

      // Setup middleware
      this.setupMiddleware();

      // Initialize services
      await this.initializeServices();

      // Setup controllers
      this.setupControllers();

      // Setup error handling
      this.setupErrorHandling();

      console.log('✅ SmartFix Server initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize server:', error);
      throw error;
    }
  }

  /**
   * Connect to database
   */
  private async connectDatabase(): Promise<void> {
    try {
      await connectDB();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    console.log('🔧 Setting up middleware...');

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    console.log('✅ Middleware setup completed');
  }

  /**
   * Initialize decorator-based services with dependency injection
   */
  private async initializeServices(): Promise<void> {
    console.log('🔧 Initializing decorator-based services...');

    try {
      // Register services in the DI container
      this.container.provide([
        { provide: 'AuthService', useClass: AuthService },
        { provide: 'UserService', useClass: UserService },
        { provide: 'ProviderService', useClass: ProviderService }
      ]);

      // Get service instances and execute post-construct methods
      const authService = await this.container.get('AuthService');
      const userService = await this.container.get('UserService');
      const providerService = await this.container.get('ProviderService');

      // Store service references
      this.services.set('AuthService', authService);
      this.services.set('UserService', userService);
      this.services.set('ProviderService', providerService);

      // Execute post-construct lifecycle methods
      await ServiceUtils.executePostConstruct(authService);
      await ServiceUtils.executePostConstruct(userService);
      await ServiceUtils.executePostConstruct(providerService);

      console.log('✅ Services initialized successfully');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup decorator-based controllers
   */
  private setupControllers(): void {
    console.log('🔧 Setting up decorator-based controllers...');

    try {
      // Register controllers in the DI container
      this.container.provide([
        { provide: 'AuthController', useClass: AuthController },
        { provide: 'UserController', useClass: UserController },
        { provide: 'ProviderController', useClass: ProviderController }
      ]);

      // Attach controllers to Express app
      attachControllers(this.app, [
        AuthController,
        UserController,
        ProviderController
      ]);

      console.log('✅ Controllers setup completed');
    } catch (error) {
      console.error('❌ Controller setup failed:', error);
      throw error;
    }
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    console.log('🔧 Setting up error handling...');

    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: 'connected',
          container: 'initialized',
          decorators: 'enabled',
          server: 'enhanced'
        },
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API documentation endpoint
    this.app.get('/api', (_req, res) => {
      res.json({
        name: 'SmartFix Service Providers API',
        version: '2.0.0',
        description: 'Enhanced decorator-based API with @decorators/server',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          providers: '/api/providers'
        },
        features: [
          'Decorator-based routing',
          'Dependency injection',
          'Service lifecycle management',
          'Advanced caching',
          'Retry logic',
          'Comprehensive logging',
          'Input validation'
        ]
      });
    });

    // 404 handler
    this.app.use('*', (_req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        availableEndpoints: ['/api/auth', '/api/users', '/api/providers', '/health']
      });
    });

    // Global error handler
    this.app.use(errorHandler);

    console.log('✅ Error handling setup completed');
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(port, host, () => {
          console.log(`🚀 SmartFix Server running on http://${host}:${port}`);
          console.log(`📚 API Documentation: http://${host}:${port}/api`);
          console.log(`❤️  Health Check: http://${host}:${port}/health`);
          console.log('🎯 Features enabled:');
          console.log('  - Decorator-based routing');
          console.log('  - Dependency injection');
          console.log('  - Service lifecycle management');
          console.log('  - Advanced caching');
          console.log('  - Retry logic');
          console.log('  - Comprehensive logging');
          resolve();
        });

        // Graceful shutdown handling
        process.on('SIGTERM', () => this.shutdown(server));
        process.on('SIGINT', () => this.shutdown(server));

      } catch (error) {
        console.error('❌ Failed to start server:', error);
        reject(error);
      }
    });
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(server: any): Promise<void> {
    console.log('🔄 Graceful shutdown initiated...');

    try {
      // Execute pre-destroy lifecycle methods for services
      for (const [name, service] of this.services) {
        console.log(`🧹 Cleaning up ${name}...`);
        await ServiceUtils.executePreDestroy(service);
      }

      // Close server
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });

      // Force close after timeout
      setTimeout(() => {
        console.log('⚠️  Forcing server shutdown...');
        process.exit(1);
      }, 10000);

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get service instance
   */
  getService<T>(serviceName: string): T {
    return this.services.get(serviceName);
  }
}

// Create and export server instance
const server = new SmartFixServer();

// Initialize and start server if this file is run directly
if (require.main === module) {
  server.initialize()
    .then(() => server.start())
    .catch((error) => {
      console.error('❌ Failed to start SmartFix Server:', error);
      process.exit(1);
    });
}

export { server as app };
export default server;

