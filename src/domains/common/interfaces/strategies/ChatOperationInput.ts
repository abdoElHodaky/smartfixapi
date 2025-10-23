/**
 * Chat Operation Input Interface
 * 
 * Defines the input structure for chat-related operations
 */

export interface ChatOperationInput {
  chatId: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'moderate';
  data?: {
    title?: string;
    description?: string;
    participants?: string[];
    settings?: Record<string, any>;
  };
  metadata?: {
    timestamp: Date;
    source: string;
    requestId: string;
  };
}

export interface ChatModerationInput extends ChatOperationInput {
  action: 'moderate';
  moderationData: {
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    autoAction?: 'warn' | 'mute' | 'ban' | 'delete';
  };
}

