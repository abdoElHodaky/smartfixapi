/**
 * Options Builder Pattern
 * 
 * Provides a flexible way to handle complex optional parameters
 * and configuration objects in service methods.
 */

import { IsOptional, IsString, IsNumber, IsBoolean, IsObject, IsArray } from 'class-validator';
import { PaginationOptions } from './PaginationOptions';
import { SortOptions, DateRangeFilter } from './FilterBuilder';

/**
 * Base options interface
 */
export interface BaseOptions {
  [key: string]: any;
}

/**
 * Search options for complex queries
 */
export class SearchOptions {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsArray()
  fields?: string[];

  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean = false;

  @IsOptional()
  @IsBoolean()
  exactMatch?: boolean = false;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  sort?: SortOptions;

  @IsOptional()
  pagination?: PaginationOptions;

  constructor(options: Partial<SearchOptions> = {}) {
    Object.assign(this, options);
  }

  /**
   * Create from query parameters
   */
  static fromQuery(query: any): SearchOptions {
    return new SearchOptions({
      searchTerm: query.search || query.q,
      fields: query.fields ? query.fields.split(',') : undefined,
      caseSensitive: query.caseSensitive === 'true',
      exactMatch: query.exactMatch === 'true',
      filters: query.filters ? JSON.parse(query.filters) : undefined,
      sort: SortOptions.fromQuery(query),
      pagination: PaginationOptions.fromQuery(query)
    });
  }

  /**
   * Check if search options are valid
   */
  isValid(): boolean {
    return !!(this.searchTerm || this.filters || Object.keys(this).some(key => this[key] !== undefined));
  }
}

/**
 * Report generation options
 */
export class ReportOptions {
  @IsOptional()
  @IsString()
  format?: 'json' | 'csv' | 'pdf' = 'json';

  @IsOptional()
  dateRange?: DateRangeFilter;

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
  @IsNumber()
  maxRecords?: number = 10000;

  constructor(options: Partial<ReportOptions> = {}) {
    Object.assign(this, options);
  }

  /**
   * Create from query parameters
   */
  static fromQuery(query: any): ReportOptions {
    return new ReportOptions({
      format: query.format || 'json',
      dateRange: query.from || query.to ? new DateRangeFilter(
        query.from ? new Date(query.from) : undefined,
        query.to ? new Date(query.to) : undefined
      ) : undefined,
      includeFields: query.include ? query.include.split(',') : undefined,
      excludeFields: query.exclude ? query.exclude.split(',') : undefined,
      filters: query.filters ? JSON.parse(query.filters) : undefined,
      includeMetadata: query.includeMetadata !== 'false',
      maxRecords: query.maxRecords ? parseInt(query.maxRecords) : 10000
    });
  }
}

/**
 * Export options for data export operations
 */
export class ExportOptions {
  @IsOptional()
  @IsString()
  format?: 'json' | 'csv' | 'xlsx' | 'xml' = 'json';

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsBoolean()
  compress?: boolean = false;

  @IsOptional()
  @IsString()
  encoding?: 'utf8' | 'utf16' | 'ascii' = 'utf8';

  @IsOptional()
  @IsObject()
  formatOptions?: Record<string, any>;

  constructor(options: Partial<ExportOptions> = {}) {
    Object.assign(this, options);
  }
}

/**
 * Import options for data import operations
 */
export class ImportOptions {
  @IsOptional()
  @IsString()
  format?: 'json' | 'csv' | 'xlsx' | 'xml' = 'json';

  @IsOptional()
  @IsBoolean()
  validateData?: boolean = true;

  @IsOptional()
  @IsBoolean()
  skipErrors?: boolean = false;

  @IsOptional()
  @IsNumber()
  batchSize?: number = 100;

  @IsOptional()
  @IsObject()
  fieldMapping?: Record<string, string>;

  @IsOptional()
  @IsArray()
  requiredFields?: string[];

  constructor(options: Partial<ImportOptions> = {}) {
    Object.assign(this, options);
  }
}

/**
 * Generic options builder with fluent interface
 */
export class OptionsBuilder<T extends BaseOptions = BaseOptions> {
  private options: T;

  constructor(initialOptions: T = {} as T) {
    this.options = { ...initialOptions };
  }

  /**
   * Set a single option
   */
  set<K extends keyof T>(key: K, value: T[K]): OptionsBuilder<T> {
    this.options[key] = value;
    return this;
  }

  /**
   * Set multiple options
   */
  setMany(options: Partial<T>): OptionsBuilder<T> {
    Object.assign(this.options, options);
    return this;
  }

  /**
   * Set option if condition is true
   */
  setIf<K extends keyof T>(condition: boolean, key: K, value: T[K]): OptionsBuilder<T> {
    if (condition) {
      this.options[key] = value;
    }
    return this;
  }

  /**
   * Set option from query parameter
   */
  fromQuery(query: any, mapping: Record<string, keyof T>): OptionsBuilder<T> {
    Object.entries(mapping).forEach(([queryKey, optionKey]) => {
      if (query[queryKey] !== undefined) {
        this.options[optionKey] = query[queryKey];
      }
    });
    return this;
  }

  /**
   * Apply a transformation function
   */
  transform(transformer: (options: T) => T): OptionsBuilder<T> {
    this.options = transformer(this.options);
    return this;
  }

  /**
   * Merge with another options object
   */
  merge(other: Partial<T>): OptionsBuilder<T> {
    this.options = { ...this.options, ...other };
    return this;
  }

  /**
   * Remove undefined values
   */
  clean(): OptionsBuilder<T> {
    Object.keys(this.options).forEach(key => {
      if (this.options[key] === undefined) {
        delete this.options[key];
      }
    });
    return this;
  }

  /**
   * Validate options (override in subclasses)
   */
  validate(): boolean {
    return true;
  }

  /**
   * Build the final options object
   */
  build(): T {
    if (!this.validate()) {
      throw new Error('Options validation failed');
    }
    return { ...this.options };
  }

  /**
   * Get current options without building
   */
  peek(): T {
    return { ...this.options };
  }

  /**
   * Reset to initial state
   */
  reset(initialOptions: T = {} as T): OptionsBuilder<T> {
    this.options = { ...initialOptions };
    return this;
  }

  /**
   * Create a new builder instance
   */
  static create<T extends BaseOptions = BaseOptions>(initialOptions: T = {} as T): OptionsBuilder<T> {
    return new OptionsBuilder<T>(initialOptions);
  }
}

/**
 * Search options builder with specific methods
 */
export class SearchOptionsBuilder extends OptionsBuilder<SearchOptions> {
  constructor(initialOptions: Partial<SearchOptions> = {}) {
    super(new SearchOptions(initialOptions));
  }

  /**
   * Set search term
   */
  searchTerm(term: string): SearchOptionsBuilder {
    return this.set('searchTerm', term);
  }

  /**
   * Set search fields
   */
  fields(fields: string[]): SearchOptionsBuilder {
    return this.set('fields', fields);
  }

  /**
   * Set case sensitivity
   */
  caseSensitive(sensitive: boolean = true): SearchOptionsBuilder {
    return this.set('caseSensitive', sensitive);
  }

  /**
   * Set exact match
   */
  exactMatch(exact: boolean = true): SearchOptionsBuilder {
    return this.set('exactMatch', exact);
  }

  /**
   * Set filters
   */
  filters(filters: Record<string, any>): SearchOptionsBuilder {
    return this.set('filters', filters);
  }

  /**
   * Set sort options
   */
  sort(field: string, direction: 'asc' | 'desc' = 'asc'): SearchOptionsBuilder {
    return this.set('sort', new SortOptions(field, direction));
  }

  /**
   * Set pagination
   */
  paginate(page: number = 1, limit: number = 10): SearchOptionsBuilder {
    return this.set('pagination', new PaginationOptions(page, limit));
  }

  /**
   * Create from query parameters
   */
  static fromQuery(query: any): SearchOptionsBuilder {
    const options = SearchOptions.fromQuery(query);
    return new SearchOptionsBuilder(options);
  }
}

/**
 * Report options builder with specific methods
 */
export class ReportOptionsBuilder extends OptionsBuilder<ReportOptions> {
  constructor(initialOptions: Partial<ReportOptions> = {}) {
    super(new ReportOptions(initialOptions));
  }

  /**
   * Set report format
   */
  format(format: 'json' | 'csv' | 'pdf'): ReportOptionsBuilder {
    return this.set('format', format);
  }

  /**
   * Set date range
   */
  dateRange(from?: Date, to?: Date): ReportOptionsBuilder {
    return this.set('dateRange', new DateRangeFilter(from, to));
  }

  /**
   * Set included fields
   */
  include(fields: string[]): ReportOptionsBuilder {
    return this.set('includeFields', fields);
  }

  /**
   * Set excluded fields
   */
  exclude(fields: string[]): ReportOptionsBuilder {
    return this.set('excludeFields', fields);
  }

  /**
   * Set filters
   */
  filters(filters: Record<string, any>): ReportOptionsBuilder {
    return this.set('filters', filters);
  }

  /**
   * Set metadata inclusion
   */
  includeMetadata(include: boolean = true): ReportOptionsBuilder {
    return this.set('includeMetadata', include);
  }

  /**
   * Set maximum records
   */
  maxRecords(max: number): ReportOptionsBuilder {
    return this.set('maxRecords', max);
  }

  /**
   * Create from query parameters
   */
  static fromQuery(query: any): ReportOptionsBuilder {
    const options = ReportOptions.fromQuery(query);
    return new ReportOptionsBuilder(options);
  }
}
