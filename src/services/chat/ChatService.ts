import { Chat } from '../../models/Chat';
import { ServiceRequest } from '../../models/ServiceRequest';
import { NotFoundError, ValidationError, AuthorizationError } from '../../middleware/errorHandler';

export interface MessageData {
  content: string;
  messageType?: 'text' | 'image' | 'file';
  attachments?: string[];
}

export interface ChatFilters {
  userId: string;
  page?: number;
  limit?: number;
}

export class ChatService {
  /**
   * Create a new chat for a service request
   */
  async createChat(serviceRequestId: string, participants: string[]): Promise<any> {
    // Verify service request exists
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Check if chat already exists for this service request
    const existingChat = await Chat.findOne({ serviceRequestId });
    if (existingChat) {
      return existingChat;
    }

    const chat = await Chat.createChat(serviceRequestId, participants);
    
    await chat.populate([
      { path: 'participants', select: 'firstName lastName profileImage' },
      { path: 'serviceRequest', select: 'title status' }
    ]);

    return chat;
  }

  /**
   * Get chat by service request ID
   */
  async getChatByServiceRequest(serviceRequestId: string, userId: string): Promise<any> {
    // Check if user has access to this service request
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    const isOwner = serviceRequest.userId.toString() === userId;
    const isProvider = serviceRequest.providerId && 
      (serviceRequest.providerId as any).userId?.toString() === userId;

    if (!isOwner && !isProvider) {
      throw new AuthorizationError('Access denied');
    }

    const chat = await Chat.findOne({ serviceRequestId })
      .populate('participants', 'firstName lastName profileImage')
      .populate('serviceRequest', 'title status');

    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    return chat;
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string, userId: string): Promise<any> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (participantId: any) => participantId.toString() === userId
    );

    if (!isParticipant) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    await chat.populate([
      { path: 'participants', select: 'firstName lastName profileImage' },
      { path: 'serviceRequest', select: 'title status' }
    ]);

    return chat;
  }

  /**
   * Send a message in a chat
   */
  async sendMessage(
    chatId: string, 
    senderId: string, 
    messageData: MessageData
  ): Promise<any> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (participantId: any) => participantId.toString() === senderId
    );

    if (!isParticipant) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    await chat.addMessage(
      senderId, 
      messageData.content, 
      messageData.messageType || 'text',
      messageData.attachments
    );

    return {
      content: messageData.content,
      messageType: messageData.messageType || 'text',
      timestamp: new Date()
    };
  }

  /**
   * Get messages with pagination
   */
  async getMessages(
    chatId: string, 
    userId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<any> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (participantId: any) => participantId.toString() === userId
    );

    if (!isParticipant) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    return chat.getMessages(page, limit);
  }

  /**
   * Mark messages as read
   */
  async markAsRead(
    chatId: string, 
    userId: string, 
    messageIds?: string[]
  ): Promise<void> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (participantId: any) => participantId.toString() === userId
    );

    if (!isParticipant) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    await chat.markAsRead(userId, messageIds);
  }

  /**
   * Edit a message
   */
  async editMessage(
    chatId: string, 
    messageId: string, 
    content: string, 
    userId: string
  ): Promise<void> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    try {
      await chat.editMessage(messageId, content, userId);
    } catch (error) {
      throw new ValidationError((error as Error).message);
    }
  }

  /**
   * Get user's chats
   */
  async getUserChats(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<any> {
    const chats = await Chat.findUserChats(userId, page, limit);

    // Add unread count for each chat
    const chatsWithUnreadCount = chats.map((chat: any) => ({
      ...chat.toJSON(),
      unreadCount: chat.getUnreadCount(userId)
    }));

    return chatsWithUnreadCount;
  }

  /**
   * Get unread message count for a chat
   */
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (participantId: any) => participantId.toString() === userId
    );

    if (!isParticipant) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    return chat.getUnreadCount(userId);
  }

  /**
   * Get total unread messages count for user
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    const chats = await Chat.find({ participants: userId });
    
    let totalUnread = 0;
    for (const chat of chats) {
      totalUnread += chat.getUnreadCount(userId);
    }

    return totalUnread;
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(
    chatId: string, 
    messageId: string, 
    userId: string
  ): Promise<void> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Check if user is the sender or admin
    if (message.senderId.toString() !== userId) {
      throw new AuthorizationError('You can only delete your own messages');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await chat.save();
  }

  /**
   * Get chat statistics
   */
  async getChatStatistics(): Promise<any> {
    const [
      totalChats,
      activeChats,
      totalMessages,
      averageMessagesPerChat
    ] = await Promise.all([
      Chat.countDocuments(),
      Chat.countDocuments({ 
        lastMessageAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      }),
      Chat.aggregate([
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$messageCount' } } }
      ]),
      Chat.aggregate([
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, average: { $avg: '$messageCount' } } }
      ])
    ]);

    return {
      totalChats,
      activeChats,
      totalMessages: totalMessages[0]?.total || 0,
      averageMessagesPerChat: Math.round(averageMessagesPerChat[0]?.average || 0)
    };
  }

  /**
   * Search messages in a chat
   */
  async searchMessages(
    chatId: string, 
    userId: string, 
    searchQuery: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (participantId: any) => participantId.toString() === userId
    );

    if (!isParticipant) {
      throw new AuthorizationError('You are not a participant in this chat');
    }

    const skip = (page - 1) * limit;
    const regex = new RegExp(searchQuery, 'i');

    const matchingMessages = chat.messages
      .filter((message: any) => 
        !message.isDeleted && 
        regex.test(message.content)
      )
      .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(skip, skip + limit);

    const total = chat.messages.filter((message: any) => 
      !message.isDeleted && regex.test(message.content)
    ).length;

    return {
      messages: matchingMessages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Validate message data
   */
  static validateMessageData(messageData: MessageData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!messageData.content || messageData.content.trim().length === 0) {
      errors.push('Message content cannot be empty');
    }

    if (messageData.content && messageData.content.length > 2000) {
      errors.push('Message content cannot exceed 2000 characters');
    }

    if (messageData.messageType && !['text', 'image', 'file'].includes(messageData.messageType)) {
      errors.push('Invalid message type');
    }

    if (messageData.attachments && !Array.isArray(messageData.attachments)) {
      errors.push('Attachments must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

