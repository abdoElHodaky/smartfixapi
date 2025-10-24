/**
 * Chat Creation DTO
 * 
 * Input DTO for creating new chats/conversations
 */

export interface ChatCreationDto {
  title?: string;
  description?: string;
  type: 'direct' | 'group' | 'support' | 'public' | 'private';
  participants: string[]; // Array of user IDs
  settings?: {
    allowInvites?: boolean;
    allowFileSharing?: boolean;
    allowVoiceMessages?: boolean;
    moderationLevel?: 'none' | 'basic' | 'strict';
    maxParticipants?: number;
  };
  initialMessage?: {
    content: string;
    type?: 'text' | 'image' | 'file' | 'location' | 'system';
    attachments?: Array<{
      url: string;
      type: string;
      name?: string;
      size?: number;
    }>;
  };
  serviceRequestId?: string; // If conversation is related to a service request
  metadata?: {
    [key: string]: any;
  };
}

