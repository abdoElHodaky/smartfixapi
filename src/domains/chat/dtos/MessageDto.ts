/**
 * Message DTO
 * 
 * Represents a message entity for API responses
 */

export interface MessageDto {
  id: string;
  chatId: string;
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
    mimeType?: string;
  }>;
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  reactions?: Array<{
    emoji: string;
    count: number;
    users: Array<{
      userId: string;
      username: string;
    }>;
  }>;
  mentions?: Array<{
    userId: string;
    username: string;
    position: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  isEdited: boolean;
  isDeleted: boolean;
  deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: {
    [key: string]: any;
  };
}

