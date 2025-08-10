export interface SendMessageDto {
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'location' | 'system';
  attachments?: {
    url: string;
    type: string;
    name?: string;
    size?: number;
  }[];
  replyTo?: string; // Message ID being replied to
  metadata?: {
    [key: string]: any;
  };
}

