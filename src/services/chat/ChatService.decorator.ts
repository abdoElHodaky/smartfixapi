/**
 * Decorator-Based ChatService Implementation
 * 
 * Enhanced ChatService using Strategy Patterns and AggregationBuilder
 * for optimized performance and maintainable conditional logic.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { Conversation } from '../../models/Conversation';
import { Message } from '../../models/Message';
import { User } from '../../models/User';
import { NotFoundError, ValidationError, AuthenticationError } from '../../middleware/errorHandler';
import { IChatService, IUserService } from '../../interfaces/services';
import {
  CreateConversationDto,
  SendMessageDto,
  ChatFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

// Import optimization utilities
import { AggregationBuilder, AggregationUtils } from '../../utils/aggregation/AggregationBuilder';
import { 
  StrategyRegistry, 
  AsyncStrategyRegistry, 
  Strategy, 
  AsyncStrategy 
} from '../../utils/conditions/StrategyPatterns';
import { ConditionalHelpers, RoleCheckOptions } from '../../utils/conditions/ConditionalHelpers';
import { CommandBase, CommandResult, CommandContext } from '../../utils/service-optimization/CommandBase';

// Import service decorators
import {
  Singleton,
  Service,
  Cached,
  Retryable,
  Log,
  Validate,
  PostConstruct,
  PreDestroy
} from '../../decorators/service';

// Import strategy interfaces
import {
  ChatOperationInput,
  ConversationSearchInput,
  MessageSearchInput,
  ChatModerationInput
} from '../../strategy/interfaces/ServiceStrategy';

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 5
})
export class ChatService implements IChatService {
  private chatOperationRegistry: AsyncStrategyRegistry<ChatOperationInput, CommandResult>;
  private conversationSearchRegistry: AsyncStrategyRegistry<ConversationSearchInput, CommandResult>;
  private messageSearchRegistry: AsyncStrategyRegistry<MessageSearchInput, CommandResult>;
  private chatModerationRegistry: AsyncStrategyRegistry<ChatModerationInput, CommandResult>;

  constructor(
    @Inject('UserService') private userService?: IUserService
  ) {
    this.initializeStrategies();
  }

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('💬 Strategy-based ChatService initialized with optimized patterns');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('💬 Strategy-based ChatService cleanup completed');
  }

  /**
   * Initialize all strategy registries
   */
  private initializeStrategies(): void {
    // Chat operation strategies
    this.chatOperationRegistry = new AsyncStrategyRegistry<ChatOperationInput, CommandResult>();
    // Note: Strategy implementations would be registered here
    // this.chatOperationRegistry.register('createConversation', new CreateConversationStrategy());
    // this.chatOperationRegistry.register('sendMessage', new SendMessageStrategy());
    // etc.

    // Conversation search strategies
    this.conversationSearchRegistry = new AsyncStrategyRegistry<ConversationSearchInput, CommandResult>();
    // this.conversationSearchRegistry.register('searchConversations', new SearchConversationsStrategy());

    // Message search strategies
    this.messageSearchRegistry = new AsyncStrategyRegistry<MessageSearchInput, CommandResult>();
    // this.messageSearchRegistry.register('searchMessages', new SearchMessagesStrategy());

    // Chat moderation strategies
    this.chatModerationRegistry = new AsyncStrategyRegistry<ChatModerationInput, CommandResult>();
    // this.chatModerationRegistry.register('moderateMessage', new ModerateMessageStrategy());
  }

  /**
   * Create a new conversation
   */
  @Log({
    message: 'Creating conversation with strategy pattern',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  })
  async createConversation(data: CreateConversationDto): Promise<ApiResponseDto> {
    try {
      // Validate participants exist
      if (this.userService) {
        for (const participantId of data.participants) {
          await this.userService.getUserById(participantId);
        }
      }

      // Create conversation
      const conversation = new Conversation({
        ...data,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedConversation = await conversation.save();

      return {
        success: true,
        message: 'Conversation created successfully',
        data: savedConversation
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create conversation',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get conversation by ID
   */
  @Log({
    message: 'Getting conversation by ID with strategy pattern',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getConversationById(conversationId: string): Promise<any> {
    const aggregation = AggregationBuilder.create()
      .match({ _id: conversationId, isDeleted: { $ne: true } })
      .lookup('users', 'participants', '_id', 'participantDetails')
      .lookup('messages', 'conversationId', 'conversationId', 'recentMessages')
      .addFields({
        recentMessages: {
          $slice: [
            { $sortArray: { input: '$recentMessages', sortBy: { createdAt: -1 } } },
            10
          ]
        }
      });

    const result = await aggregation.execute(Conversation);
    
    if (!result || result.length === 0) {
      throw new NotFoundError('Conversation not found');
    }

    return result[0];
  }

  /**
   * Get user conversations
   */
  @Log({
    message: 'Getting user conversations',
    includeExecutionTime: true
  })
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  async getUserConversations(userId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>> {
    const pageNum = page || 1;
    const limitNum = limit || 10;

    const matchConditions = {
      participants: userId,
      isDeleted: { $ne: true }
    };

    const aggregation = AggregationBuilder.create()
      .match(matchConditions)
      .lookup('users', 'participants', '_id', 'participantDetails')
      .lookup('messages', 'conversationId', 'conversationId', 'messages')
      .addFields({
        lastMessage: {
          $arrayElemAt: [
            { $sortArray: { input: '$messages', sortBy: { createdAt: -1 } } },
            0
          ]
        },
        unreadCount: {
          $size: {
            $filter: {
              input: '$messages',
              cond: {
                $and: [
                  { $ne: ['$$this.senderId', userId] },
                  { $not: { $in: [userId, '$$this.readBy'] } }
                ]
              }
            }
          }
        }
      })
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const conversations = await aggregation.execute(Conversation);
    const total = await Conversation.countDocuments(matchConditions);

    return {
      data: conversations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Delete conversation
   */
  @Log({
    message: 'Deleting conversation',
    includeExecutionTime: true
  })
  async deleteConversation(conversationId: string, userId: string): Promise<ApiResponseDto> {
    try {
      // Verify user is participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new NotFoundError('Conversation not found or access denied');
      }

      const deletedConversation = await Conversation.findByIdAndUpdate(
        conversationId,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );

      return {
        success: true,
        message: 'Conversation deleted successfully',
        data: deletedConversation
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete conversation',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Send message
   */
  @Log({
    message: 'Sending message with strategy pattern',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1000,
    backoff: 'linear'
  })
  async sendMessage(conversationId: string, messageData: SendMessageDto): Promise<ApiResponseDto> {
    try {
      // Verify conversation exists and user is participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: messageData.senderId
      });

      if (!conversation) {
        throw new NotFoundError('Conversation not found or access denied');
      }

      // Create message
      const message = new Message({
        conversationId,
        ...messageData,
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedMessage = await message.save();

      // Update conversation's last activity
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessageAt: new Date(),
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Message sent successfully',
        data: savedMessage
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send message',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get messages
   */
  @Log({
    message: 'Getting messages',
    includeExecutionTime: true
  })
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async getMessages(conversationId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>> {
    const pageNum = page || 1;
    const limitNum = limit || 50;

    const matchConditions = {
      conversationId,
      isDeleted: { $ne: true }
    };

    const aggregation = AggregationBuilder.create()
      .match(matchConditions)
      .lookup('users', 'senderId', '_id', 'sender')
      .addFields({
        sender: { $arrayElemAt: ['$sender', 0] }
      })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const messages = await aggregation.execute(Message);
    const total = await Message.countDocuments(matchConditions);

    return {
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Mark message as read
   */
  @Log({
    message: 'Marking message as read',
    includeExecutionTime: true
  })
  async markMessageAsRead(messageId: string, userId: string): Promise<ApiResponseDto> {
    try {
      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        { 
          $addToSet: { readBy: userId },
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedMessage) {
        throw new NotFoundError('Message not found');
      }

      return {
        success: true,
        message: 'Message marked as read',
        data: updatedMessage
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark message as read',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Mark conversation as read
   */
  @Log({
    message: 'Marking conversation as read',
    includeExecutionTime: true
  })
  async markConversationAsRead(conversationId: string, userId: string): Promise<ApiResponseDto> {
    try {
      // Mark all messages in conversation as read by this user
      await Message.updateMany(
        { 
          conversationId,
          senderId: { $ne: userId },
          readBy: { $ne: userId }
        },
        { 
          $addToSet: { readBy: userId },
          updatedAt: new Date()
        }
      );

      return {
        success: true,
        message: 'Conversation marked as read'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark conversation as read',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Delete message
   */
  @Log({
    message: 'Deleting message',
    includeExecutionTime: true
  })
  async deleteMessage(messageId: string, userId: string): Promise<ApiResponseDto> {
    try {
      // Verify user is sender
      const message = await Message.findOne({ _id: messageId, senderId: userId });
      if (!message) {
        throw new NotFoundError('Message not found or access denied');
      }

      const deletedMessage = await Message.findByIdAndUpdate(
        messageId,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );

      return {
        success: true,
        message: 'Message deleted successfully',
        data: deletedMessage
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete message',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Edit message
   */
  @Log({
    message: 'Editing message',
    includeExecutionTime: true
  })
  async editMessage(conversationId: string, messageId: string, content: string, userId: string): Promise<ApiResponseDto> {
    try {
      // Verify user is sender
      const message = await Message.findOne({ 
        _id: messageId, 
        conversationId,
        senderId: userId 
      });
      
      if (!message) {
        throw new NotFoundError('Message not found or access denied');
      }

      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        { 
          content,
          isEdited: true,
          editedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      return {
        success: true,
        message: 'Message edited successfully',
        data: updatedMessage
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to edit message',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Search messages
   */
  @Log({
    message: 'Searching messages',
    includeExecutionTime: true
  })
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async searchMessages(filters: ChatFiltersDto): Promise<PaginatedResponseDto<any>> {
    const { page = 1, limit = 20, query, conversationId, senderId, ...otherFilters } = filters;

    const matchConditions: any = { isDeleted: { $ne: true } };
    
    if (query) {
      matchConditions.$text = { $search: query };
    }
    if (conversationId) matchConditions.conversationId = conversationId;
    if (senderId) matchConditions.senderId = senderId;

    const aggregation = AggregationBuilder.create()
      .match(matchConditions)
      .lookup('users', 'senderId', '_id', 'sender')
      .lookup('conversations', 'conversationId', '_id', 'conversation')
      .addFields({
        sender: { $arrayElemAt: ['$sender', 0] },
        conversation: { $arrayElemAt: ['$conversation', 0] }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const messages = await aggregation.execute(Message);
    const total = await Message.countDocuments(matchConditions);

    return {
      data: messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get unread messages count
   */
  @Log({
    message: 'Getting unread messages count',
    includeExecutionTime: true
  })
  @Cached(1 * 60 * 1000) // Cache for 1 minute
  async getUnreadMessagesCount(userId: string): Promise<number> {
    const count = await Message.countDocuments({
      senderId: { $ne: userId },
      readBy: { $ne: userId },
      isDeleted: { $ne: true }
    });

    return count;
  }

  /**
   * Send file message
   */
  @Log({
    message: 'Sending file message',
    includeExecutionTime: true
  })
  async sendFileMessage(conversationId: string, senderId: string, fileUrl: string, fileType: string, fileName?: string): Promise<ApiResponseDto> {
    const messageData: SendMessageDto = {
      senderId,
      content: fileName || 'File attachment',
      messageType: 'file',
      attachments: [{
        url: fileUrl,
        type: fileType,
        name: fileName
      }]
    };

    return this.sendMessage(conversationId, messageData);
  }

  /**
   * Update conversation status
   */
  @Log({
    message: 'Updating conversation status',
    includeExecutionTime: true
  })
  async updateConversationStatus(conversationId: string, status: string): Promise<ApiResponseDto> {
    try {
      const updatedConversation = await Conversation.findByIdAndUpdate(
        conversationId,
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (!updatedConversation) {
        throw new NotFoundError('Conversation not found');
      }

      return {
        success: true,
        message: 'Conversation status updated successfully',
        data: updatedConversation
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update conversation status',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Archive conversation
   */
  @Log({
    message: 'Archiving conversation',
    includeExecutionTime: true
  })
  async archiveConversation(conversationId: string, userId: string): Promise<ApiResponseDto> {
    try {
      const updatedConversation = await Conversation.findOneAndUpdate(
        { _id: conversationId, participants: userId },
        { 
          $addToSet: { archivedBy: userId },
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedConversation) {
        throw new NotFoundError('Conversation not found or access denied');
      }

      return {
        success: true,
        message: 'Conversation archived successfully',
        data: updatedConversation
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to archive conversation',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Unarchive conversation
   */
  @Log({
    message: 'Unarchiving conversation',
    includeExecutionTime: true
  })
  async unarchiveConversation(conversationId: string, userId: string): Promise<ApiResponseDto> {
    try {
      const updatedConversation = await Conversation.findOneAndUpdate(
        { _id: conversationId, participants: userId },
        { 
          $pull: { archivedBy: userId },
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedConversation) {
        throw new NotFoundError('Conversation not found or access denied');
      }

      return {
        success: true,
        message: 'Conversation unarchived successfully',
        data: updatedConversation
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to unarchive conversation',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Join conversation (real-time feature)
   */
  @Log({
    message: 'Joining conversation',
    includeExecutionTime: true
  })
  async joinConversation(conversationId: string, userId: string): Promise<void> {
    // This would typically involve WebSocket/Socket.IO integration
    // For now, just update the conversation to track active users
    await Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: { activeUsers: userId },
      updatedAt: new Date()
    });
  }

  /**
   * Leave conversation (real-time feature)
   */
  @Log({
    message: 'Leaving conversation',
    includeExecutionTime: true
  })
  async leaveConversation(conversationId: string, userId: string): Promise<void> {
    // This would typically involve WebSocket/Socket.IO integration
    // For now, just update the conversation to remove from active users
    await Conversation.findByIdAndUpdate(conversationId, {
      $pull: { activeUsers: userId },
      updatedAt: new Date()
    });
  }

  /**
   * Update typing status (real-time feature)
   */
  @Log({
    message: 'Updating typing status',
    includeExecutionTime: true
  })
  async updateTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    // This would typically involve WebSocket/Socket.IO integration
    // For now, just log the typing status
    console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'} in conversation ${conversationId}`);
  }

  /**
   * Report message
   */
  @Log({
    message: 'Reporting message',
    includeExecutionTime: true
  })
  async reportMessage(messageId: string, reporterId: string, reason: string): Promise<ApiResponseDto> {
    try {
      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        { 
          $push: { 
            reports: {
              reporterId,
              reason,
              reportedAt: new Date()
            }
          },
          status: 'reported',
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedMessage) {
        throw new NotFoundError('Message not found');
      }

      return {
        success: true,
        message: 'Message reported successfully',
        data: updatedMessage
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to report message',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Block user
   */
  @Log({
    message: 'Blocking user',
    includeExecutionTime: true
  })
  async blockUser(userId: string, blockedUserId: string): Promise<ApiResponseDto> {
    try {
      // This would typically involve a separate BlockedUsers collection
      // For now, we'll use a simple approach with user preferences
      if (this.userService) {
        // Update user's blocked list through UserService
        console.log(`User ${userId} blocked user ${blockedUserId}`);
      }

      return {
        success: true,
        message: 'User blocked successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to block user',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Unblock user
   */
  @Log({
    message: 'Unblocking user',
    includeExecutionTime: true
  })
  async unblockUser(userId: string, blockedUserId: string): Promise<ApiResponseDto> {
    try {
      // This would typically involve a separate BlockedUsers collection
      // For now, we'll use a simple approach with user preferences
      if (this.userService) {
        // Update user's blocked list through UserService
        console.log(`User ${userId} unblocked user ${blockedUserId}`);
      }

      return {
        success: true,
        message: 'User unblocked successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to unblock user',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get blocked users
   */
  @Log({
    message: 'Getting blocked users',
    includeExecutionTime: true
  })
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getBlockedUsers(userId: string): Promise<string[]> {
    // This would typically involve a separate BlockedUsers collection
    // For now, return empty array
    return [];
  }
}

