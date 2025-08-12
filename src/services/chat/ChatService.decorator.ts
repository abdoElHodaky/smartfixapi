/**
 * Decorator-Based ChatService
 * 
 * Modern implementation of chat service using decorators for
 * enhanced functionality including caching, logging, retry logic, and validation.
 */

import 'reflect-metadata';
import { Injectable, Inject } from '@decorators/di';
import { Chat } from '../../models/Chat';
import { Message } from '../../models/Message';
import { User } from '../../models/User';
import { ServiceRequest } from '../../models/ServiceRequest';
import { NotFoundError, ValidationError, AuthenticationError } from '../../middleware/errorHandler';
import { IChatService, IUserService, IServiceRequestService } from '../../interfaces/services';
import {
  CreateChatDto,
  SendMessageDto,
  ChatFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto,
  ChatStatisticsDto
} from '../../dtos';

// Import optimization utilities
import { AggregationBuilder, ConditionalHelpers, ErrorHandlers } from '../../utils';

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

@Injectable()
@Singleton()
@Service({
  scope: 'singleton',
  lazy: false,
  priority: 7
})
export class ChatService implements IChatService {
  constructor(
    @Inject('UserService') private userService: IUserService,
    @Inject('ServiceRequestService') private serviceRequestService: IServiceRequestService
  ) {}

  @PostConstruct()
  async initialize(): Promise<void> {
    console.log('💬 ChatService initialized with decorator-based architecture');
  }

  @PreDestroy()
  async cleanup(): Promise<void> {
    console.log('💬 ChatService cleanup completed');
  }

  /**
   * Create a new chat with validation and logging
   */
  @Log({
    message: 'Creating chat',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 2000,
    condition: (error: Error) => error.message.includes('database')
  })
  async createChat(userId: string, chatData: CreateChatDto): Promise<ApiResponseDto> {
    try {
      // Validate participants
      if (!chatData.participants || chatData.participants.length < 2) {
        throw new ValidationError('Chat must have at least 2 participants');
      }

      // Verify all participants exist
      for (const participantId of chatData.participants) {
        await this.userService.getUserById(participantId);
      }

      // Verify service request exists if provided
      if (chatData.serviceRequestId) {
        await this.serviceRequestService.getServiceRequestById(chatData.serviceRequestId);
      }

      // Check if chat already exists for this service request
      if (chatData.serviceRequestId) {
        const existingChat = await Chat.findOne({
          serviceRequestId: chatData.serviceRequestId,
          participants: { $all: chatData.participants }
        });

        if (existingChat) {
          return {
            success: true,
            message: 'Chat already exists',
            data: existingChat
          };
        }
      }

      const chat = new Chat({
        ...chatData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date()
      });

      await chat.save();

      // Populate participants
      await chat.populate('participants', 'firstName lastName profileImage');
      if (chatData.serviceRequestId) {
        await chat.populate('serviceRequestId', 'title category');
      }

      return {
        success: true,
        message: 'Chat created successfully',
        data: chat
      };
    } catch (error) {
      // Optimized: Use ErrorHandlers for standardized error handling
      return ErrorHandlers.handleServiceError(error, 'Failed to create chat');
    }
  }

  /**
   * Get chat by ID with caching
   */
  @Log('Getting chat by ID')
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  @Retryable({
    attempts: 3,
    delay: 1000,
    condition: (error: Error) => error.message.includes('database')
  })
  async getChatById(chatId: string, userId: string): Promise<any> {
    const chat = await Chat.findById(chatId)
      .populate('participants', 'firstName lastName profileImage status')
      .populate('serviceRequestId', 'title category status')
      .populate('createdBy', 'firstName lastName');

    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
      (participant: any) => participant._id.toString() === userId
    );

    if (!isParticipant) {
      throw new AuthenticationError('You are not a participant in this chat');
    }

    return chat;
  }

  /**
   * Send message with comprehensive validation and logging
   */
  @Log({
    message: 'Sending message',
    includeExecutionTime: true
  })
  @Retryable({
    attempts: 3,
    delay: 1500,
    condition: (error: Error) => error.message.includes('database') || error.message.includes('network')
  })
  async sendMessage(userId: string, messageData: SendMessageDto): Promise<ApiResponseDto> {
    try {
      // Validate message content
      if (!messageData.content || messageData.content.trim().length === 0) {
        throw new ValidationError('Message content cannot be empty');
      }

      if (messageData.content.length > 1000) {
        throw new ValidationError('Message content cannot exceed 1000 characters');
      }

      // Verify chat exists and user is participant
      const chat = await this.getChatById(messageData.chatId, userId);

      // Create message
      const message = new Message({
        chatId: messageData.chatId,
        senderId: userId,
        content: messageData.content,
        messageType: messageData.messageType || 'text',
        attachments: messageData.attachments || [],
        createdAt: new Date()
      });

      await message.save();

      // Update chat's last activity and message count
      await Chat.findByIdAndUpdate(messageData.chatId, {
        lastActivity: new Date(),
        lastMessage: message._id,
        $inc: { messageCount: 1 },
        updatedAt: new Date()
      });

      // Populate sender information
      await message.populate('senderId', 'firstName lastName profileImage');

      // Mark message as delivered for all participants except sender
      const deliveryPromises = chat.participants
        .filter((participant: any) => participant._id.toString() !== userId)
        .map((participant: any) => 
          Message.findByIdAndUpdate(message._id, {
            $push: {
              deliveryStatus: {
                userId: participant._id,
                status: 'delivered',
                timestamp: new Date()
              }
            }
          })
        );

      await Promise.all(deliveryPromises);

      return {
        success: true,
        message: 'Message sent successfully',
        data: message
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthenticationError) {
        throw error;
      }
      throw new ValidationError('Failed to send message');
    }
  }

  /**
   * Get chat messages with pagination and caching
   */
  @Log('Getting chat messages')
  @Cached(1 * 60 * 1000) // Cache for 1 minute
  @Retryable(2)
  async getChatMessages(
    chatId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponseDto> {
    try {
      // Verify user is participant
      await this.getChatById(chatId, userId);

      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        Message.find({ chatId })
          .populate('senderId', 'firstName lastName profileImage')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Message.countDocuments({ chatId })
      ]);

      // Mark messages as read
      await this.markMessagesAsRead(chatId, userId);

      return {
        success: true,
        message: 'Chat messages retrieved successfully',
        data: messages.reverse(), // Reverse to show oldest first
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthenticationError) {
        throw error;
      }
      throw new ValidationError('Failed to get chat messages');
    }
  }

  /**
   * Get user's chats with caching
   */
  @Log('Getting user chats')
  @Cached(2 * 60 * 1000) // Cache for 2 minutes
  @Retryable(2)
  async getUserChats(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponseDto> {
    try {
      const skip = (page - 1) * limit;

      const [chats, total] = await Promise.all([
        Chat.find({ participants: userId })
          .populate('participants', 'firstName lastName profileImage status')
          .populate('serviceRequestId', 'title category status')
          .populate('lastMessage')
          .skip(skip)
          .limit(limit)
          .sort({ lastActivity: -1 }),
        Chat.countDocuments({ participants: userId })
      ]);

      // Add unread message count for each chat
      const chatsWithUnreadCount = await Promise.all(
        chats.map(async (chat) => {
          const unreadCount = await Message.countDocuments({
            chatId: chat._id,
            senderId: { $ne: userId },
            'deliveryStatus.userId': userId,
            'deliveryStatus.status': { $ne: 'read' }
          });

          return {
            ...chat.toJSON(),
            unreadCount
          };
        })
      );

      return {
        success: true,
        message: 'User chats retrieved successfully',
        data: chatsWithUnreadCount,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new ValidationError('Failed to get user chats');
    }
  }

  /**
   * Mark messages as read
   */
  @Log('Marking messages as read')
  @Retryable(2)
  async markMessagesAsRead(chatId: string, userId: string): Promise<ApiResponseDto> {
    try {
      // Verify user is participant
      await this.getChatById(chatId, userId);

      // Update delivery status for unread messages
      await Message.updateMany(
        {
          chatId,
          senderId: { $ne: userId },
          'deliveryStatus.userId': userId,
          'deliveryStatus.status': { $ne: 'read' }
        },
        {
          $set: {
            'deliveryStatus.$.status': 'read',
            'deliveryStatus.$.timestamp': new Date()
          }
        }
      );

      return {
        success: true,
        message: 'Messages marked as read',
        data: null
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthenticationError) {
        throw error;
      }
      throw new ValidationError('Failed to mark messages as read');
    }
  }

  /**
   * Search chats with advanced filtering
   */
  @Log('Searching chats')
  @Cached(3 * 60 * 1000) // Cache for 3 minutes
  @Retryable(2)
  async searchChats(userId: string, filters: ChatFiltersDto, page: number = 1, limit: number = 20): Promise<PaginatedResponseDto> {
    try {
      const skip = (page - 1) * limit;
      let query: any = { participants: userId };

      // Apply filters
      if (filters.serviceRequestId) {
        query.serviceRequestId = filters.serviceRequestId;
      }

      if (filters.chatType) {
        query.chatType = filters.chatType;
      }

      if (filters.searchTerm) {
        // Search in chat title or participant names
        const participantIds = await User.find({
          $or: [
            { firstName: { $regex: filters.searchTerm, $options: 'i' } },
            { lastName: { $regex: filters.searchTerm, $options: 'i' } }
          ]
        }).distinct('_id');

        query.$or = [
          { title: { $regex: filters.searchTerm, $options: 'i' } },
          { participants: { $in: participantIds } }
        ];
      }

      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      const [chats, total] = await Promise.all([
        Chat.find(query)
          .populate('participants', 'firstName lastName profileImage status')
          .populate('serviceRequestId', 'title category status')
          .populate('lastMessage')
          .skip(skip)
          .limit(limit)
          .sort({ lastActivity: -1 }),
        Chat.countDocuments(query)
      ]);

      return {
        success: true,
        message: 'Chats retrieved successfully',
        data: chats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new ValidationError('Failed to search chats');
    }
  }

  /**
   * Delete chat with validation
   */
  @Log('Deleting chat')
  @Retryable(2)
  async deleteChat(chatId: string, userId: string): Promise<ApiResponseDto> {
    try {
      const chat = await this.getChatById(chatId, userId);

      // Only chat creator or admin can delete chat
      if (chat.createdBy.toString() !== userId) {
        const user = await this.userService.getUserById(userId);
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          throw new AuthenticationError('Only chat creator or admin can delete chat');
        }
      }

      // Delete all messages in the chat
      await Message.deleteMany({ chatId });

      // Delete the chat
      await Chat.findByIdAndDelete(chatId);

      return {
        success: true,
        message: 'Chat deleted successfully',
        data: null
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthenticationError) {
        throw error;
      }
      throw new ValidationError('Failed to delete chat');
    }
  }

  /**
   * Add participant to chat
   */
  @Log('Adding participant to chat')
  @Retryable(2)
  async addParticipant(chatId: string, userId: string, newParticipantId: string): Promise<ApiResponseDto> {
    try {
      const chat = await this.getChatById(chatId, userId);

      // Verify new participant exists
      await this.userService.getUserById(newParticipantId);

      // Check if participant is already in chat
      const isAlreadyParticipant = chat.participants.some(
        (participant: any) => participant._id.toString() === newParticipantId
      );

      if (isAlreadyParticipant) {
        throw new ValidationError('User is already a participant in this chat');
      }

      // Add participant
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: { participants: newParticipantId },
          updatedAt: new Date(),
          lastActivity: new Date()
        },
        { new: true }
      ).populate('participants', 'firstName lastName profileImage status');

      // Send system message about new participant
      const systemMessage = new Message({
        chatId,
        senderId: userId,
        content: `Added a new participant to the chat`,
        messageType: 'system',
        createdAt: new Date()
      });

      await systemMessage.save();

      return {
        success: true,
        message: 'Participant added successfully',
        data: updatedChat
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthenticationError) {
        throw error;
      }
      throw new ValidationError('Failed to add participant');
    }
  }

  /**
   * Remove participant from chat
   */
  @Log('Removing participant from chat')
  @Retryable(2)
  async removeParticipant(chatId: string, userId: string, participantId: string): Promise<ApiResponseDto> {
    try {
      const chat = await this.getChatById(chatId, userId);

      // Only chat creator can remove participants
      if (chat.createdBy.toString() !== userId) {
        throw new AuthenticationError('Only chat creator can remove participants');
      }

      // Cannot remove yourself if you're the creator
      if (participantId === userId) {
        throw new ValidationError('Chat creator cannot remove themselves');
      }

      // Remove participant
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $pull: { participants: participantId },
          updatedAt: new Date(),
          lastActivity: new Date()
        },
        { new: true }
      ).populate('participants', 'firstName lastName profileImage status');

      // Send system message about removed participant
      const systemMessage = new Message({
        chatId,
        senderId: userId,
        content: `Removed a participant from the chat`,
        messageType: 'system',
        createdAt: new Date()
      });

      await systemMessage.save();

      return {
        success: true,
        message: 'Participant removed successfully',
        data: updatedChat
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthenticationError) {
        throw error;
      }
      throw new ValidationError('Failed to remove participant');
    }
  }

  /**
   * Get chat statistics with caching - OPTIMIZED with AggregationBuilder
   */
  @Log('Getting chat statistics')
  @Cached(10 * 60 * 1000) // Cache for 10 minutes
  async getChatStatistics(userId?: string): Promise<ChatStatisticsDto> {
    try {
      let chatQuery: any = {};
      let messageQuery: any = {};

      if (userId) {
        chatQuery.participants = userId;
        messageQuery.senderId = userId;
      }

      const [
        totalChats,
        activeChats,
        totalMessages,
        averageMessagesPerChat,
        chatsByType
      ] = await Promise.all([
        Chat.countDocuments(chatQuery),
        Chat.countDocuments({
          ...chatQuery,
          lastActivity: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Active in last 7 days
        }),
        Message.countDocuments(messageQuery),
        // Optimized: Use AggregationBuilder for average messages per chat
        AggregationBuilder.create()
          .match(chatQuery)
          .buildAverageField('messageCount')
          .execute(Chat),
        // Optimized: Use AggregationBuilder for chat type statistics
        AggregationBuilder.create()
          .match(chatQuery)
          .buildCategoryStatistics('chatType')
          .execute(Chat)
      ]);

      return {
        totalChats,
        activeChats,
        totalMessages,
        averageMessagesPerChat: averageMessagesPerChat.length > 0 ? averageMessagesPerChat[0].avgMessages : 0,
        chatsByType: chatsByType.reduce((acc, item) => {
          acc[item._id || 'direct'] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      throw new ValidationError('Failed to get chat statistics');
    }
  }

  /**
   * Get online participants (placeholder implementation)
   */
  @Log('Getting online participants')
  @Cached(30 * 1000) // Cache for 30 seconds
  async getOnlineParticipants(chatId: string, userId: string): Promise<ApiResponseDto> {
    try {
      // Verify user is participant
      const chat = await this.getChatById(chatId, userId);

      // In a real implementation, this would check user online status
      // For now, return all participants as potentially online
      const onlineParticipants = chat.participants.filter(
        (participant: any) => participant.status === 'active'
      );

      return {
        success: true,
        message: 'Online participants retrieved successfully',
        data: onlineParticipants
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthenticationError) {
        throw error;
      }
      throw new ValidationError('Failed to get online participants');
    }
  }
}
