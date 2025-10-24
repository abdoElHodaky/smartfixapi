/**
 * AuthModule - Authentication Module
 * 
 * This module encapsulates all authentication-related functionality including
 * services, controllers, and their dependencies.
 */

import 'reflect-metadata';
import { Module } from '../../../decorators/module';

// Import services
import { AuthService } from '../services/AuthService';

// Import controllers
import { AuthController } from '../controllers/AuthController';

@Module({
  providers: [
    AuthService
  ],
  controllers: [
    AuthController
  ],
  exports: [
    AuthService
  ],
  global: true // Make AuthService globally available
})
export class AuthModule {
  constructor() {
    console.log('🔐 AuthModule created');
  }

  /**
   * Module initialization hook
   */
  async onModuleInit(): Promise<void> {
    console.log('🔐 AuthModule initialized');
  }

  /**
   * Module destruction hook
   */
  async onModuleDestroy(): Promise<void> {
    console.log('🔐 AuthModule destroyed');
  }

  /**
   * Get module information
   */
  getModuleInfo() {
    return {
      name: 'AuthModule',
      version: '1.0.0',
      description: 'Authentication and authorization module',
      services: ['AuthService'],
      controllers: ['AuthController'],
      features: [
        'User registration and login',
        'JWT token management',
        'Password hashing and validation',
        'Service provider registration',
        'Token refresh and verification',
        'Email verification',
        'Password reset functionality'
      ]
    };
  }
}
