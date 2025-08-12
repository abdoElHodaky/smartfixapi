/**
 * Modular SmartFix Server
 * 
 * This is the main server implementation using the modular architecture
 * with decorator-based services and dependency injection.
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectDB } from '../config/database';
import { errorHandler } from '../middleware/errorHandler';
import { AppModule } from './AppModule';
import { moduleManager } from '../decorators/module';
import { createDevPerformanceMiddleware, createPerformanceDashboardMiddleware } from '../middleware/performance.middleware';

export class ModularSmartFixServer {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.initializeMiddleware();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    // Performance middleware
    this.app.use(compression());
    
    // Development performance monitoring (only in development)
    if (process.env.NODE_ENV !== 'production') {
      this.app.use(createDevPerformanceMiddleware({
        enableInProduction: false,
        trackPayloadSizes: true,
        trackHeaders: false,
        slowRequestThreshold: 1000,
        logSlowRequests: true,
        excludePaths: ['/health', '/dev/performance', '/favicon.ico']
      }));
      
      // Development performance dashboard
      this.app.use(createPerformanceDashboardMiddleware());
      console.log('📊 Development performance monitoring enabled');
      console.log('🔍 Performance dashboard available at /dev/performance');
    }

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      });
    });
  }

  private async initializeModules(): Promise<void> {
    try {
      // Initialize the main app module
      await moduleManager.initializeModule(AppModule);
      
      // Register module routes with the Express app
      const moduleRoutes = moduleManager.getModuleRoutes();
      this.app.use('/api', moduleRoutes);

      console.log('✅ All modules initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize modules:', error);
      throw error;
    }
  }

  private initializeErrorHandling(): void {
    // Global error handler (must be last)
    this.app.use(errorHandler);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDB();
      console.log('✅ Database connected successfully');

      // Initialize modules
      await this.initializeModules();

      // Initialize error handling
      this.initializeErrorHandling();

      // Start server
      this.app.listen(this.port, () => {
        console.log(`🚀 SmartFix API Server running on port ${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`🔗 API Base URL: http://localhost:${this.port}/api`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}
