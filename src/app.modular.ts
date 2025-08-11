/**
 * Modular Application Server
 * 
 * This is the main application server that uses the module system for
 * organizing services, controllers, and dependencies with proper
 * dependency injection and lifecycle management.
 */

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { attachControllers } from '@decorators/express';

// Import database connection
import { connectDB } from './config/database';

// Import module system
import { moduleManager } from './decorators/module';

// Import main application module
import { AppModule } from './modules/AppModule';

// Import all feature modules
import { AuthModule } from './modules/auth/AuthModule';
import { UserModule } from './modules/user/UserModule';
import { ProviderModule } from './modules/provider/ProviderModule';
import { ServiceRequestModule } from './modules/request/ServiceRequestModule';
import { ReviewModule } from './modules/review/ReviewModule';
import { AdminModule } from './modules/admin/AdminModule';
import { ChatModule } from './modules/chat/ChatModule';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

/**
 * Modular SmartFix Server
 */
export class ModularSmartFixServer {
  private app: express.Application;
  private appModule: AppModule;

  constructor() {
    this.app = express();
    this.appModule = new AppModule();
  }

  /**
   * Initialize the modular server
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Modular SmartFix Server...');

    try {
      // Connect to database
      await this.connectDatabase();

      // Setup middleware
      this.setupMiddleware();

      // Register and initialize modules
      await this.initializeModules();

      // Setup controllers from modules
      this.setupControllers();

      // Setup error handling
      this.setupErrorHandling();

      console.log('✅ Modular SmartFix Server initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize modular server:', error);
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
   * Register and initialize all modules
   */
  private async initializeModules(): Promise<void> {
    console.log('🔧 Registering and initializing modules...');

    try {
      // Register all modules with the module manager
      moduleManager.registerModule(AuthModule);
      moduleManager.registerModule(UserModule);
      moduleManager.registerModule(ProviderModule);
      moduleManager.registerModule(ServiceRequestModule);
      moduleManager.registerModule(ReviewModule);
      moduleManager.registerModule(AdminModule);
      moduleManager.registerModule(ChatModule);
      moduleManager.registerModule(AppModule);

      // Initialize all modules with proper dependency resolution
      await moduleManager.initializeModules();

      // Log module status
      moduleManager.logModuleStatus();

      console.log('✅ All modules initialized successfully');
    } catch (error) {
      console.error('❌ Module initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup controllers from all modules
   */
  private setupControllers(): void {
    console.log('🔧 Setting up controllers from modules...');

    try {
      // Get all controllers from all modules
      const allControllers: any[] = [];

      // Get controllers from each module
      const modules = moduleManager.getAllModules();
      
      for (const module of modules) {
        const controllers = module.config.controllers || [];
        allControllers.push(...controllers);
      }

      if (allControllers.length > 0) {
        // Attach all controllers to Express app
        attachControllers(this.app, allControllers);
        console.log(`✅ Attached ${allControllers.length} controllers from modules`);
      } else {
        console.log('⚠️  No controllers found in modules');
      }

    } catch (error) {
      console.error('❌ Controller setup failed:', error);
      throw error;
    }
  }

  /**
   * Setup error handling and health endpoints
   */
  private setupErrorHandling(): void {
    console.log('🔧 Setting up error handling and health endpoints...');

    // Health check endpoint with module status
    this.app.get('/health', async (_req, res) => {
      try {
        const moduleHealth = await moduleManager.healthCheck();
        const appInfo = this.appModule.getApplicationInfo();
        
        res.status(200).json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          application: {
            name: appInfo.name,
            version: appInfo.version,
            architecture: appInfo.architecture
          },
          modules: moduleHealth,
          database: 'connected',
          features: appInfo.features
        });
      } catch (error) {
        res.status(500).json({
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          error: 'Health check failed'
        });
      }
    });

    // Module information endpoint
    this.app.get('/modules', (_req, res) => {
      try {
        const appInfo = this.appModule.getApplicationInfo();
        const dependencyGraph = this.appModule.getModuleDependencyGraph();
        const moduleStatus = moduleManager.getModuleStatus();

        res.json({
          application: appInfo,
          dependencyGraph,
          moduleStatus,
          totalModules: Object.keys(moduleStatus).length,
          initializedModules: Object.values(moduleStatus).filter(Boolean).length
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get module information'
        });
      }
    });

    // API documentation endpoint
    this.app.get('/api', (_req, res) => {
      const appInfo = this.appModule.getApplicationInfo();
      
      res.json({
        name: appInfo.name,
        version: appInfo.version,
        description: appInfo.description,
        architecture: 'Modular with Dependency Injection',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          providers: '/api/providers',
          health: '/health',
          modules: '/modules'
        },
        modules: appInfo.modules,
        features: appInfo.features,
        technologies: appInfo.technologies
      });
    });

    // Service discovery endpoint
    this.app.get('/services', (_req, res) => {
      try {
        const modules = moduleManager.getAllModules();
        const services: { [moduleName: string]: string[] } = {};

        for (const module of modules) {
          const providers = module.config.providers || [];
          services[module.name] = providers.map(p => 
            typeof p === 'function' ? p.name : p.provide || 'Unknown'
          );
        }

        res.json({
          message: 'Available services by module',
          services,
          totalServices: Object.values(services).flat().length
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get service information'
        });
      }
    });

    // 404 handler
    this.app.use('*', (_req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        availableEndpoints: [
          '/api/auth',
          '/api/users', 
          '/api/providers',
          '/health',
          '/modules',
          '/services'
        ]
      });
    });

    // Global error handler
    this.app.use(errorHandler);

    console.log('✅ Error handling and health endpoints setup completed');
  }

  /**
   * Start the modular server
   */
  async start(): Promise<void> {
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(port, host, () => {
          console.log('\n🎉 Modular SmartFix Server Started Successfully!');
          console.log('═'.repeat(60));
          console.log(`🌐 Server: http://${host}:${port}`);
          console.log(`📚 API Docs: http://${host}:${port}/api`);
          console.log(`❤️  Health: http://${host}:${port}/health`);
          console.log(`📦 Modules: http://${host}:${port}/modules`);
          console.log(`🔧 Services: http://${host}:${port}/services`);
          console.log('═'.repeat(60));
          console.log('🎯 Architecture Features:');
          console.log('  ✅ Modular architecture with dependency injection');
          console.log('  ✅ Decorator-based services and controllers');
          console.log('  ✅ Service lifecycle management');
          console.log('  ✅ Advanced caching and retry logic');
          console.log('  ✅ Comprehensive logging and monitoring');
          console.log('  ✅ Health checking and graceful shutdown');
          console.log('═'.repeat(60));
          resolve();
        });

        // Graceful shutdown handling
        process.on('SIGTERM', () => this.shutdown(server));
        process.on('SIGINT', () => this.shutdown(server));

      } catch (error) {
        console.error('❌ Failed to start modular server:', error);
        reject(error);
      }
    });
  }

  /**
   * Graceful shutdown with module cleanup
   */
  private async shutdown(server: any): Promise<void> {
    console.log('\n🔄 Graceful shutdown initiated...');

    try {
      // Shutdown all modules gracefully
      await moduleManager.shutdownModules();

      // Close server
      server.close(() => {
        console.log('✅ Modular server closed successfully');
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
   * Get service from any module
   */
  getService<T>(serviceName: string, moduleName?: string): T {
    return moduleManager.getService<T>(serviceName, moduleName);
  }

  /**
   * Get module manager
   */
  getModuleManager() {
    return moduleManager;
  }
}

// Create and export modular server instance
const modularServer = new ModularSmartFixServer();

// Initialize and start server if this file is run directly
if (require.main === module) {
  modularServer.initialize()
    .then(() => modularServer.start())
    .catch((error) => {
      console.error('❌ Failed to start Modular SmartFix Server:', error);
      process.exit(1);
    });
}

export { modularServer as app };
export default modularServer;

