import {
  CreateConversationDto,
  SendMessageDto,
  ChatFiltersDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

export interface IChatService {
  // Conversation Management
  createConversation(data: CreateConversationDto): Promise<ApiResponseDto>;
  getConversationById(conversationId: string): Promise<any>;
  getUserConversations(userId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;
  deleteConversation(conversationId: string, userId: string): Promise<ApiResponseDto>;
  
  // Message Management
  sendMessage(conversationId: string, messageData: SendMessageDto): Promise<ApiResponseDto>;
  getMessages(conversationId: string, page?: number, limit?: number): Promise<PaginatedResponseDto<any>>;
  markMessageAsRead(messageId: string, userId: string): Promise<ApiResponseDto>;
  markConversationAsRead(conversationId: string, userId: string): Promise<ApiResponseDto>;
  deleteMessage(messageId: string, userId: string): Promise<ApiResponseDto>;
  
  // Message Search and Filtering
  searchMessages(filters: ChatFiltersDto): Promise<PaginatedResponseDto<any>>;
  getUnreadMessagesCount(userId: string): Promise<number>;
  
  // File and Media Support
  sendFileMessage(conversationId: string, senderId: string, fileUrl: string, fileType: string, fileName?: string): Promise<ApiResponseDto>;
  
  // Conversation Status
  updateConversationStatus(conversationId: string, status: string): Promise<ApiResponseDto>;
  archiveConversation(conversationId: string, userId: string): Promise<ApiResponseDto>;
  unarchiveConversation(conversationId: string, userId: string): Promise<ApiResponseDto>;
  
  // Real-time Features
  joinConversation(conversationId: string, userId: string): Promise<void>;
  leaveConversation(conversationId: string, userId: string): Promise<void>;
  updateTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void>;
  
  // Moderation
  reportMessage(messageId: string, reporterId: string, reason: string): Promise<ApiResponseDto>;
  blockUser(userId: string, blockedUserId: string): Promise<ApiResponseDto>;
  unblockUser(userId: string, blockedUserId: string): Promise<ApiResponseDto>;
  getBlockedUsers(userId: string): Promise<string[]>;
}

