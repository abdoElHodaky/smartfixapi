/**
 * Message List DTO
 * 
 * Represents a paginated list of messages for API responses
 */

export interface MessageListDto {
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'location' | 'system';
    attachments?: Array<{
      id: string;
      url: string;
      type: string;
      name: string;
      size: number;
    }>;
    replyTo?: {
      messageId: string;
      content: string;
      senderName: string;
    };
    reactions?: Array<{
      emoji: string;
      count: number;
    }>;
    createdAt: Date;
    isEdited: boolean;
    deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  chatInfo: {
    id: string;
    title?: string;
    type: 'direct' | 'group' | 'support' | 'public' | 'private';
    participantCount: number;
  };
}

