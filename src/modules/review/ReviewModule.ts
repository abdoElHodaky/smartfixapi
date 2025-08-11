/**
 * ReviewModule - Review and Rating Management Module
 * 
 * This module encapsulates all review and rating-related functionality including
 * services, controllers, and their dependencies.
 */

import 'reflect-metadata';
import { Module } from '../../decorators/module';

// Import modules
import { AuthModule } from '../auth/AuthModule';
import { UserModule } from '../user/UserModule';
import { ProviderModule } from '../provider/ProviderModule';
import { ServiceRequestModule } from '../request/ServiceRequestModule';

// Import services
import { ReviewService } from '../../services/review/ReviewService.decorator';

// Import controllers
import { ReviewController } from '../../controllers/review/ReviewController.modern';

@Module({
  imports: [
    AuthModule,           // Import AuthModule for authentication
    UserModule,           // Import UserModule for user management
    ProviderModule,       // Import ProviderModule for provider management
    ServiceRequestModule  // Import ServiceRequestModule for service request validation
  ],
  providers: [
    ReviewService
  ],
  controllers: [
    ReviewController
  ],
  exports: [
    ReviewService
  ]
})
export class ReviewModule {
  constructor() {
    console.log('⭐ ReviewModule created');
  }

  /**
   * Module initialization hook
   */
  async onModuleInit(): Promise<void> {
    console.log('⭐ ReviewModule initialized');
  }

  /**
   * Module destruction hook
   */
  async onModuleDestroy(): Promise<void> {
    console.log('⭐ ReviewModule destroyed');
  }

  /**
   * Get module information
   */
  getModuleInfo() {
    return {
      name: 'ReviewModule',
      version: '1.0.0',
      description: 'Review and rating management module',
      dependencies: ['AuthModule', 'UserModule', 'ProviderModule', 'ServiceRequestModule'],
      services: ['ReviewService'],
      controllers: ['ReviewController']
      features: [
        'Review creation and management',
        'Rating system (1-5 stars)',
        'Review validation and moderation',
        'Provider rating aggregation',
        'Review search and filtering',
        'Review statistics and analytics',
        'Top-rated provider discovery',
        'Review flagging and moderation',
        'Review response management'
      ]
    };
  }
}
