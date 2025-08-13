/**
 * AppModule - Main Application Module
 * 
 * This is the root module that imports and orchestrates all other modules
 * in the SmartFix Service Providers application.
 */

import 'reflect-metadata';
import { Module } from '../decorators/module';

// Import all feature modules
import { AuthModule } from './auth/AuthModule';
import { UserModule } from './user/UserModule';
import { ProviderModule } from './provider/ProviderModule';
import { ServiceRequestModule } from './request/ServiceRequestModule';
import { ReviewModule } from './review/ReviewModule';
import { AdminModule } from './admin/AdminModule';
import { ChatModule } from './chat/ChatModule';

@Module({
  imports: [
    AuthModule,           // Authentication and authorization
    UserModule,           // User management
    ProviderModule,       // Service provider management
    ServiceRequestModule, // Service request management
    ReviewModule,         // Review and rating system
    AdminModule,          // Administrative functions
    ChatModule,            // Chat and messaging
  ],
  providers: [
    // Global providers can be added here
  ],
  controllers: [
    // Global controllers can be added here
  ],
  exports: [
    // Services to export globally
  ],
})
export class AppModule {
  constructor() {
    console.log('🚀 AppModule created - SmartFix Service Providers Platform');
  }

  /**
   * Application initialization hook
   */
  async onModuleInit(): Promise<void> {
    console.log('🚀 AppModule initialized - All modules loaded successfully');
    this.logApplicationInfo();
  }

  /**
   * Application destruction hook
   */
  async onModuleDestroy(): Promise<void> {
    console.log('🚀 AppModule destroyed - Application shutdown complete');
  }

  /**
   * Log application information
   */
  private logApplicationInfo(): void {
    console.log('\n🎯 SmartFix Service Providers Platform');
    console.log('═'.repeat(60));
    console.log('📦 Modules Loaded:');
    console.log('  🔐 AuthModule - Authentication & Authorization');
    console.log('  👤 UserModule - User Management');
    console.log('  🔧 ProviderModule - Service Provider Management');
    console.log('  📋 ServiceRequestModule - Service Request Management');
    console.log('  ⭐ ReviewModule - Review & Rating System');
    console.log('  👑 AdminModule - Administrative Functions');
    console.log('  💬 ChatModule - Chat & Messaging');
    console.log('═'.repeat(60));
    console.log('🎉 Platform ready for service!');
    console.log('');
  }

  /**
   * Get application information
   */
  getApplicationInfo() {
    return {
      name: 'SmartFix Service Providers Platform',
      version: '2.0.0',
      description: 'Modern service provider platform with decorator-based architecture',
      architecture: 'Modular with Dependency Injection',
      modules: [
        'AuthModule',
        'UserModule', 
        'ProviderModule',
        'ServiceRequestModule',
        'ReviewModule',
        'AdminModule',
        'ChatModule',
      ],
      features: [
        'Decorator-based services and controllers',
        'Modular architecture with dependency injection',
        'Comprehensive caching and retry logic',
        'Advanced logging and monitoring',
        'Service lifecycle management',
        'Health checking and graceful shutdown',
        'Real-time chat and messaging',
        'Review and rating system',
        'Administrative dashboard',
        'Location-based service matching',
      ],
      technologies: [
        'TypeScript',
        'Express.js',
        'MongoDB with Mongoose',
        '@decorators/express',
        '@decorators/di',
        '@decorators/server',
        'JWT Authentication',
        'bcryptjs for password hashing',
        'Comprehensive error handling',
      ],
    };
  }

  /**
   * Get module dependency graph
   */
  getModuleDependencyGraph() {
    return {
      AppModule: {
        imports: [
          'AuthModule',
          'UserModule',
          'ProviderModule', 
          'ServiceRequestModule',
          'ReviewModule',
          'AdminModule',
          'ChatModule',
        ],
      },
      AuthModule: {
        imports: [],
        exports: ['AuthService'],
        global: true,
      },
      UserModule: {
        imports: ['AuthModule'],
        exports: ['UserService'],
      },
      ProviderModule: {
        imports: ['AuthModule', 'UserModule'],
        exports: ['ProviderService'],
      },
      ServiceRequestModule: {
        imports: ['AuthModule', 'UserModule', 'ProviderModule'],
        exports: ['ServiceRequestService'],
      },
      ReviewModule: {
        imports: ['AuthModule', 'UserModule', 'ProviderModule', 'ServiceRequestModule'],
        exports: ['ReviewService'],
      },
      AdminModule: {
        imports: ['AuthModule', 'UserModule', 'ProviderModule', 'ServiceRequestModule', 'ReviewModule'],
        exports: ['AdminService'],
      },
      ChatModule: {
        imports: ['AuthModule', 'UserModule', 'ServiceRequestModule'],
        exports: ['ChatService'],
      },
    };
  }

  /**
   * Get health status of all modules
   */
  async getHealthStatus() {
    // This would integrate with the module manager
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      modules: {
        AuthModule: 'healthy',
        UserModule: 'healthy',
        ProviderModule: 'healthy',
        ServiceRequestModule: 'healthy',
        ReviewModule: 'healthy',
        AdminModule: 'healthy',
        ChatModule: 'healthy',
      },
    };
  }
}

