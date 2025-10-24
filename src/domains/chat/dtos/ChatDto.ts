/**
 * Chat DTO
 * 
 * Represents a chat/conversation entity for API responses
 */

export interface ChatDto {
  id: string;
  title?: string;
  description?: string;
  type: 'direct' | 'group' | 'support' | 'public' | 'private';
  participants: Array<{
    userId: string;
    username: string;
    role: 'member' | 'admin' | 'moderator';
    joinedAt: Date;
    lastSeen?: Date;
  }>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    type: 'text' | 'image' | 'file' | 'location' | 'system';
  };
  unreadCount: number;
  settings: {
    allowInvites: boolean;
    allowFileSharing: boolean;
    allowVoiceMessages: boolean;
    moderationLevel: 'none' | 'basic' | 'strict';
    maxParticipants?: number;
  };
  metadata?: {
    [key: string]: any;
  };
}

