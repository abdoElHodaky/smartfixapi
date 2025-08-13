/**
 * UserModule - User Management Module
 * 
 * This module encapsulates all user-related functionality including
 * services, controllers, and their dependencies.
 */

import 'reflect-metadata';
import { Module } from '../../decorators/module';

// Import modules
import { AuthModule } from '../auth/AuthModule';

// Import services
import { UserServiceStrategy } from '../../services/user/UserService.strategy';

// Import controllers
import { UserController } from '../../controllers/user/UserController';

@Module({
  imports: [
    AuthModule // Import AuthModule to access AuthService
  ],
  providers: [
    { provide: 'UserService', useClass: UserServiceStrategy }
  ],
  controllers: [
    UserController
  ],
  exports: [
    'UserService'
  ]
})
export class UserModule {
  constructor() {
    console.log('👤 UserModule created');
  }

  /**
   * Module initialization hook
   */
  async onModuleInit(): Promise<void> {
    console.log('👤 UserModule initialized');
  }

  /**
   * Module destruction hook
   */
  async onModuleDestroy(): Promise<void> {
    console.log('👤 UserModule destroyed');
  }

  /**
   * Get module information
   */
  getModuleInfo() {
    return {
      name: 'UserModule',
      version: '1.0.0',
      description: 'User management and profile module',
      dependencies: ['AuthModule'],
      services: ['UserService'],
      controllers: ['UserController'],
      features: [
        'User profile management',
        'Profile image upload',
        'Location management',
        'User preferences',
        'User statistics and dashboard',
        'User search and filtering',
        'Account deletion',
        'Activity logging'
      ]
    };
  }
}

