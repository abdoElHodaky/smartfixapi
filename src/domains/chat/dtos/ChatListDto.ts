/**
 * Chat List DTO
 * 
 * Represents a paginated list of chats for API responses
 */

export interface ChatListDto {
  chats: Array<{
    id: string;
    title?: string;
    type: 'direct' | 'group' | 'support' | 'public' | 'private';
    participantCount: number;
    lastMessage?: {
      id: string;
      content: string;
      senderId: string;
      senderName: string;
      timestamp: Date;
      type: 'text' | 'image' | 'file' | 'location' | 'system';
    };
    unreadCount: number;
    updatedAt: Date;
    isArchived: boolean;
    isMuted: boolean;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters?: {
    type?: string;
    search?: string;
    archived?: boolean;
    unreadOnly?: boolean;
  };
}

