/**
 * ServiceRequestModule - Service Request Management Module
 * 
 * This module encapsulates all service request-related functionality including
 * services, controllers, and their dependencies.
 */

import 'reflect-metadata';
import { Module } from '../../decorators/module';

// Import modules
import { AuthModule } from '../auth/AuthModule';
import { UserModule } from '../user/UserModule';
import { ProviderModule } from '../provider/ProviderModule';

// Import services
import { ServiceRequestService } from '../../services/request/ServiceRequestService.decorator';

// Import controllers
import { RequestController } from '../../controllers/request/RequestController.modern';

@Module({
  imports: [
    AuthModule,     // Import AuthModule for authentication
    UserModule,     // Import UserModule for user management
    ProviderModule  // Import ProviderModule for provider management
  ],
  providers: [
    ServiceRequestService
  ],
  controllers: [
    RequestController
  ],
  exports: [
    ServiceRequestService
  ]
})
export class ServiceRequestModule {
  constructor() {
    console.log('📋 ServiceRequestModule created');
  }

  /**
   * Module initialization hook
   */
  async onModuleInit(): Promise<void> {
    console.log('📋 ServiceRequestModule initialized');
  }

  /**
   * Module destruction hook
   */
  async onModuleDestroy(): Promise<void> {
    console.log('📋 ServiceRequestModule destroyed');
  }

  /**
   * Get module information
   */
  getModuleInfo() {
    return {
      name: 'ServiceRequestModule',
      version: '1.0.0',
      description: 'Service request management module',
      dependencies: ['AuthModule', 'UserModule', 'ProviderModule'],
      services: ['ServiceRequestService'],
      controllers: ['RequestController']
      features: [
        'Service request creation and management',
        'Request status tracking',
        'Provider assignment',
        'Request search and filtering',
        'Location-based request matching',
        'Budget and pricing management',
        'Request statistics and analytics',
        'Nearby request discovery',
        'Request lifecycle management'
      ]
    };
  }
}
