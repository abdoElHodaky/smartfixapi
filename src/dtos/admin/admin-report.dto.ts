import { IsString, IsOptional, IsDateString, IsEnum, IsArray, ValidateNested, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

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

class ReportDataDto {
  @IsString()
  label: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  change?: number;

  @IsOptional()
  @IsString()
  changeType?: 'increase' | 'decrease' | 'stable';
}

class ReportMetricsDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportDataDto)
  data: ReportDataDto[];

  @IsOptional()
  @IsString()
  description?: string;
}

export class AdminReportDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsEnum(ReportType)
  type: ReportType;

  @IsEnum(ReportPeriod)
  period: ReportPeriod;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportMetricsDto)
  metrics: ReportMetricsDto[];

  @IsOptional()
  @IsString()
  summary?: string;

  @IsDateString()
  generatedAt: string;

  @IsString()
  generatedBy: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}

export class GenerateReportDto {
  @IsString()
  title: string;

  @IsEnum(ReportType)
  type: ReportType;

  @IsEnum(ReportPeriod)
  period: ReportPeriod;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ReportSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  generatedBy?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

