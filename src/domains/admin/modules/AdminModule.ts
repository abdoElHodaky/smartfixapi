/**
 * AdminModule - Administration and Management Module
 * 
 * This module encapsulates all administrative functionality including
 * services, controllers, and their dependencies.
 */

import 'reflect-metadata';
import { Module } from '../../decorators/module';

// Import modules
import { AuthModule } from '../auth/AuthModule';
import { UserModule } from '../user/UserModule';
import { ProviderModule } from '../provider/ProviderModule';
import { ServiceRequestModule } from '../request/ServiceRequestModule';
import { ReviewModule } from '../review/ReviewModule';

// Import services
import { AdminService } from '../services/AdminService';

// Import controllers
// AdminController import removed as it's not currently used

@Module({
  imports: [
    AuthModule,           // Import AuthModule for authentication
    UserModule,           // Import UserModule for user management
    ProviderModule,       // Import ProviderModule for provider management
    ServiceRequestModule, // Import ServiceRequestModule for request management
    ReviewModule          // Import ReviewModule for review management
  ],
  providers: [
    AdminService
  ],
  controllers: [
    // AdminController // To be added when controller is created
  ],
  exports: [
    AdminService
  ]
})
export class AdminModule {
  constructor() {
    console.log('👑 AdminModule created');
  }

  /**
   * Module initialization hook
   */
  async onModuleInit(): Promise<void> {
    console.log('👑 AdminModule initialized');
  }

  /**
   * Module destruction hook
   */
  async onModuleDestroy(): Promise<void> {
    console.log('👑 AdminModule destroyed');
  }

  /**
   * Get module information
   */
  getModuleInfo() {
    return {
      name: 'AdminModule',
      version: '1.0.0',
      description: 'Administrative management module',
      dependencies: ['AuthModule', 'UserModule', 'ProviderModule', 'ServiceRequestModule', 'ReviewModule'],
      services: ['AdminService'],
      controllers: [], // To be updated when controller is added
      features: [
        'Admin dashboard and analytics',
        'User management and moderation',
        'Provider approval and management',
        'Platform statistics and reporting',
        'Content moderation',
        'System health monitoring',
        'Revenue tracking and analytics',
        'Flagged content management',
        'Administrative reporting'
      ]
    };
  }
}
