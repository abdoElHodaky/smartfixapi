/**
 * System Statistics DTOs
 * 
 * Interface definitions for system monitoring and statistics
 */

export interface SystemHealthDto {
  uptime: number;
  activeConnections: number;
  apiCalls: number;
  errorRate: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface DatabaseStatsDto {
  totalRecords: number;
  totalSize: number;
  queryTime: number;
  connections: number;
}

export interface ActivityStatsDto {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  newRegistrations: number;
  completedServices: number;
  totalSessions: number;
  averageSessionDuration: number;
}

export interface PerformanceMetricsDto {
  averageLoadTime: number;
  peakConcurrentUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cacheHitRate: number;
}

export interface SystemStatsDto {
  health: SystemHealthDto;
  database: DatabaseStatsDto;
  activity: ActivityStatsDto;
  performance: PerformanceMetricsDto;
  lastUpdated: string;
  version?: string;
  environment?: string;
}
