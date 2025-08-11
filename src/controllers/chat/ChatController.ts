import 'reflect-metadata';
import { Response } from 'express';
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Body, 
  Req, 
  Res,
  Params,
  Query,
  Status
} from '@decorators/express';
import { Injectable } from '@decorators/di';
import { Chat } from '../../models/Chat';
import { ServiceRequest } from '../../models/ServiceRequest';
import { serviceRegistry } from '../../container';
import { AuthRequest } from '../../types';
import { NotFoundError, ValidationError, AuthorizationError } from '../../middleware/errorHandler';
import { Auth, RateLimit, AsyncHandler } from '../../decorators/middleware';
import { IChatService } from '../../interfaces/services';

/**
 * Chat Controller using decorators
 */
@Injectable()
@Controller('/api/chats')
export class ChatController {
  private chatService: IChatService;

  constructor() {
    this.chatService = serviceRegistry.getService('chat') as IChatService;
  }

  /**
   * Get chat for a service request
   */
  @Get('/service-request/:serviceRequestId')
  @Auth
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getChatByServiceRequest(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { serviceRequestId } = params;

      // Check if user has access to this service request
      const serviceRequest = await ServiceRequest.findById(serviceRequestId);
      if (!serviceRequest) {
        res.status(404).json({
          success: false,
          message: 'Service request not found'
        });
        return;
      }

      // Check if user is either the requester or the assigned provider
      if (serviceRequest.userId.toString() !== req.user.id && 
          (!serviceRequest.providerId || serviceRequest.providerId.toString() !== req.user.id)) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      let chat = await Chat.findOne({ serviceRequestId })
        .populate('participants', 'name email')
        .populate('messages.senderId', 'name email');

      if (!chat) {
        // Create new chat if it doesn't exist
        chat = new Chat({
          serviceRequestId,
          participants: [serviceRequest.userId, serviceRequest.providerId].filter(Boolean),
          messages: []
        });
        await chat.save();
        await chat.populate('participants', 'name email');
      }

      res.json({
        success: true,
        data: chat
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get chat'
      });
    }
  }

  /**
   * Send a message in a chat
   */
  @Post('/:chatId/messages')
  @Auth
  @RateLimit({ windowMs: 60000, max: 50 })
  @AsyncHandler
  async sendMessage(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any, @Body() body: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { chatId } = params;
      const { message, messageType = 'text' } = body;

      if (!message || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
        return;
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        res.status(404).json({
          success: false,
          message: 'Chat not found'
        });
        return;
      }

      // Check if user is a participant in this chat
      if (!chat.participants.includes(req.user.id)) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const newMessage = {
        senderId: req.user.id,
        message: message.trim(),
        messageType,
        timestamp: new Date(),
        isRead: false
      };

      chat.messages.push(newMessage);
      chat.lastMessage = message.trim();
      chat.lastMessageAt = new Date();
      chat.updatedAt = new Date();

      await chat.save();
      await chat.populate('messages.senderId', 'name email');

      const savedMessage = chat.messages[chat.messages.length - 1];

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: savedMessage
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send message'
      });
    }
  }

  /**
   * Get user's chats
   */
  @Get('/my-chats')
  @Auth
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getMyChats(@Req() req: AuthRequest, @Res() res: Response, @Query() query: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      const chats = await Chat.find({ participants: req.user.id })
        .populate('participants', 'name email')
        .populate('serviceRequestId', 'title status')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Chat.countDocuments({ participants: req.user.id });

      res.json({
        success: true,
        data: chats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get chats'
      });
    }
  }

  /**
   * Mark messages as read
   */
  @Put('/:chatId/messages/read')
  @Auth
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async markMessagesAsRead(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { chatId } = params;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        res.status(404).json({
          success: false,
          message: 'Chat not found'
        });
        return;
      }

      // Check if user is a participant in this chat
      if (!chat.participants.includes(req.user.id)) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      // Mark all messages as read for this user
      chat.messages.forEach(message => {
        if (message.senderId.toString() !== req.user.id) {
          message.isRead = true;
        }
      });

      await chat.save();

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark messages as read'
      });
    }
  }

  /**
   * Get chat by ID
   */
  @Get('/:chatId')
  @Auth
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getChatById(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { chatId } = params;

      const chat = await Chat.findById(chatId)
        .populate('participants', 'name email')
        .populate('messages.senderId', 'name email')
        .populate('serviceRequestId', 'title status');

      if (!chat) {
        res.status(404).json({
          success: false,
          message: 'Chat not found'
        });
        return;
      }

      // Check if user is a participant in this chat
      if (!chat.participants.some((participant: any) => participant._id.toString() === req.user.id)) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      res.json({
        success: true,
        data: chat
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get chat'
      });
    }
  }

  /**
   * Delete a chat (admin only)
   */
  @Delete('/:chatId')
  @Auth
  @RateLimit({ windowMs: 60000, max: 10 })
  @AsyncHandler
  async deleteChat(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const { chatId } = params;

      const chat = await Chat.findByIdAndDelete(chatId);
      if (!chat) {
        res.status(404).json({
          success: false,
          message: 'Chat not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Chat deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete chat'
      });
    }
  }
}

