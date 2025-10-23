export interface AdminStatsDto {
  // User Statistics
  users: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    growthRate: number;
  };
  
  // Provider Statistics
  providers: {
    total: number;
    verified: number;
    pending: number;
    active: number;
    newThisMonth: number;
    averageRating: number;
  };
  
  // Service Request Statistics
  serviceRequests: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    thisMonth: number;
    completionRate: number;
  };
  
  // Review Statistics
  reviews: {
    total: number;
    thisMonth: number;
    averageRating: number;
    flagged: number;
    pending: number;
  };
  
  // Financial Statistics
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
    averageOrderValue: number;
  };
  
  // System Statistics
  system: {
    uptime: number;
    activeConnections: number;
    apiCalls: number;
    errorRate: number;
    responseTime: number;
  };
  
  // Activity Statistics
  activity: {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    newRegistrations: number;
    completedServices: number;
  };
}

