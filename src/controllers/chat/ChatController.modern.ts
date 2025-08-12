/**
 * Modern ChatController
 * 
 * Updated implementation using the new BaseController pattern with:
 * - Modern dependency injection
 * - Standardized response formatting
 * - Built-in validation and error handling
 * - Decorator-based routing
 */

// External imports
import { Request, Response } from 'express';

// Internal imports
import { BaseController } from '../BaseController';
import { AuthRequest } from '../../types';
import { IChatService } from '../../interfaces/services';

// DTO imports
import { 
  ChatDto,
  MessageDto,
  ChatCreationDto,
  MessageCreationDto,
  ChatListDto,
  MessageListDto
} from '../../dtos';

// Decorator imports
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  RequireAuth, 
  UseMiddleware 
} from '../../decorators';

// Middleware imports
import { validateBody, validateParams, validateQuery } from '../../middleware';

@Controller({ path: '/chats' })
export class ChatController extends BaseController {
  private chatService: IChatService;

  constructor() {
    super();
    this.chatService = this.serviceRegistry.getChatService();
  }

  /**
   * Get chat for a service request
   */
  @Get('/service-request/:serviceRequestId')
  @RequireAuth()
  async getChatByServiceRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get Chat By Service Request');

      if (!this.requireAuth(req, res)) {
        return;
      }

      const { serviceRequestId } = req.params;

      const result = await this.chatService.getChatByServiceRequest(serviceRequestId, req.user!.id);
      this.sendSuccess<ChatDto>(res, result, 'Chat retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get chat', 400);
    }
  }

  /**
   * Create a new chat for a service request
   */
  @Post('/service-request/:serviceRequestId')
  @RequireAuth()
  @UseMiddleware(validateBody(ChatCreationDto))
  async createChatForServiceRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Create Chat For Service Request');

      if (!this.requireAuth(req, res)) {
        return;
      }

      const { serviceRequestId } = req.params;
      const { initialMessage } = req.body;

      const result = await this.chatService.createChatForServiceRequest({
        serviceRequestId,
        userId: req.user!.id,
        initialMessage
      });
      this.sendSuccess<ChatDto>(res, result, 'Chat created successfully', 201);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to create chat', 400);
    }
  }

  /**
   * Get all chats for the authenticated user
   */
  @Get('/my-chats')
  @RequireAuth()
  async getMyChats(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get My Chats');

      if (!this.requireAuth(req, res)) {
        return;
      }

      const { page, limit, offset } = this.getPaginationParams(req);
      const { sortBy, sortOrder } = this.getSortParams(req, ['lastMessageAt', 'createdAt']);
      const filters = this.getFilterParams(req, ['status', 'hasUnreadMessages']);

      const result = await this.chatService.getUserChats(req.user!.id, {
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        filters
      });
      this.sendSuccess<ChatListDto>(res, result, 'Chats retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get chats', 400);
    }
  }

  /**
   * Get chat by ID
   */
  @Get('/:chatId')
  @RequireAuth()
  async getChatById(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get Chat By ID');

      if (!this.requireAuth(req, res)) {
        return;
      }

      const { chatId } = req.params;

      const result = await this.chatService.getChatById(chatId, req.user!.id);
      this.sendSuccess<ChatDto>(res, result, 'Chat retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get chat', 400);
    }
  }

  /**
   * Send a message in a chat
   */
  @Post('/:chatId/messages')
  @RequireAuth()
  @UseMiddleware(validateBody(MessageCreationDto))
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Send Message');

      if (!this.requireAuth(req, res)) {
        return;
      }

      const { chatId } = req.params;
      const { content, messageType, attachments } = req.body;

      const result = await this.chatService.sendMessage({
        chatId,
        senderId: req.user!.id,
        content,
        messageType: messageType || 'text',
        attachments
      });
      this.sendSuccess<MessageDto>(res, result, 'Message sent successfully', 201);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to send message', 400);
    }
  }

  /**
   * Get messages for a chat
   */
  @Get('/:chatId/messages')
  @RequireAuth()
  async getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get Messages');

      if (!this.requireAuth(req, res)) {
        return;
      }

      const { chatId } = req.params;
      const { page, limit, offset } = this.getPaginationParams(req);
      const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt']);
      const { before, after } = req.query; // For cursor-based pagination

      const result = await this.chatService.getChatMessages(chatId, req.user!.id, {
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        before: before as string,
        after: after as string
      });
      this.sendSuccess<MessageListDto>(res, result, 'Messages retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get messages', 400);
    }
  }

  /**
   * Mark messages as read
   */
  @Put('/:chatId/messages/read')
  @RequireAuth()
  async markMessagesAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Mark Messages As Read');

      if (!this.requireAuth(req, res)) {
        return;
      }

      const { chatId } = req.params;
      const { messageIds } = req.body; // If not provided, mark all unread messages as read

      const result = await this.chatService.markMessagesAsRead(chatId, req.user!.id, messageIds);
      this.sendSuccess(res, result, 'Messages marked as read successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to mark messages as read', 400);
    }
  }

  /**
   * Update message (edit)
   */
  @Put('/:chatId/messages/:messageId')
  @RequireAuth()
  @UseMiddleware(validateBody(MessageUpdateDto))
  async updateMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Update Message');

      if (!this.requireAuth(req, res)) {
        return;
      }

      const { chatId, messageId } = req.params;
      const { content } = req.body;

      const result = await this.chatService.updateMessage(messageId, req.user!.id, { content });
      this.sendSuccess<MessageDto>(res, result, 'Message updated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update message', 400);
    }
  }

  /**
   * Delete message
   */
  @Delete('/:chatId/messages/:messageId')
  @RequireAuth()
  deleteMessage = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Delete Message');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { chatId, messageId } = req.params;

    try {
      await this.chatService.deleteMessage(messageId, req.user!.id);
      this.sendSuccess(res, null, 'Message deleted successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to delete message', 400);
    }
  });

  /**
   * Get chat participants
   */
  @Get('/:chatId/participants')
  @RequireAuth()
  getChatParticipants = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Chat Participants');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { chatId } = req.params;

    try {
      const result = await this.chatService.getChatParticipants(chatId, req.user!.id);
      this.sendSuccess(res, result, 'Chat participants retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get chat participants', 400);
    }
  });

  /**
   * Add participant to chat (if allowed)
   */
  @Post('/:chatId/participants')
  @RequireAuth()
  @Validate({
    userId: { required: true }
  })
  addParticipant = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Add Chat Participant');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      userId: { required: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    const { chatId } = req.params;
    const { userId } = req.body;

    try {
      const result = await this.chatService.addParticipant(chatId, userId, req.user!.id);
      this.sendSuccess(res, result, 'Participant added successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to add participant', 400);
    }
  });

  /**
   * Remove participant from chat (if allowed)
   */
  @Delete('/:chatId/participants/:userId')
  @RequireAuth()
  removeParticipant = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Remove Chat Participant');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { chatId, userId } = req.params;

    try {
      await this.chatService.removeParticipant(chatId, userId, req.user!.id);
      this.sendSuccess(res, null, 'Participant removed successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to remove participant', 400);
    }
  });

  /**
   * Get unread message count for user
   */
  @Get('/unread-count')
  @RequireAuth()
  getUnreadCount = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Unread Count');

    if (!this.requireAuth(req, res)) {
      return;
    }

    try {
      const result = await this.chatService.getUnreadMessageCount(req.user!.id);
      this.sendSuccess(res, result, 'Unread count retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get unread count', 400);
    }
  });

  /**
   * Search messages in chats
   */
  @Get('/search/messages')
  @RequireAuth()
  @Validate({
    query: { required: true, minLength: 1 }
  })
  searchMessages = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Search Messages');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { query, chatId } = req.query;
    const { page, limit, offset } = this.getPaginationParams(req);

    const validation = this.validateRequest(req.query, {
      query: { required: true, minLength: 1 }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      const result = await this.chatService.searchMessages(req.user!.id, {
        query: query as string,
        chatId: chatId as string,
        page,
        limit,
        offset
      });
      this.sendSuccess(res, result, 'Messages search completed successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to search messages', 400);
    }
  });

  /**
   * Archive/Unarchive chat
   */
  @Put('/:chatId/archive')
  @RequireAuth()
  @Validate({
    isArchived: { required: true }
  })
  archiveChat = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Archive Chat');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      isArchived: { required: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    const { chatId } = req.params;
    const { isArchived } = req.body;

    try {
      const result = await this.chatService.archiveChat(chatId, req.user!.id, isArchived);
      this.sendSuccess(res, result, `Chat ${isArchived ? 'archived' : 'unarchived'} successfully`);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to archive chat', 400);
    }
  });
}
