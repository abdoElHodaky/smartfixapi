/**
 * Message Operation Input Interface
 * 
 * Defines the input structure for message-related operations
 */

export interface MessageOperationInput {
  messageId: string;
  roomId: string;
  userId: string;
  action: 'send' | 'edit' | 'delete' | 'react' | 'forward';
  content?: {
    text?: string;
    attachments?: Array<{
      type: 'image' | 'file' | 'video' | 'audio';
      url: string;
      name: string;
      size: number;
    }>;
    mentions?: string[];
    replyTo?: string;
  };
  metadata?: {
    timestamp: Date;
    source: string;
    requestId: string;
    edited?: boolean;
    editHistory?: Array<{
      timestamp: Date;
      content: string;
    }>;
  };
}

export interface MessageReactionInput extends MessageOperationInput {
  action: 'react';
  reaction: {
    emoji: string;
    add: boolean; // true to add, false to remove
  };
}

