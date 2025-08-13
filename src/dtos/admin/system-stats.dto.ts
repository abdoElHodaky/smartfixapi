import { IsNumber, IsOptional, ValidateNested, IsObject, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class SystemHealthDto {
  @IsNumber()
  uptime: number;

  @IsNumber()
  activeConnections: number;

  @IsNumber()
  apiCalls: number;

  @IsNumber()
  errorRate: number;

  @IsNumber()
  responseTime: number;

  @IsNumber()
  memoryUsage: number;

  @IsNumber()
  cpuUsage: number;
}

class DatabaseStatsDto {
  @IsNumber()
  totalRecords: number;

  @IsNumber()
  totalSize: number;

  @IsNumber()
  queryTime: number;

  @IsNumber()
  connections: number;
}

class ActivityStatsDto {
  @IsNumber()
  dailyActiveUsers: number;

  @IsNumber()
  monthlyActiveUsers: number;

  @IsNumber()
  newRegistrations: number;

  @IsNumber()
  completedServices: number;

  @IsNumber()
  totalSessions: number;

  @IsNumber()
  averageSessionDuration: number;
}

class PerformanceMetricsDto {
  @IsNumber()
  averageLoadTime: number;

  @IsNumber()
  peakConcurrentUsers: number;

  @IsNumber()
  totalRequests: number;

  @IsNumber()
  successfulRequests: number;

  @IsNumber()
  failedRequests: number;

  @IsNumber()
  cacheHitRate: number;
}

export class SystemStatsDto {
  @ValidateNested()
  @Type(() => SystemHealthDto)
  @IsObject()
  health: SystemHealthDto;

  @ValidateNested()
  @Type(() => DatabaseStatsDto)
  @IsObject()
  database: DatabaseStatsDto;

  @ValidateNested()
  @Type(() => ActivityStatsDto)
  @IsObject()
  activity: ActivityStatsDto;

  @ValidateNested()
  @Type(() => PerformanceMetricsDto)
  @IsObject()
  performance: PerformanceMetricsDto;

  @IsDateString()
  lastUpdated: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  environment?: string;
}

