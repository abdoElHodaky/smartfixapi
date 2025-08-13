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
import { ServiceRequestServiceStrategy } from '../../services/request/ServiceRequestService.strategy';

// Import controllers (to be created)
// import { ServiceRequestController } from '../../controllers/request/ServiceRequestController';

@Module({
  imports: [
    AuthModule,     // Import AuthModule for authentication
    UserModule,     // Import UserModule for user management
    ProviderModule  // Import ProviderModule for provider management
  ],
  providers: [
    { provide: 'ServiceRequestService', useClass: ServiceRequestServiceStrategy }
  ],
  controllers: [
    // ServiceRequestController // To be added when controller is created
  ],
  exports: [
    'ServiceRequestService'
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
      controllers: [], // To be updated when controller is added
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

