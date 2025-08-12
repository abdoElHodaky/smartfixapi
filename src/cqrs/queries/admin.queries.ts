/**
 * Admin Queries for CQRS Pattern
 * 
 * Query definitions for admin operations (read operations)
 */

import { Query } from '../types';

// Dashboard Queries
export class GetAdminDashboardQuery implements Query {
  readonly type = 'GET_ADMIN_DASHBOARD';
  
  constructor(
    public readonly payload: {
      adminId: string;
      includeRecentActivity?: boolean;
      includeStatistics?: boolean;
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

export class GetPlatformStatisticsQuery implements Query {
  readonly type = 'GET_PLATFORM_STATISTICS';
  
  constructor(
    public readonly payload: {
      adminId: string;
      dateRange?: {
        from: Date;
        to: Date;
      };
      includeGrowthMetrics?: boolean;
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

// User Queries
export class GetAllUsersQuery implements Query {
  readonly type = 'GET_ALL_USERS';
  
  constructor(
    public readonly payload: {
      adminId: string;
      page?: number;
      limit?: number;
      filters?: {
        status?: string;
        role?: string;
        searchTerm?: string;
        dateRange?: {
          from: Date;
          to: Date;
        };
      };
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
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

export class GetUserDetailsQuery implements Query {
  readonly type = 'GET_USER_DETAILS';
  
  constructor(
    public readonly payload: {
      adminId: string;
      userId: string;
      includeActivity?: boolean;
      includeServiceRequests?: boolean;
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

export class GetUserStatisticsQuery implements Query {
  readonly type = 'GET_USER_STATISTICS';
  
  constructor(
    public readonly payload: {
      adminId: string;
      dateRange?: {
        from: Date;
        to: Date;
      };
      groupBy?: 'day' | 'week' | 'month';
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

// Provider Queries
export class GetAllProvidersQuery implements Query {
  readonly type = 'GET_ALL_PROVIDERS';
  
  constructor(
    public readonly payload: {
      adminId: string;
      page?: number;
      limit?: number;
      filters?: {
        status?: string;
        services?: string[];
        searchTerm?: string;
        rating?: {
          min?: number;
          max?: number;
        };
        dateRange?: {
          from: Date;
          to: Date;
        };
      };
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
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

export class GetProviderDetailsQuery implements Query {
  readonly type = 'GET_PROVIDER_DETAILS';
  
  constructor(
    public readonly payload: {
      adminId: string;
      providerId: string;
      includeReviews?: boolean;
      includeServiceRequests?: boolean;
      includeEarnings?: boolean;
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

export class GetProviderStatisticsQuery implements Query {
  readonly type = 'GET_PROVIDER_STATISTICS';
  
  constructor(
    public readonly payload: {
      adminId: string;
      dateRange?: {
        from: Date;
        to: Date;
      };
      groupBy?: 'day' | 'week' | 'month';
      includePerformanceMetrics?: boolean;
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

// Service Request Queries
export class GetAllServiceRequestsQuery implements Query {
  readonly type = 'GET_ALL_SERVICE_REQUESTS';
  
  constructor(
    public readonly payload: {
      adminId: string;
      page?: number;
      limit?: number;
      filters?: {
        status?: string;
        category?: string;
        priority?: string;
        dateRange?: {
          from: Date;
          to: Date;
        };
        providerId?: string;
        customerId?: string;
      };
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
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

export class GetServiceRequestStatisticsQuery implements Query {
  readonly type = 'GET_SERVICE_REQUEST_STATISTICS';
  
  constructor(
    public readonly payload: {
      adminId: string;
      dateRange?: {
        from: Date;
        to: Date;
      };
      groupBy?: 'day' | 'week' | 'month';
      includeCompletionRates?: boolean;
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

// Review Queries
export class GetAllReviewsQuery implements Query {
  readonly type = 'GET_ALL_REVIEWS';
  
  constructor(
    public readonly payload: {
      adminId: string;
      page?: number;
      limit?: number;
      filters?: {
        rating?: {
          min?: number;
          max?: number;
        };
        flagged?: boolean;
        providerId?: string;
        customerId?: string;
        dateRange?: {
          from: Date;
          to: Date;
        };
      };
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
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

export class GetReviewStatisticsQuery implements Query {
  readonly type = 'GET_REVIEW_STATISTICS';
  
  constructor(
    public readonly payload: {
      adminId: string;
      dateRange?: {
        from: Date;
        to: Date;
      };
      includeRatingDistribution?: boolean;
      includeFlaggedCount?: boolean;
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

// Content Moderation Queries
export class GetFlaggedContentQuery implements Query {
  readonly type = 'GET_FLAGGED_CONTENT';
  
  constructor(
    public readonly payload: {
      adminId: string;
      contentType?: 'review' | 'user' | 'provider' | 'all';
      severity?: 'low' | 'medium' | 'high';
      page?: number;
      limit?: number;
      dateRange?: {
        from: Date;
        to: Date;
      };
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

// Report Queries
export class GenerateReportQuery implements Query {
  readonly type = 'GENERATE_REPORT';
  
  constructor(
    public readonly payload: {
      adminId: string;
      reportType: 'user_activity' | 'provider_performance' | 'service_requests' | 'revenue' | 'platform_overview';
      dateRange?: {
        from: Date;
        to: Date;
      };
      format?: 'json' | 'csv' | 'pdf';
      filters?: any;
      includeCharts?: boolean;
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

// Search Queries
export class SearchQuery implements Query {
  readonly type = 'SEARCH';
  
  constructor(
    public readonly payload: {
      adminId: string;
      searchTerm: string;
      searchType: 'users' | 'providers' | 'service_requests' | 'reviews' | 'all';
      page?: number;
      limit?: number;
      filters?: any;
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

// System Queries
export class GetSystemConfigQuery implements Query {
  readonly type = 'GET_SYSTEM_CONFIG';
  
  constructor(
    public readonly payload: {
      adminId: string;
      configKey?: string;
      category?: string;
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

export class GetAuditLogQuery implements Query {
  readonly type = 'GET_AUDIT_LOG';
  
  constructor(
    public readonly payload: {
      adminId: string;
      page?: number;
      limit?: number;
      filters?: {
        action?: string;
        userId?: string;
        dateRange?: {
          from: Date;
          to: Date;
        };
      };
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

