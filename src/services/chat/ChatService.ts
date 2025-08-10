import { Chat } from '../../models/Chat';
import { User } from '../../models/User';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { IChatService, IUserService } from '../../interfaces/services';
import {
  CreateConversationDto,
  SendMessageDto,
  ChatFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

export class ChatService implements IChatService {
  constructor(private userService: IUserService) {}

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationDto): Promise<ApiResponseDto> {
    const { participants, type, title, description, serviceRequestId, metadata } = data;

    // Verify all participants exist
    for (const participantId of participants) {
      await this.userService.getUserById(participantId);
    }

    const conversation = new Chat({
      participants,
      type,
      title,
      description,
      serviceRequestId,
      metadata,
      messages: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await conversation.save();

    return {
      success: true,
      message: 'Conversation created successfully',
      data: conversation
    };
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId: string): Promise<any> {
    const conversation = await Chat.findById(conversationId)
      .populate('participants', 'firstName lastName profileImage')
      .populate('messages.senderId', 'firstName lastName profileImage');
    
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    
    return conversation;
  }

  /**
   * Get user conversations
   */
  async getUserConversations(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;

    const conversations = await Chat.find({
      participants: userId,
      isActive: true
    })
      .populate('participants', 'firstName lastName profileImage')
      .populate({
        path: 'messages',
        options: { 
          sort: { createdAt: -1 },
          limit: 1
        },
        populate: {
          path: 'senderId',
          select: 'firstName lastName profileImage'
        }
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Chat.countDocuments({
      participants: userId,
      isActive: true
    });

    // Add unread message count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.getUnreadMessagesCountForConversation(conversationId, userId);
        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    return {
      data: conversationsWithUnread,
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
   * Delete conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<ApiResponseDto> {
    const conversation = await Chat.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found or you do not have permission');
    }

    // Soft delete - mark as inactive for the user
    conversation.isActive = false;
    await conversation.save();

    return {
      success: true,
      message: 'Conversation deleted successfully'
    };
  }

  /**
   * Send message
   */
  async sendMessage(conversationId: string, messageData: SendMessageDto): Promise<ApiResponseDto> {
    const { senderId, content, type, attachments, replyTo, metadata } = messageData;

    // Verify conversation exists and user is participant
    const conversation = await Chat.findOne({
      _id: conversationId,
      participants: senderId,
      isActive: true
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found or you do not have permission');
    }

    // Verify sender exists
    await this.userService.getUserById(senderId);

    const message = {
      senderId,
      content,
      type,
      attachments: attachments || [],
      replyTo,
      metadata,
      isRead: [senderId], // Sender has read their own message
      createdAt: new Date(),
      updatedAt: new Date()
    };

    conversation.messages.push(message);
    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();
    conversation.updatedAt = new Date();

    await conversation.save();

    // Get the saved message with populated sender info
    const savedConversation = await Chat.findById(conversationId)
      .populate('messages.senderId', 'firstName lastName profileImage');
    
    const savedMessage = savedConversation.messages[savedConversation.messages.length - 1];

    return {
      success: true,
      message: 'Message sent successfully',
      data: savedMessage
    };
  }

  /**
   * Get messages from conversation
   */
  async getMessages(
    conversationId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<PaginatedResponseDto<any>> {
    const conversation = await Chat.findById(conversationId)
      .populate('messages.senderId', 'firstName lastName profileImage');
    
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const totalMessages = conversation.messages.length;
    const skip = Math.max(0, totalMessages - (page * limit));
    const messages = conversation.messages
      .slice(skip, skip + limit)
      .reverse(); // Most recent first

    return {
      data: messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalItems: totalMessages,
        hasNext: skip > 0,
        hasPrev: skip + limit < totalMessages
      }
    };
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<ApiResponseDto> {
    const conversation = await Chat.findOne({
      'messages._id': messageId,
      participants: userId
    });

    if (!conversation) {
      throw new NotFoundError('Message not found or you do not have permission');
    }

    const message = conversation.messages.id(messageId);
    if (!message.isRead.includes(userId)) {
      message.isRead.push(userId);
      await conversation.save();
    }

    return {
      success: true,
      message: 'Message marked as read'
    };
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<ApiResponseDto> {
    const conversation = await Chat.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found or you do not have permission');
    }

    // Mark all messages as read for this user
    conversation.messages.forEach(message => {
      if (!message.isRead.includes(userId)) {
        message.isRead.push(userId);
      }
    });

    await conversation.save();

    return {
      success: true,
      message: 'Conversation marked as read'
    };
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string, userId: string): Promise<ApiResponseDto> {
    const conversation = await Chat.findOne({
      'messages._id': messageId,
      'messages.senderId': userId
    });

    if (!conversation) {
      throw new NotFoundError('Message not found or you do not have permission to delete it');
    }

    conversation.messages.id(messageId).remove();
    await conversation.save();

    return {
      success: true,
      message: 'Message deleted successfully'
    };
  }

  /**
   * Search messages
   */
  async searchMessages(filters: ChatFiltersDto): Promise<PaginatedResponseDto<any>> {
    const { 
      conversationId, 
      userId, 
      search, 
      messageType, 
      dateFrom, 
      dateTo,
      page = 1, 
      limit = 20 
    } = filters;

    const matchStage: any = {};

    if (conversationId) {
      matchStage._id = conversationId;
    }

    if (userId) {
      matchStage.participants = userId;
    }

    const pipeline: any[] = [
      { $match: matchStage },
      { $unwind: '$messages' }
    ];

    const messageMatch: any = {};

    if (search) {
      messageMatch['messages.content'] = { $regex: search, $options: 'i' };
    }

    if (messageType) {
      messageMatch['messages.type'] = messageType;
    }

    if (dateFrom || dateTo) {
      messageMatch['messages.createdAt'] = {};
      if (dateFrom) messageMatch['messages.createdAt'].$gte = dateFrom;
      if (dateTo) messageMatch['messages.createdAt'].$lte = dateTo;
    }

    if (Object.keys(messageMatch).length > 0) {
      pipeline.push({ $match: messageMatch });
    }

    pipeline.push(
      { $sort: { 'messages.createdAt': -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'messages.senderId',
          foreignField: '_id',
          as: 'messages.sender'
        }
      },
      {
        $project: {
          message: '$messages',
          conversationId: '$_id',
          participants: 1
        }
      }
    );

    const results = await Chat.aggregate(pipeline);

    // Get total count
    const countPipeline = [...pipeline.slice(0, -3), { $count: 'total' }];
    const countResult = await Chat.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    return {
      data: results,
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
   * Get unread messages count for user
   */
  async getUnreadMessagesCount(userId: string): Promise<number> {
    const conversations = await Chat.find({
      participants: userId,
      isActive: true
    });

    let totalUnread = 0;
    for (const conversation of conversations) {
      for (const message of conversation.messages) {
        if (!message.isRead.includes(userId) && message.senderId.toString() !== userId) {
          totalUnread++;
        }
      }
    }

    return totalUnread;
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
    const messageData: SendMessageDto = {
      senderId,
      content: fileName || 'File attachment',
      type: 'file',
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
  async updateConversationStatus(conversationId: string, status: string): Promise<ApiResponseDto> {
    const validStatuses = ['active', 'archived', 'closed'];
    
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid conversation status');
    }

    const conversation = await Chat.findByIdAndUpdate(
      conversationId,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    return {
      success: true,
      message: `Conversation status updated to ${status}`,
      data: conversation
    };
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string, userId: string): Promise<ApiResponseDto> {
    const conversation = await Chat.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found or you do not have permission');
    }

    // Add user to archived list if not already there
    if (!conversation.archivedBy) {
      conversation.archivedBy = [];
    }

    if (!conversation.archivedBy.includes(userId)) {
      conversation.archivedBy.push(userId);
    }

    await conversation.save();

    return {
      success: true,
      message: 'Conversation archived successfully'
    };
  }

  /**
   * Unarchive conversation
   */
  async unarchiveConversation(conversationId: string, userId: string): Promise<ApiResponseDto> {
    const conversation = await Chat.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found or you do not have permission');
    }

    // Remove user from archived list
    if (conversation.archivedBy) {
      conversation.archivedBy = conversation.archivedBy.filter(id => id.toString() !== userId);
    }

    await conversation.save();

    return {
      success: true,
      message: 'Conversation unarchived successfully'
    };
  }

  /**
   * Join conversation (for real-time features)
   */
  async joinConversation(conversationId: string, userId: string): Promise<void> {
    // This would typically integrate with Socket.IO or similar
    console.log(`User ${userId} joined conversation ${conversationId}`);
  }

  /**
   * Leave conversation (for real-time features)
   */
  async leaveConversation(conversationId: string, userId: string): Promise<void> {
    // This would typically integrate with Socket.IO or similar
    console.log(`User ${userId} left conversation ${conversationId}`);
  }

  /**
   * Update typing status (for real-time features)
   */
  async updateTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    // This would typically integrate with Socket.IO or similar
    console.log(`User ${userId} ${isTyping ? 'started' : 'stopped'} typing in conversation ${conversationId}`);
  }

  /**
   * Report message
   */
  async reportMessage(messageId: string, reporterId: string, reason: string): Promise<ApiResponseDto> {
    const conversation = await Chat.findOne({
      'messages._id': messageId
    });

    if (!conversation) {
      throw new NotFoundError('Message not found');
    }

    const message = conversation.messages.id(messageId);
    
    if (!message.reports) {
      message.reports = [];
    }

    // Check if user already reported this message
    const existingReport = message.reports.find(report => report.reporterId.toString() === reporterId);
    if (existingReport) {
      throw new ValidationError('You have already reported this message');
    }

    message.reports.push({
      reporterId,
      reason,
      reportedAt: new Date()
    });

    message.isFlagged = true;
    await conversation.save();

    return {
      success: true,
      message: 'Message reported successfully'
    };
  }

  /**
   * Block user
   */
  async blockUser(userId: string, blockedUserId: string): Promise<ApiResponseDto> {
    if (userId === blockedUserId) {
      throw new ValidationError('You cannot block yourself');
    }

    // Verify both users exist
    await this.userService.getUserById(userId);
    await this.userService.getUserById(blockedUserId);

    const user = await User.findById(userId);
    
    if (!user.blockedUsers) {
      user.blockedUsers = [];
    }

    if (!user.blockedUsers.includes(blockedUserId)) {
      user.blockedUsers.push(blockedUserId);
      await user.save();
    }

    return {
      success: true,
      message: 'User blocked successfully'
    };
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string, blockedUserId: string): Promise<ApiResponseDto> {
    const user = await User.findById(userId);
    
    if (user.blockedUsers) {
      user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== blockedUserId);
      await user.save();
    }

    return {
      success: true,
      message: 'User unblocked successfully'
    };
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userId: string): Promise<string[]> {
    const user = await User.findById(userId).select('blockedUsers');
    return user?.blockedUsers || [];
  }

  // Private helper methods
  private async getUnreadMessagesCountForConversation(conversationId: string, userId: string): Promise<number> {
    const conversation = await Chat.findById(conversationId);
    
    if (!conversation) {
      return 0;
    }

    let unreadCount = 0;
    for (const message of conversation.messages) {
      if (!message.isRead.includes(userId) && message.senderId.toString() !== userId) {
        unreadCount++;
      }
    }

    return unreadCount;
  }
}

