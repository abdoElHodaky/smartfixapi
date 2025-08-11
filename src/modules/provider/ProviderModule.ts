/**
 * ProviderModule - Service Provider Module
 * 
 * This module encapsulates all service provider-related functionality including
 * services, controllers, and their dependencies.
 */

import 'reflect-metadata';
import { Module } from '../../decorators/module';

// Import modules
import { AuthModule } from '../auth/AuthModule';
import { UserModule } from '../user/UserModule';

// Import services
import { ProviderService } from '../../services/provider/ProviderService.decorator';

// Import controllers
import { ProviderController } from '../../controllers/provider/ProviderController.decorator';

@Module({
  imports: [
    AuthModule, // Import AuthModule for authentication
    UserModule  // Import UserModule for user management
  ],
  providers: [
    ProviderService
  ],
  controllers: [
    ProviderController
  ],
  exports: [
    ProviderService
  ]
})
export class ProviderModule {
  constructor() {
    console.log('🔧 ProviderModule created');
  }

  /**
   * Module initialization hook
   */
  async onModuleInit(): Promise<void> {
    console.log('🔧 ProviderModule initialized');
  }

  /**
   * Module destruction hook
   */
  async onModuleDestroy(): Promise<void> {
    console.log('🔧 ProviderModule destroyed');
  }

  /**
   * Get module information
   */
  getModuleInfo() {
    return {
      name: 'ProviderModule',
      version: '1.0.0',
      description: 'Service provider management module',
      dependencies: ['AuthModule', 'UserModule'],
      services: ['ProviderService'],
      controllers: ['ProviderController'],
      features: [
        'Provider profile management',
        'Service offerings management',
        'Portfolio management',
        'Availability scheduling',
        'Location and service area management',
        'Provider search and filtering',
        'Rating and review management',
        'Service request handling',
        'Provider dashboard and statistics'
      ]
    };
  }
}

