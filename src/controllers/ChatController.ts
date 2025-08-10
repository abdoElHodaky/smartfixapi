import { Request, Response } from 'express';
import { ServiceRegistry } from '../container/ServiceRegistry';
import { IChatService } from '../interfaces/services';
import { CreateConversationDto, SendMessageDto, ChatFiltersDto } from '../dtos';

export class ChatController {
  private chatService: IChatService;

  constructor() {
    const registry = new ServiceRegistry();
    this.chatService = registry.getService<IChatService>('ChatService');
  }

  /**
   * Create a new conversation
   */
  createConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const conversationData: CreateConversationDto = req.body;
      const result = await this.chatService.createConversation(conversationData);
      res.status(201).json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get conversation by ID
   */
  getConversationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const conversation = await this.chatService.getConversationById(conversationId);
      res.json({ success: true, data: conversation });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get user conversations
   */
  getUserConversations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.chatService.getUserConversations(userId, page, limit);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Delete conversation
   */
  deleteConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { userId } = req.body; // In real app, this would come from auth middleware
      
      const result = await this.chatService.deleteConversation(conversationId, userId);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Send message
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const messageData: SendMessageDto = req.body;
      
      const result = await this.chatService.sendMessage(conversationId, messageData);
      res.status(201).json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get messages from conversation
   */
  getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const result = await this.chatService.getMessages(conversationId, page, limit);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Mark message as read
   */
  markMessageAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId } = req.params;
      const { userId } = req.body; // In real app, this would come from auth middleware
      
      const result = await this.chatService.markMessageAsRead(messageId, userId);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Mark conversation as read
   */
  markConversationAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { userId } = req.body; // In real app, this would come from auth middleware
      
      const result = await this.chatService.markConversationAsRead(conversationId, userId);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Delete message
   */
  deleteMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId } = req.params;
      const { userId } = req.body; // In real app, this would come from auth middleware
      
      const result = await this.chatService.deleteMessage(messageId, userId);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Search messages
   */
  searchMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: ChatFiltersDto = {
        conversationId: req.query.conversationId as string,
        userId: req.query.userId as string,
        search: req.query.search as string,
        messageType: req.query.messageType as any,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
      };

      const result = await this.chatService.searchMessages(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get unread messages count
   */
  getUnreadMessagesCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const count = await this.chatService.getUnreadMessagesCount(userId);
      res.json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Send file message
   */
  sendFileMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { senderId, fileUrl, fileType, fileName } = req.body;
      
      const result = await this.chatService.sendFileMessage(conversationId, senderId, fileUrl, fileType, fileName);
      res.status(201).json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Update conversation status
   */
  updateConversationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { status } = req.body;
      
      const result = await this.chatService.updateConversationStatus(conversationId, status);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Archive conversation
   */
  archiveConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { userId } = req.body; // In real app, this would come from auth middleware
      
      const result = await this.chatService.archiveConversation(conversationId, userId);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Unarchive conversation
   */
  unarchiveConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { userId } = req.body; // In real app, this would come from auth middleware
      
      const result = await this.chatService.unarchiveConversation(conversationId, userId);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Report message
   */
  reportMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId } = req.params;
      const { reporterId, reason } = req.body;
      
      const result = await this.chatService.reportMessage(messageId, reporterId, reason);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Block user
   */
  blockUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, blockedUserId } = req.body;
      
      const result = await this.chatService.blockUser(userId, blockedUserId);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Unblock user
   */
  unblockUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, blockedUserId } = req.body;
      
      const result = await this.chatService.unblockUser(userId, blockedUserId);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get blocked users
   */
  getBlockedUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      const blockedUsers = await this.chatService.getBlockedUsers(userId);
      res.json({ success: true, data: blockedUsers });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Join conversation (WebSocket endpoint)
   */
  joinConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { userId } = req.body; // In real app, this would come from auth middleware
      
      await this.chatService.joinConversation(conversationId, userId);
      res.json({ success: true, message: 'Joined conversation successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Leave conversation (WebSocket endpoint)
   */
  leaveConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { userId } = req.body; // In real app, this would come from auth middleware
      
      await this.chatService.leaveConversation(conversationId, userId);
      res.json({ success: true, message: 'Left conversation successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Update typing status (WebSocket endpoint)
   */
  updateTypingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { userId, isTyping } = req.body;
      
      await this.chatService.updateTypingStatus(conversationId, userId, isTyping);
      res.json({ success: true, message: 'Typing status updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

