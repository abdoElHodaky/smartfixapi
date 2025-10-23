/**
 * Message Creation DTO
 * 
 * Input DTO for creating new messages
 */

export interface MessageCreationDto {
  chatId: string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'location' | 'system';
  attachments?: Array<{
    url: string;
    type: string;
    name?: string;
    size?: number;
    mimeType?: string;
  }>;
  replyTo?: string; // Message ID being replied to
  mentions?: Array<{
    userId: string;
    position: number;
  }>;
  scheduledFor?: Date; // For scheduled messages
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: {
    [key: string]: any;
  };
}

