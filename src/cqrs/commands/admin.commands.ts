/**
 * Admin Commands for CQRS Pattern
 * 
 * Command definitions for admin operations (write operations)
 */

import { Command } from '../types';

// Provider Management Commands
export class ManageProviderCommand implements Command {
  readonly type = 'MANAGE_PROVIDER';
  
  constructor(
    public readonly payload: {
      adminId: string;
      providerId: string;
      action: 'approve' | 'reject' | 'suspend' | 'reactivate';
      data?: any;
      reason?: string;
    },
    public readonly metadata?: {
      userId: string;
      timestamp: Date;
      correlationId?: string;
    }
  ) {
    this.metadata = metadata || {
      userId: payload.adminId,
      timestamp: new Date()
    };
  }
}

export class ApproveProviderCommand implements Command {
  readonly type = 'APPROVE_PROVIDER';
  
  constructor(
    public readonly payload: {
      adminId: string;
      providerId: string;
      reason?: string;
    },
    public readonly metadata?: {
      userId: string;
      timestamp: Date;
      correlationId?: string;
    }
  ) {
    this.metadata = metadata || {
      userId: payload.adminId,
      timestamp: new Date()
    };
  }
}

export class RejectProviderCommand implements Command {
  readonly type = 'REJECT_PROVIDER';
  
  constructor(
    public readonly payload: {
      adminId: string;
      providerId: string;
      reason: string;
    },
    public readonly metadata?: {
      userId: string;
      timestamp: Date;
      correlationId?: string;
    }
  ) {
    this.metadata = metadata || {
      userId: payload.adminId,
      timestamp: new Date()
    };
  }
}

export class SuspendProviderCommand implements Command {
  readonly type = 'SUSPEND_PROVIDER';
  
  constructor(
    public readonly payload: {
      adminId: string;
      providerId: string;
      reason: string;
      duration?: string;
    },
    public readonly metadata?: {
      userId: string;
      timestamp: Date;
      correlationId?: string;
    }
  ) {
    this.metadata = metadata || {
      userId: payload.adminId,
      timestamp: new Date()
    };
  }
}

export class ReactivateProviderCommand implements Command {
  readonly type = 'REACTIVATE_PROVIDER';
  
  constructor(
    public readonly payload: {
      adminId: string;
      providerId: string;
      reason?: string;
    },
    public readonly metadata?: {
      userId: string;
      timestamp: Date;
      correlationId?: string;
    }
  ) {
    this.metadata = metadata || {
      userId: payload.adminId,
      timestamp: new Date()
    };
  }
}

// User Management Commands
export class ManageUserCommand implements Command {
  readonly type = 'MANAGE_USER';
  
  constructor(
    public readonly payload: {
      adminId: string;
      userId: string;
      action: 'activate' | 'deactivate' | 'suspend' | 'delete';
      reason?: string;
    },
    public readonly metadata?: {
      userId: string;
      timestamp: Date;
      correlationId?: string;
    }
  ) {
    this.metadata = metadata || {
      userId: payload.adminId,
      timestamp: new Date()
    };
  }
}

export class SuspendUserCommand implements Command {
  readonly type = 'SUSPEND_USER';
  
  constructor(
    public readonly payload: {
      adminId: string;
      userId: string;
      reason: string;
      duration?: string;
    },
    public readonly metadata?: {
      userId: string;
      timestamp: Date;
      correlationId?: string;
    }
  ) {
    this.metadata = metadata || {
      userId: payload.adminId,
      timestamp: new Date()
    };
  }
}

// Content Moderation Commands
export class FlagContentCommand implements Command {
  readonly type = 'FLAG_CONTENT';
  
  constructor(
    public readonly payload: {
      adminId: string;
      contentType: 'review' | 'user' | 'provider';
      contentId: string;
      reason: string;
      severity: 'low' | 'medium' | 'high';
    },
    public readonly metadata?: {
      userId: string;
      timestamp: Date;
      correlationId?: string;
    }
  ) {
    this.metadata = metadata || {
      userId: payload.adminId,
      timestamp: new Date()
    };
  }
}

export class UnflagContentCommand implements Command {
  readonly type = 'UNFLAG_CONTENT';
  
  constructor(
    public readonly payload: {
      adminId: string;
      contentType: 'review' | 'user' | 'provider';
      contentId: string;
      reason?: string;
    },
    public readonly metadata?: {
      userId: string;
      timestamp: Date;
      correlationId?: string;
    }
  ) {
    this.metadata = metadata || {
      userId: payload.adminId,
      timestamp: new Date()
    };
  }
}

// System Configuration Commands
export class UpdateSystemConfigCommand implements Command {
  readonly type = 'UPDATE_SYSTEM_CONFIG';
  
  constructor(
    public readonly payload: {
      adminId: string;
      configKey: string;
      configValue: any;
      description?: string;
    },
    public readonly metadata?: {
      userId: string;
      timestamp: Date;
      correlationId?: string;
    }
  ) {
    this.metadata = metadata || {
      userId: payload.adminId,
      timestamp: new Date()
    };
  }
}

// Notification Commands
export class SendNotificationCommand implements Command {
  readonly type = 'SEND_NOTIFICATION';
  
  constructor(
    public readonly payload: {
      adminId: string;
      recipientType: 'user' | 'provider' | 'all';
      recipientIds?: string[];
      title: string;
      message: string;
      type: 'info' | 'warning' | 'success' | 'error';
    },
    public readonly metadata?: {
      userId: string;
      timestamp: Date;
      correlationId?: string;
    }
  ) {
    this.metadata = metadata || {
      userId: payload.adminId,
      timestamp: new Date()
    };
  }
}

