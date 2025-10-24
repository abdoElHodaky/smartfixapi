/**
 * Admin Report DTOs
 * 
 * Interface definitions for admin reporting functionality
 */

export enum ReportType {
  USER_ACTIVITY = 'user_activity',
  PROVIDER_PERFORMANCE = 'provider_performance',
  REVENUE = 'revenue',
  SERVICE_REQUESTS = 'service_requests',
  SYSTEM_PERFORMANCE = 'system_performance',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  EXCEL = 'excel'
}

export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

export interface ReportDataDto {
  label: string;
  value: number;
  unit?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'stable';
}

export interface ReportMetricsDto {
  name: string;
  data: ReportDataDto[];
  description?: string;
}

export interface AdminReportDto {
  id: string;
  title: string;
  type: ReportType;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  metrics: ReportMetricsDto[];
  summary?: string;
  generatedAt: string;
  generatedBy: string;
  tags?: string[];
  filters?: Record<string, any>;
}

export interface GenerateReportDto {
  title: string;
  type: ReportType;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  format?: ReportFormat;
  metrics?: string[];
  filters?: Record<string, any>;
  tags?: string[];
}

export interface ReportSearchDto {
  search?: string;
  type?: ReportType;
  startDate?: string;
  endDate?: string;
  generatedBy?: string;
  page?: number;
  limit?: number;
}
