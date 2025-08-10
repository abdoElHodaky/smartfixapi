import { Response } from 'express';
import { Chat } from '../../models/Chat';
import { ServiceRequest } from '../../models/ServiceRequest';
import { ChatService } from '../../services/chat/ChatService';
import { AuthRequest } from '../../types';
import { asyncHandler, NotFoundError, ValidationError, AuthorizationError } from '../../middleware/errorHandler';

export class ChatController {
  private chatService: ChatService;

  constructor(chatService: ChatService = new ChatService()) {
    this.chatService = chatService;
  }

  /**
   * Get chat for a service request
   */
  getChatByServiceRequest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { serviceRequestId } = req.params;

    // Check if user has access to this service request
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    const isOwner = serviceRequest.userId.toString() === req.user.id;
    const isProvider = serviceRequest.providerId && 
      (serviceRequest.providerId as any).userId?.toString() === req.user.id;

    if (!isOwner && !isProvider) {
      throw new AuthorizationError('Access denied');
    }

    const chat = await Chat.findOne({ serviceRequestId })
      .populate('participants', 'firstName lastName profileImage')
      .populate('serviceRequest', 'title status');

    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    res.status(200).json({
      success: true,
      message: 'Chat retrieved successfully',
      data: chat
    });
  });

  /**
   * Send a message
   */
  sendMessage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { chatId } = req.params;
    const { content, messageType = 'text', attachments } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (participantId: any) => participantId.toString() === req.user!.id
    );

    if (!isParticipant) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    await chat.addMessage(req.user.id, content, messageType, attachments);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        content,
        messageType,
        timestamp: new Date()
      }
    });
  });

  /**
   * Get messages with pagination
   */
  getMessages = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { chatId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (participantId: any) => participantId.toString() === req.user!.id
    );

    if (!isParticipant) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    const messagesData = chat.getMessages(page, limit);

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: messagesData
    });
  });

  /**
   * Mark messages as read
   */
  markAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { chatId } = req.params;
    const { messageIds } = req.body; // Optional: specific message IDs to mark as read

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (participantId: any) => participantId.toString() === req.user!.id
    );

    if (!isParticipant) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    await chat.markAsRead(req.user.id, messageIds);

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  });

  /**
   * Get user's chats
   */
  getUserChats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const chats = await Chat.findUserChats(req.user.id, page, limit);

    // Add unread count for each chat
    const chatsWithUnreadCount = chats.map((chat: any) => ({
      ...chat.toJSON(),
      unreadCount: chat.getUnreadCount(req.user!.id)
    }));

    res.status(200).json({
      success: true,
      message: 'User chats retrieved successfully',
      data: chatsWithUnreadCount
    });
  });

  /**
   * Edit a message
   */
  editMessage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { chatId, messageId } = req.params;
    const { content } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    try {
      await chat.editMessage(messageId, content, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Message edited successfully'
      });
    } catch (error) {
      throw new ValidationError((error as Error).message);
    }
  });

  /**
   * Get unread message count
   */
  getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (participantId: any) => participantId.toString() === req.user!.id
    );

    if (!isParticipant) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    const unreadCount = chat.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: { unreadCount }
    });
  });

  /**
   * Create a new chat (usually done automatically when a proposal is accepted)
   */
  createChat = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { serviceRequestId, participants } = req.body;

    // Verify service request exists and user has permission
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    const isOwner = serviceRequest.userId.toString() === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      throw new AuthorizationError('Only the service request owner can create a chat');
    }

    const chat = await Chat.createChat(serviceRequestId, participants);

    await chat.populate([
      { path: 'participants', select: 'firstName lastName profileImage' },
      { path: 'serviceRequest', select: 'title status' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: chat
    });
  });
}
