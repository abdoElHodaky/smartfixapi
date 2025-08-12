/**
 * Pagination Options and Result Classes
 * 
 * Provides standardized pagination handling across all services
 * to reduce method signature complexity and improve consistency.
 */

import { IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * Standardized pagination options
 */
export class PaginationOptions {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(0)
  skip?: number;

  constructor(page: number = 1, limit: number = 10) {
    this.page = page;
    this.limit = limit;
    this.skip = (page - 1) * limit;
  }

  /**
   * Create pagination options from query parameters
   */
  static fromQuery(query: any): PaginationOptions {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 10, 100);
    return new PaginationOptions(page, limit);
  }

  /**
   * Get skip value for database queries
   */
  getSkip(): number {
    return (this.page - 1) * this.limit;
  }

  /**
   * Create pagination metadata
   */
  createMetadata(totalItems: number): PaginationMetadata {
    return new PaginationMetadata(this.page, this.limit, totalItems);
  }
}

/**
 * Pagination metadata for responses
 */
export class PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  constructor(page: number, limit: number, totalItems: number) {
    this.currentPage = page;
    this.itemsPerPage = limit;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(totalItems / limit);
    this.hasNextPage = page < this.totalPages;
    this.hasPreviousPage = page > 1;
  }
}

/**
 * Standardized paginated result wrapper
 */
export class PaginatedResult<T> {
  success: boolean = true;
  message: string;
  data: T[];
  pagination: PaginationMetadata;

  constructor(
    data: T[],
    pagination: PaginationMetadata,
    message: string = 'Data retrieved successfully'
  ) {
    this.data = data;
    this.pagination = pagination;
    this.message = message;
  }

  /**
   * Create a paginated result from data and options
   */
  static create<T>(
    data: T[],
    totalItems: number,
    options: PaginationOptions,
    message?: string
  ): PaginatedResult<T> {
    const metadata = options.createMetadata(totalItems);
    return new PaginatedResult(data, metadata, message);
  }

  /**
   * Create an empty paginated result
   */
  static empty<T>(
    options: PaginationOptions,
    message: string = 'No data found'
  ): PaginatedResult<T> {
    const metadata = options.createMetadata(0);
    return new PaginatedResult<T>([], metadata, message);
  }
}

/**
 * Pagination builder for fluent interface
 */
export class PaginationBuilder {
  private options: PaginationOptions;

  constructor() {
    this.options = new PaginationOptions();
  }

  /**
   * Set page number
   */
  page(page: number): PaginationBuilder {
    this.options.page = Math.max(1, page);
    this.options.skip = (this.options.page - 1) * this.options.limit;
    return this;
  }

  /**
   * Set limit
   */
  limit(limit: number): PaginationBuilder {
    this.options.limit = Math.min(Math.max(1, limit), 100);
    this.options.skip = (this.options.page - 1) * this.options.limit;
    return this;
  }

  /**
   * Set from query parameters
   */
  fromQuery(query: any): PaginationBuilder {
    this.options = PaginationOptions.fromQuery(query);
    return this;
  }

  /**
   * Build the pagination options
   */
  build(): PaginationOptions {
    return this.options;
  }
}
