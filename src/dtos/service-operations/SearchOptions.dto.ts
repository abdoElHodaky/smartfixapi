/**
 * Search Options DTOs
 * 
 * Structured DTOs for search operations to replace complex method signatures
 * with well-defined search configuration objects.
 */

import { IsString, IsOptional, IsObject, IsEnum, IsBoolean, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationOptions } from '../../utils/service-optimization/PaginationOptions';
import { SortOptions, DateRangeFilter } from '../../utils/service-optimization/FilterBuilder';

/**
 * Search scope types
 */
export enum SearchScope {
  USERS = 'users',
  PROVIDERS = 'providers',
  SERVICE_REQUESTS = 'service_requests',
  REVIEWS = 'reviews',
  ALL = 'all'
}

/**
 * Search match types
 */
export enum SearchMatchType {
  EXACT = 'exact',
  PARTIAL = 'partial',
  FUZZY = 'fuzzy',
  REGEX = 'regex'
}

/**
 * Location-based search options
 */
export class LocationSearchOptions {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  radius?: number = 10; // in kilometers

  @IsOptional()
  @IsString()
  unit?: 'km' | 'miles' = 'km';

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  constructor(latitude: number, longitude: number, radius?: number) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.radius = radius || 10;
  }
}

/**
 * Price range search options
 */
export class PriceRangeOptions {
  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsNumber()
  max?: number;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  constructor(min?: number, max?: number, currency?: string) {
    this.min = min;
    this.max = max;
    this.currency = currency || 'USD';
  }
}

/**
 * Rating filter options
 */
export class RatingFilterOptions {
  @IsOptional()
  @IsNumber()
  minRating?: number;

  @IsOptional()
  @IsNumber()
  maxRating?: number;

  @IsOptional()
  @IsNumber()
  minReviewCount?: number;

  constructor(minRating?: number, maxRating?: number, minReviewCount?: number) {
    this.minRating = minRating;
    this.maxRating = maxRating;
    this.minReviewCount = minReviewCount;
  }
}

/**
 * User search specific options
 */
export class UserSearchOptions {
  @IsOptional()
  @IsArray()
  roles?: string[]; // ['customer', 'provider', 'admin']

  @IsOptional()
  @IsArray()
  statuses?: string[]; // ['active', 'inactive', 'suspended']

  @IsOptional()
  @IsBoolean()
  verifiedOnly?: boolean = false;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeFilter)
  registrationDateRange?: DateRangeFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeFilter)
  lastLoginRange?: DateRangeFilter;
}

/**
 * Provider search specific options
 */
export class ProviderSearchOptions {
  @IsOptional()
  @IsArray()
  services?: string[];

  @IsOptional()
  @IsArray()
  specializations?: string[];

  @IsOptional()
  @IsArray()
  certifications?: string[];

  @IsOptional()
  @IsBoolean()
  verifiedOnly?: boolean = false;

  @IsOptional()
  @IsBoolean()
  availableOnly?: boolean = false;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationSearchOptions)
  location?: LocationSearchOptions;

  @IsOptional()
  @ValidateNested()
  @Type(() => PriceRangeOptions)
  priceRange?: PriceRangeOptions;

  @IsOptional()
  @ValidateNested()
  @Type(() => RatingFilterOptions)
  rating?: RatingFilterOptions;

  @IsOptional()
  @IsNumber()
  minExperienceYears?: number;
}

/**
 * Service request search specific options
 */
export class ServiceRequestSearchOptions {
  @IsOptional()
  @IsArray()
  statuses?: string[]; // ['pending', 'in_progress', 'completed', 'cancelled']

  @IsOptional()
  @IsArray()
  serviceTypes?: string[];

  @IsOptional()
  @IsArray()
  priorities?: string[]; // ['low', 'medium', 'high', 'urgent']

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeFilter)
  createdDateRange?: DateRangeFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeFilter)
  dueDateRange?: DateRangeFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationSearchOptions)
  location?: LocationSearchOptions;

  @IsOptional()
  @ValidateNested()
  @Type(() => PriceRangeOptions)
  budget?: PriceRangeOptions;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  providerId?: string;
}

/**
 * Review search specific options
 */
export class ReviewSearchOptions {
  @IsOptional()
  @ValidateNested()
  @Type(() => RatingFilterOptions)
  rating?: RatingFilterOptions;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  serviceRequestId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeFilter)
  dateRange?: DateRangeFilter;

  @IsOptional()
  @IsBoolean()
  hasReply?: boolean;

  @IsOptional()
  @IsBoolean()
  flaggedOnly?: boolean = false;
}

/**
 * Main search options DTO
 */
export class SearchOptions {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsEnum(SearchScope)
  scope?: SearchScope = SearchScope.ALL;

  @IsOptional()
  @IsArray()
  searchFields?: string[];

  @IsOptional()
  @IsEnum(SearchMatchType)
  matchType?: SearchMatchType = SearchMatchType.PARTIAL;

  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean = false;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @ValidateNested()
  @Type(() => SortOptions)
  sort?: SortOptions;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationOptions)
  pagination?: PaginationOptions;

  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean = false;

  @IsOptional()
  @IsBoolean()
  highlightMatches?: boolean = false;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  specificOptions?: UserSearchOptions | ProviderSearchOptions | 
                   ServiceRequestSearchOptions | ReviewSearchOptions;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  constructor(options: Partial<SearchOptions> = {}) {
    Object.assign(this, options);
    this.scope = options.scope || SearchScope.ALL;
    this.matchType = options.matchType || SearchMatchType.PARTIAL;
    this.caseSensitive = options.caseSensitive ?? false;
    this.includeInactive = options.includeInactive ?? false;
    this.highlightMatches = options.highlightMatches ?? false;
  }

  /**
   * Create user search options
   */
  static forUsers(
    searchTerm?: string,
    specificOptions?: UserSearchOptions,
    pagination?: PaginationOptions
  ): SearchOptions {
    return new SearchOptions({
      searchTerm,
      scope: SearchScope.USERS,
      specificOptions,
      pagination: pagination || new PaginationOptions()
    });
  }

  /**
   * Create provider search options
   */
  static forProviders(
    searchTerm?: string,
    specificOptions?: ProviderSearchOptions,
    pagination?: PaginationOptions
  ): SearchOptions {
    return new SearchOptions({
      searchTerm,
      scope: SearchScope.PROVIDERS,
      specificOptions,
      pagination: pagination || new PaginationOptions()
    });
  }

  /**
   * Create service request search options
   */
  static forServiceRequests(
    searchTerm?: string,
    specificOptions?: ServiceRequestSearchOptions,
    pagination?: PaginationOptions
  ): SearchOptions {
    return new SearchOptions({
      searchTerm,
      scope: SearchScope.SERVICE_REQUESTS,
      specificOptions,
      pagination: pagination || new PaginationOptions()
    });
  }

  /**
   * Create review search options
   */
  static forReviews(
    searchTerm?: string,
    specificOptions?: ReviewSearchOptions,
    pagination?: PaginationOptions
  ): SearchOptions {
    return new SearchOptions({
      searchTerm,
      scope: SearchScope.REVIEWS,
      specificOptions,
      pagination: pagination || new PaginationOptions()
    });
  }

  /**
   * Create from query parameters
   */
  static fromQuery(query: any): SearchOptions {
    const options = new SearchOptions({
      searchTerm: query.search || query.q,
      scope: query.scope || SearchScope.ALL,
      searchFields: query.fields ? query.fields.split(',') : undefined,
      matchType: query.matchType || SearchMatchType.PARTIAL,
      caseSensitive: query.caseSensitive === 'true',
      filters: query.filters ? JSON.parse(query.filters) : undefined,
      sort: SortOptions.fromQuery(query),
      pagination: PaginationOptions.fromQuery(query),
      includeInactive: query.includeInactive === 'true',
      highlightMatches: query.highlight === 'true'
    });

    return options;
  }

  /**
   * Check if search options are valid
   */
  isValid(): boolean {
    // Must have either search term or filters
    if (!this.searchTerm && !this.filters && !this.specificOptions) {
      return false;
    }

    // Validate pagination if provided
    if (this.pagination && this.pagination.page < 1) {
      return false;
    }

    return true;
  }

  /**
   * Get typed specific options for different search scopes
   */
  getUserOptions(): UserSearchOptions | undefined {
    return this.scope === SearchScope.USERS ? this.specificOptions as UserSearchOptions : undefined;
  }

  getProviderOptions(): ProviderSearchOptions | undefined {
    return this.scope === SearchScope.PROVIDERS ? this.specificOptions as ProviderSearchOptions : undefined;
  }

  getServiceRequestOptions(): ServiceRequestSearchOptions | undefined {
    return this.scope === SearchScope.SERVICE_REQUESTS ? this.specificOptions as ServiceRequestSearchOptions : undefined;
  }

  getReviewOptions(): ReviewSearchOptions | undefined {
    return this.scope === SearchScope.REVIEWS ? this.specificOptions as ReviewSearchOptions : undefined;
  }

  /**
   * Build search query for different databases/search engines
   */
  buildMongoQuery(): any {
    const query: any = {};

    // Add text search if search term is provided
    if (this.searchTerm) {
      if (this.matchType === SearchMatchType.EXACT) {
        query.$text = { $search: `"${this.searchTerm}"` };
      } else if (this.matchType === SearchMatchType.REGEX) {
        const regex = new RegExp(this.searchTerm, this.caseSensitive ? '' : 'i');
        if (this.searchFields && this.searchFields.length > 0) {
          query.$or = this.searchFields.map(field => ({ [field]: regex }));
        } else {
          query.$text = { $search: this.searchTerm };
        }
      } else {
        query.$text = { $search: this.searchTerm };
      }
    }

    // Add filters
    if (this.filters) {
      Object.assign(query, this.filters);
    }

    // Add scope-specific filters
    if (!this.includeInactive) {
      query.status = { $ne: 'inactive' };
    }

    return query;
  }

  /**
   * Build sort options for MongoDB
   */
  buildSort(): any {
    if (this.sort) {
      return this.sort.toMongoSort();
    }

    // Default sort by relevance if text search, otherwise by creation date
    if (this.searchTerm) {
      return { score: { $meta: 'textScore' } };
    }

    return { createdAt: -1 };
  }
}
