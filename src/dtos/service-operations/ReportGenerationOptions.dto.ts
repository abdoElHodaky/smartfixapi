/**
 * Report Generation Options DTOs
 * 
 * Structured DTOs for report generation operations to replace
 * complex method signatures with well-defined options objects.
 */

import { IsString, IsOptional, IsObject, IsEnum, IsBoolean, IsArray, IsDate, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DateRangeFilter } from '../../utils/service-optimization/FilterBuilder';

/**
 * Report types available in the system
 */
export enum ReportType {
  USER_ACTIVITY = 'user_activity',
  PROVIDER_PERFORMANCE = 'provider_performance',
  SERVICE_REQUESTS = 'service_requests',
  REVENUE = 'revenue',
  PLATFORM_STATISTICS = 'platform_statistics',
  CUSTOM = 'custom'
}

/**
 * Report output formats
 */
export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  XLSX = 'xlsx'
}

/**
 * Report aggregation levels
 */
export enum AggregationLevel {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

/**
 * User activity report specific options
 */
export class UserActivityReportOptions {
  @IsOptional()
  @IsArray()
  userTypes?: string[]; // ['customer', 'provider', 'admin']

  @IsOptional()
  @IsArray()
  activityTypes?: string[]; // ['login', 'registration', 'profile_update', etc.]

  @IsOptional()
  @IsBoolean()
  includeInactiveUsers?: boolean = false;

  @IsOptional()
  @IsEnum(AggregationLevel)
  aggregationLevel?: AggregationLevel = AggregationLevel.DAILY;
}

/**
 * Provider performance report specific options
 */
export class ProviderPerformanceReportOptions {
  @IsOptional()
  @IsArray()
  providerIds?: string[];

  @IsOptional()
  @IsArray()
  serviceTypes?: string[];

  @IsOptional()
  @IsBoolean()
  includeRatings?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeEarnings?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeCompletionRates?: boolean = true;

  @IsOptional()
  @IsNumber()
  minRating?: number;

  @IsOptional()
  @IsNumber()
  minCompletedRequests?: number;
}

/**
 * Service requests report specific options
 */
export class ServiceRequestsReportOptions {
  @IsOptional()
  @IsArray()
  statuses?: string[]; // ['pending', 'in_progress', 'completed', 'cancelled']

  @IsOptional()
  @IsArray()
  serviceTypes?: string[];

  @IsOptional()
  @IsBoolean()
  includeProviderInfo?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeCustomerInfo?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includePricing?: boolean = true;

  @IsOptional()
  @IsEnum(AggregationLevel)
  aggregationLevel?: AggregationLevel = AggregationLevel.DAILY;
}

/**
 * Revenue report specific options
 */
export class RevenueReportOptions {
  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsOptional()
  @IsBoolean()
  includeCommissions?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeRefunds?: boolean = true;

  @IsOptional()
  @IsBoolean()
  groupByProvider?: boolean = false;

  @IsOptional()
  @IsBoolean()
  groupByService?: boolean = false;

  @IsOptional()
  @IsEnum(AggregationLevel)
  aggregationLevel?: AggregationLevel = AggregationLevel.MONTHLY;
}

/**
 * Custom report options
 */
export class CustomReportOptions {
  @IsString()
  queryName: string;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @IsOptional()
  @IsArray()
  requiredFields?: string[];

  @IsOptional()
  @IsArray()
  optionalFields?: string[];
}

/**
 * Main report generation options DTO
 */
export class ReportGenerationOptions {
  @IsString()
  adminId: string;

  @IsEnum(ReportType)
  reportType: ReportType;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeFilter)
  dateRange?: DateRangeFilter;

  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat = ReportFormat.JSON;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  includeFields?: string[];

  @IsOptional()
  @IsArray()
  excludeFields?: string[];

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean = false;

  @IsOptional()
  @IsNumber()
  maxRecords?: number = 10000;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  specificOptions?: UserActivityReportOptions | ProviderPerformanceReportOptions | 
                   ServiceRequestsReportOptions | RevenueReportOptions | CustomReportOptions;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  constructor(
    adminId: string,
    reportType: ReportType,
    options?: {
      dateRange?: DateRangeFilter;
      format?: ReportFormat;
      title?: string;
      description?: string;
      includeFields?: string[];
      excludeFields?: string[];
      filters?: Record<string, any>;
      includeMetadata?: boolean;
      includeCharts?: boolean;
      maxRecords?: number;
      specificOptions?: any;
      metadata?: Record<string, any>;
    }
  ) {
    this.adminId = adminId;
    this.reportType = reportType;
    this.dateRange = options?.dateRange;
    this.format = options?.format || ReportFormat.JSON;
    this.title = options?.title;
    this.description = options?.description;
    this.includeFields = options?.includeFields;
    this.excludeFields = options?.excludeFields;
    this.filters = options?.filters;
    this.includeMetadata = options?.includeMetadata ?? true;
    this.includeCharts = options?.includeCharts ?? false;
    this.maxRecords = options?.maxRecords || 10000;
    this.specificOptions = options?.specificOptions;
    this.metadata = options?.metadata;
  }

  /**
   * Create user activity report options
   */
  static userActivity(
    adminId: string,
    dateRange?: DateRangeFilter,
    specificOptions?: UserActivityReportOptions
  ): ReportGenerationOptions {
    return new ReportGenerationOptions(adminId, ReportType.USER_ACTIVITY, {
      dateRange,
      specificOptions,
      title: 'User Activity Report'
    });
  }

  /**
   * Create provider performance report options
   */
  static providerPerformance(
    adminId: string,
    dateRange?: DateRangeFilter,
    specificOptions?: ProviderPerformanceReportOptions
  ): ReportGenerationOptions {
    return new ReportGenerationOptions(adminId, ReportType.PROVIDER_PERFORMANCE, {
      dateRange,
      specificOptions,
      title: 'Provider Performance Report'
    });
  }

  /**
   * Create service requests report options
   */
  static serviceRequests(
    adminId: string,
    dateRange?: DateRangeFilter,
    specificOptions?: ServiceRequestsReportOptions
  ): ReportGenerationOptions {
    return new ReportGenerationOptions(adminId, ReportType.SERVICE_REQUESTS, {
      dateRange,
      specificOptions,
      title: 'Service Requests Report'
    });
  }

  /**
   * Create revenue report options
   */
  static revenue(
    adminId: string,
    dateRange?: DateRangeFilter,
    specificOptions?: RevenueReportOptions
  ): ReportGenerationOptions {
    return new ReportGenerationOptions(adminId, ReportType.REVENUE, {
      dateRange,
      specificOptions,
      title: 'Revenue Report'
    });
  }

  /**
   * Create platform statistics report options
   */
  static platformStatistics(
    adminId: string,
    dateRange?: DateRangeFilter
  ): ReportGenerationOptions {
    return new ReportGenerationOptions(adminId, ReportType.PLATFORM_STATISTICS, {
      dateRange,
      title: 'Platform Statistics Report'
    });
  }

  /**
   * Create custom report options
   */
  static custom(
    adminId: string,
    customOptions: CustomReportOptions,
    dateRange?: DateRangeFilter
  ): ReportGenerationOptions {
    return new ReportGenerationOptions(adminId, ReportType.CUSTOM, {
      dateRange,
      specificOptions: customOptions,
      title: `Custom Report: ${customOptions.queryName}`
    });
  }

  /**
   * Create from query parameters
   */
  static fromQuery(adminId: string, query: any): ReportGenerationOptions {
    const dateRange = query.from || query.to ? new DateRangeFilter(
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined
    ) : undefined;

    return new ReportGenerationOptions(adminId, query.reportType || ReportType.PLATFORM_STATISTICS, {
      dateRange,
      format: query.format || ReportFormat.JSON,
      title: query.title,
      description: query.description,
      includeFields: query.include ? query.include.split(',') : undefined,
      excludeFields: query.exclude ? query.exclude.split(',') : undefined,
      filters: query.filters ? JSON.parse(query.filters) : undefined,
      includeMetadata: query.includeMetadata !== 'false',
      includeCharts: query.includeCharts === 'true',
      maxRecords: query.maxRecords ? parseInt(query.maxRecords) : 10000
    });
  }

  /**
   * Validate the report options
   */
  isValid(): boolean {
    // Basic validation
    if (!this.adminId || !this.reportType) {
      return false;
    }

    // Validate date range if provided
    if (this.dateRange && !this.dateRange.isValid()) {
      return false;
    }

    // Validate specific options based on report type
    if (this.reportType === ReportType.CUSTOM && !this.specificOptions) {
      return false;
    }

    return true;
  }

  /**
   * Get typed specific options for different report types
   */
  getUserActivityOptions(): UserActivityReportOptions | undefined {
    return this.reportType === ReportType.USER_ACTIVITY ? this.specificOptions as UserActivityReportOptions : undefined;
  }

  getProviderPerformanceOptions(): ProviderPerformanceReportOptions | undefined {
    return this.reportType === ReportType.PROVIDER_PERFORMANCE ? this.specificOptions as ProviderPerformanceReportOptions : undefined;
  }

  getServiceRequestsOptions(): ServiceRequestsReportOptions | undefined {
    return this.reportType === ReportType.SERVICE_REQUESTS ? this.specificOptions as ServiceRequestsReportOptions : undefined;
  }

  getRevenueOptions(): RevenueReportOptions | undefined {
    return this.reportType === ReportType.REVENUE ? this.specificOptions as RevenueReportOptions : undefined;
  }

  getCustomOptions(): CustomReportOptions | undefined {
    return this.reportType === ReportType.CUSTOM ? this.specificOptions as CustomReportOptions : undefined;
  }
}
