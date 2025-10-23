/**
 * Room Operation Input Interface
 * 
 * Defines the input structure for room-related operations
 */

export interface RoomOperationInput {
  roomId: string;
  userId: string;
  action: 'create' | 'join' | 'leave' | 'update' | 'delete' | 'invite';
  roomData?: {
    name?: string;
    description?: string;
    type: 'public' | 'private' | 'direct' | 'group';
    maxParticipants?: number;
    settings?: {
      allowInvites: boolean;
      allowFileSharing: boolean;
      allowVoiceMessages: boolean;
      moderationLevel: 'none' | 'basic' | 'strict';
    };
  };
  participants?: string[];
  inviteData?: {
    inviteeIds: string[];
    message?: string;
    expiresAt?: Date;
  };
  metadata?: {
    timestamp: Date;
    source: string;
    requestId: string;
  };
}

export interface RoomInviteInput extends RoomOperationInput {
  action: 'invite';
  inviteData: {
    inviteeIds: string[];
    message?: string;
    expiresAt?: Date;
    permissions?: Array<'read' | 'write' | 'admin'>;
  };
}

