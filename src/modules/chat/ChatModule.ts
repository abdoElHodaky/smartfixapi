/**
 * ChatModule - Chat and Messaging Module
 * 
 * This module encapsulates all chat and messaging-related functionality including
 * services, controllers, and their dependencies.
 */

import 'reflect-metadata';
import { Module } from '../../decorators/module';

// Import modules
import { AuthModule } from '../auth/AuthModule';
import { UserModule } from '../user/UserModule';
import { ServiceRequestModule } from '../request/ServiceRequestModule';

// Import services
import { ChatService } from '../../services/chat/ChatService.decorator';

// Import controllers
import { ChatController } from '../../controllers/chat/ChatController.modern';

@Module({
  imports: [
    AuthModule,           // Import AuthModule for authentication
    UserModule,           // Import UserModule for user management
    ServiceRequestModule  // Import ServiceRequestModule for service request context
  ],
  providers: [
    ChatService
  ],
  controllers: [
    ChatController
  ],
  exports: [
    ChatService
  ]
})
export class ChatModule {
  constructor() {
    console.log('💬 ChatModule created');
  }

  /**
   * Module initialization hook
   */
  async onModuleInit(): Promise<void> {
    console.log('💬 ChatModule initialized');
  }

  /**
   * Module destruction hook
   */
  async onModuleDestroy(): Promise<void> {
    console.log('💬 ChatModule destroyed');
  }

  /**
   * Get module information
   */
  getModuleInfo() {
    return {
      name: 'ChatModule',
      version: '1.0.0',
      description: 'Chat and messaging module',
      dependencies: ['AuthModule', 'UserModule', 'ServiceRequestModule'],
      services: ['ChatService'],
      controllers: ['ChatController']
      features: [
        'Real-time chat functionality',
        'Message delivery and read receipts',
        'File and media attachments',
        'Group chat management',
        'Chat participant management',
        'Message search and filtering',
        'Chat statistics and analytics',
        'Online presence indicators',
        'Chat moderation and management'
      ]
    };
  }
}
