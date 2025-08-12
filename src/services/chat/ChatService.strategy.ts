/**
 * Strategy-Based ChatService Implementation
 * 
 * Enhanced ChatService using Strategy Patterns for chat operations
 * with optimized performance and maintainable conditional logic.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { Conversation } from '../../models/Conversation';
import { Message } from '../../models/Message';
import { User } from '../../models/User';
import { ValidationError, AuthenticationError, NotFoundError } from '../../middleware/errorHandler';
import { IChatService, IUserService } from '../../interfaces/services';
import {
  CreateConversationDto,
  SendMessageDto,
  ChatFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

// Import optimization utilities
import { 
  AsyncStrategyRegistry
} from '../../utils/conditions/StrategyPatterns';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';

// Import strategy interfaces
import {
  ChatOperationInput,
  ConversationSearchInput,
  MessageSearchInput
} from '../../strategy/interfaces/ServiceStrategy';

// Import service decorators
import {
  Singleton,
  Service,
  Cached,
  Retryable,
  Log,
  PostConstruct,
  PreDestroy
} from '../../decorators/service';

@Injectable()
@Singleton()
@Service({
  name: 'ChatService',
  lazy: false,
  priority: 8
})
export class ChatServiceStrategy implements IChatService {
  private conversationActionRegistry: AsyncStrategyRegistry<ChatOperationInput, any>;
  private messageActionRegistry: AsyncStrategyRegistry<ChatOperationInput, any>;
  private searchRegistry: AsyncStrategyRegistry<ConversationSearchInput | MessageSearchInput, any>;

  constructor(
    @Inject('UserService') private userService: IUserService
  ) {
    this.initializeStrategies();
  }

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('🚀 Strategy-based ChatService initialized with optimized patterns');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('🚀 Strategy-based ChatService cleanup completed');
  }

  /**
   * Initialize all strategy registries
   */
  private initializeStrategies(): void {
    // Conversation action strategies
    this.conversationActionRegistry = new AsyncStrategyRegistry<ChatOperationInput, any>();
    
    // Message action strategies
    this.messageActionRegistry = new AsyncStrategyRegistry<ChatOperationInput, any>();
    
    // Search strategies
    this.searchRegistry = new AsyncStrategyRegistry<ConversationSearchInput | MessageSearchInput, any>();
  }

  /**
   * Verify user permissions for chat operations
   */
  private async verifyUserPermissions(userId: string, conversationId?: string): Promise<void> {
    const user = await this.userService.getUserById(userId);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('User account is inactive');
    }

    // If conversation is specified, verify user has access
    if (conversationId) {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found');
      }

      const hasAccess = conversation.participants.some(p => p.toString() === userId);
      if (!hasAccess) {
        throw new AuthenticationError('Access denied to conversation');
      }
    }
  }

  /**
   * Create a new conversation
   */
  @Log({
    message: 'Creating new conversation',
    includeExecutionTime: true
  })
  async createConversation(data: CreateConversationDto): Promise<ApiResponseDto> {
    try {
      await this.verifyUserPermissions(data.createdBy);

      // Validate participants exist
      const participants = await User.find({ 
        _id: { $in: data.participants },
        isActive: true 
      });

      if (participants.length !== data.participants.length) {
        throw new ValidationError('One or more participants not found or inactive');
      }

      const conversation = new Conversation({
        participants: data.participants,
        type: data.type || 'private',
        title: data.title,
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await conversation.save();

      return {
        success: true,
        message: 'Conversation created successfully',
        data: conversation
      };
    } catch (error: any) {
      throw new ValidationError(`Failed to create conversation: ${error.message}`);
    }
  }

  /**
   * Get conversation by ID
   */
  @Cached(5 * 60 * 1000) // Cache for 5 minutes
  async getConversationById(conversationId: string): Promise<any> {
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'firstName lastName email profilePicture')
      .populate('lastMessage')
      .lean();

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    return conversation;
  }

  /**
   * Get user conversations with pagination
   */
  async getUserConversations(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    await this.verifyUserPermissions(userId);

    const query = { participants: userId };
    
    const [conversations, totalCount] = await Promise.all([
      Conversation.find(query)
        .populate('participants', 'firstName lastName email profilePicture')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: conversations,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
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
    await this.verifyUserPermissions(userId, conversationId);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Only creator or admin can delete conversation
    if (conversation.createdBy.toString() !== userId) {
      const user = await this.userService.getUserById(userId);
      if (user.role !== 'admin') {
        throw new AuthenticationError('Only conversation creator or admin can delete conversation');
      }
    }

    // Delete all messages in conversation
    await Message.deleteMany({ conversationId });
    
    // Delete conversation
    await Conversation.findByIdAndDelete(conversationId);

    return {
      success: true,
      message: 'Conversation deleted successfully',
      data: null
    };
  }

  /**
   * Send message to conversation
   */
  @Log({
    message: 'Sending message',
    includeExecutionTime: true
  })
  async sendMessage(conversationId: string, messageData: SendMessageDto): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(messageData.senderId, conversationId);

    const message = new Message({
      conversationId,
      senderId: messageData.senderId,
      content: messageData.content,
      messageType: messageData.messageType || 'text',
      fileUrl: messageData.fileUrl,
      fileName: messageData.fileName,
      createdAt: new Date()
    });

    await message.save();

    // Update conversation's last message and timestamp
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date()
    });

    return {
      success: true,
      message: 'Message sent successfully',
      data: message
    };
  }

  /**
   * Get messages with pagination
   */
  async getMessages(
    conversationId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedResponseDto<any>> {
    const query = { conversationId };
    
    const [messages, totalCount] = await Promise.all([
      Message.find(query)
        .populate('senderId', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Message.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<ApiResponseDto> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    await this.verifyUserPermissions(userId, message.conversationId.toString());

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      message.readAt = new Date();
      await message.save();
    }

    return {
      success: true,
      message: 'Message marked as read',
      data: null
    };
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(userId, conversationId);

    await Message.updateMany(
      { 
        conversationId,
        senderId: { $ne: userId },
        readBy: { $nin: [userId] }
      },
      { 
        $push: { readBy: userId },
        readAt: new Date()
      }
    );

    return {
      success: true,
      message: 'Conversation marked as read',
      data: null
    };
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string, userId: string): Promise<ApiResponseDto> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    await this.verifyUserPermissions(userId, message.conversationId.toString());

    // Only sender or admin can delete message
    if (message.senderId.toString() !== userId) {
      const user = await this.userService.getUserById(userId);
      if (user.role !== 'admin') {
        throw new AuthenticationError('Only message sender or admin can delete message');
      }
    }

    await Message.findByIdAndDelete(messageId);

    return {
      success: true,
      message: 'Message deleted successfully',
      data: null
    };
  }

  /**
   * Edit message
   */
  async editMessage(
    conversationId: string, 
    messageId: string, 
    content: string, 
    userId: string
  ): Promise<ApiResponseDto> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    await this.verifyUserPermissions(userId, conversationId);

    // Only sender can edit message
    if (message.senderId.toString() !== userId) {
      throw new AuthenticationError('Only message sender can edit message');
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    return {
      success: true,
      message: 'Message updated successfully',
      data: message
    };
  }

  /**
   * Search messages
   */
  async searchMessages(filters: ChatFiltersDto): Promise<PaginatedResponseDto<any>> {
    // TODO: Implement message search with filters
    const query: any = {};

    if (filters.conversationId) {
      query.conversationId = filters.conversationId;
    }

    if (filters.senderId) {
      query.senderId = filters.senderId;
    }

    if (filters.searchTerm) {
      query.content = { $regex: filters.searchTerm, $options: 'i' };
    }

    if (filters.messageType) {
      query.messageType = filters.messageType;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const [messages, totalCount] = await Promise.all([
      Message.find(query)
        .populate('senderId', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Message.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: messages,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Get unread messages count - Optimized aggregation
   */
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  async getUnreadMessagesCount(userId: string): Promise<number> {
    await this.verifyUserPermissions(userId);

    // Single optimized aggregation pipeline to get unread count
    const result = await Conversation.aggregate([
      { $match: { participants: userId } },
      { $project: { _id: 1 } },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'conversationId',
          as: 'messages',
          pipeline: [
            {
              $match: {
                senderId: { $ne: userId },
                readBy: { $nin: [userId] }
              }
            },
            { $project: { _id: 1 } } // Only need count
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalUnreadMessages: { $sum: { $size: '$messages' } }
        }
      }
    ]);

    return result.length > 0 ? result[0].totalUnreadMessages : 0;
  }

  /**
   * Send file message
   */
  async sendFileMessage(
    conversationId: string,
    senderId: string,
    fileUrl: string,
    fileType: string,
    fileName?: string
  ): Promise<ApiResponseDto> {
    return this.sendMessage(conversationId, {
      senderId,
      content: fileName || 'File attachment',
      messageType: 'file',
      fileUrl,
      fileName
    });
  }

  /**
   * Update conversation status
   */
  async updateConversationStatus(conversationId: string, status: string): Promise<ApiResponseDto> {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    return {
      success: true,
      message: 'Conversation status updated successfully',
      data: conversation
    };
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string, userId: string): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(userId, conversationId);

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { 
        $addToSet: { archivedBy: userId },
        updatedAt: new Date()
      },
      { new: true }
    );

    return {
      success: true,
      message: 'Conversation archived successfully',
      data: conversation
    };
  }

  /**
   * Unarchive conversation
   */
  async unarchiveConversation(conversationId: string, userId: string): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(userId, conversationId);

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { 
        $pull: { archivedBy: userId },
        updatedAt: new Date()
      },
      { new: true }
    );

    return {
      success: true,
      message: 'Conversation unarchived successfully',
      data: conversation
    };
  }

  // Real-time features (placeholder implementations)
  async joinConversation(conversationId: string, userId: string): Promise<void> {
    await this.verifyUserPermissions(userId, conversationId);
    // TODO: Implement real-time join logic
  }

  async leaveConversation(conversationId: string, userId: string): Promise<void> {
    await this.verifyUserPermissions(userId, conversationId);
    // TODO: Implement real-time leave logic
  }

  async updateTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    await this.verifyUserPermissions(userId, conversationId);
    // TODO: Implement real-time typing status logic
  }

  /**
   * Report message
   */
  async reportMessage(messageId: string, reporterId: string, reason: string): Promise<ApiResponseDto> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    await this.verifyUserPermissions(reporterId);

    // TODO: Implement message reporting logic
    // This could involve creating a report record, notifying moderators, etc.

    return {
      success: true,
      message: 'Message reported successfully',
      data: null
    };
  }

  /**
   * Block user
   */
  async blockUser(userId: string, blockedUserId: string): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(userId);

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.blockedUsers) {
      user.blockedUsers = [];
    }

    if (!user.blockedUsers.includes(blockedUserId)) {
      user.blockedUsers.push(blockedUserId);
      await user.save();
    }

    return {
      success: true,
      message: 'User blocked successfully',
      data: null
    };
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string, blockedUserId: string): Promise<ApiResponseDto> {
    await this.verifyUserPermissions(userId);

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.blockedUsers) {
      user.blockedUsers = user.blockedUsers.filter(id => id !== blockedUserId);
      await user.save();
    }

    return {
      success: true,
      message: 'User unblocked successfully',
      data: null
    };
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userId: string): Promise<string[]> {
    await this.verifyUserPermissions(userId);

    const user = await User.findById(userId).select('blockedUsers');
    return user?.blockedUsers || [];
  }
}
