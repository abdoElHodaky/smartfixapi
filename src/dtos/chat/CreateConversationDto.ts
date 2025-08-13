export interface CreateConversationDto {
  participants: string[]; // Array of user IDs
  type: 'direct' | 'group' | 'support';
  title?: string; // For group conversations
  description?: string;
  serviceRequestId?: string; // If conversation is related to a service request
  metadata?: {
    [key: string]: any;
  };
}

