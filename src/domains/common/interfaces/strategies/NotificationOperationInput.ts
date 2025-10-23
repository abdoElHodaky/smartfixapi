/**
 * Notification Operation Input Interface
 * 
 * Defines the input structure for notification-related operations
 */

export interface NotificationOperationInput {
  recipientId: string;
  senderId?: string;
  type: 'message' | 'mention' | 'reaction' | 'invite' | 'system' | 'alert';
  action: 'send' | 'mark_read' | 'mark_unread' | 'delete' | 'batch_send';
  content: {
    title: string;
    body: string;
    data?: Record<string, any>;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };
  channels?: Array<'push' | 'email' | 'sms' | 'in_app'>;
  scheduling?: {
    sendAt?: Date;
    timezone?: string;
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      endDate?: Date;
    };
  };
  metadata?: {
    timestamp: Date;
    source: string;
    requestId: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
  };
}

export interface BatchNotificationInput {
  recipientIds: string[];
  notification: Omit<NotificationOperationInput, 'recipientId' | 'action'>;
  batchSettings?: {
    maxConcurrent: number;
    delayBetweenSends: number;
    failureHandling: 'continue' | 'stop' | 'retry';
  };
}

