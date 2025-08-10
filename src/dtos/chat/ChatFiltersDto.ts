export interface ChatFiltersDto {
  // Pagination
  page?: number;
  limit?: number;
  
  // Conversation filters
  conversationId?: string;
  userId?: string;
  type?: 'direct' | 'group' | 'support';
  status?: 'active' | 'archived' | 'deleted';
  
  // Message filters
  senderId?: string;
  messageType?: 'text' | 'image' | 'file' | 'location' | 'system';
  hasAttachments?: boolean;
  isRead?: boolean;
  
  // Search
  search?: string; // Search in message content
  
  // Date filters
  dateFrom?: Date;
  dateTo?: Date;
  
  // Sorting
  sortBy?: 'createdAt' | 'updatedAt' | 'lastMessage';
  sortOrder?: 'asc' | 'desc';
}

