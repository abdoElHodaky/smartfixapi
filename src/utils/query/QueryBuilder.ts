/**
 * MongoDB Query Builder Utility
 * 
 * Provides a fluent interface for building MongoDB queries with common
 * filtering patterns to reduce code duplication across services.
 */

import mongoose from 'mongoose';

export interface LocationFilter {
  latitude: number;
  longitude: number;
  radius: number; // in kilometers
}

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface SortOptions {
  [field: string]: 1 | -1 | 'asc' | 'desc';
}

export interface TextSearchOptions {
  searchTerm: string;
  fields: string[];
  caseSensitive?: boolean;
}

export class QueryBuilder {
  private query: any = {};
  private sortOptions: any = {};
  private limitValue?: number;
  private skipValue?: number;

  /**
   * Create a new query builder instance
   */
  static create(): QueryBuilder {
    return new QueryBuilder();
  }

  /**
   * Add a match condition
   */
  match(field: string, value: any): QueryBuilder {
    this.query[field] = value;
    return this;
  }

  /**
   * Add multiple match conditions
   */
  matchAll(conditions: { [field: string]: any }): QueryBuilder {
    Object.assign(this.query, conditions);
    return this;
  }

  /**
   * Add an $in condition
   */
  matchIn(field: string, values: any[]): QueryBuilder {
    if (values && values.length > 0) {
      this.query[field] = { $in: values };
    }
    return this;
  }

  /**
   * Add a range condition
   */
  matchRange(field: string, min?: any, max?: any): QueryBuilder {
    if (min !== undefined || max !== undefined) {
      const condition: any = {};
      if (min !== undefined) condition.$gte = min;
      if (max !== undefined) condition.$lte = max;
      
      if (this.query[field] && typeof this.query[field] === 'object') {
        Object.assign(this.query[field], condition);
      } else {
        this.query[field] = condition;
      }
    }
    return this;
  }

  /**
   * Add a date range filter
   */
  matchDateRange(field: string, dateRange: DateRangeFilter): QueryBuilder {
    if (dateRange.from || dateRange.to) {
      const condition: any = {};
      if (dateRange.from) condition.$gte = dateRange.from;
      if (dateRange.to) condition.$lte = dateRange.to;
      this.query[field] = condition;
    }
    return this;
  }

  /**
   * Add location-based filtering
   */
  matchLocation(field: string, location: LocationFilter): QueryBuilder {
    this.query[field] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        $maxDistance: location.radius * 1000 // Convert km to meters
      }
    };
    return this;
  }

  /**
   * Add text search across multiple fields
   */
  matchTextSearch(searchOptions: TextSearchOptions): QueryBuilder {
    if (searchOptions.searchTerm && searchOptions.fields.length > 0) {
      const options = searchOptions.caseSensitive ? '' : 'i';
      this.query.$or = searchOptions.fields.map(field => ({
        [field]: { $regex: searchOptions.searchTerm, $options: options }
      }));
    }
    return this;
  }

  /**
   * Add regex match condition
   */
  matchRegex(field: string, pattern: string, options: string = 'i'): QueryBuilder {
    this.query[field] = { $regex: pattern, $options: options };
    return this;
  }

  /**
   * Add exists condition
   */
  matchExists(field: string, exists: boolean = true): QueryBuilder {
    this.query[field] = { $exists: exists };
    return this;
  }

  /**
   * Add not equal condition
   */
  matchNotEqual(field: string, value: any): QueryBuilder {
    this.query[field] = { $ne: value };
    return this;
  }

  /**
   * Add greater than condition
   */
  matchGreaterThan(field: string, value: any): QueryBuilder {
    this.query[field] = { $gt: value };
    return this;
  }

  /**
   * Add less than condition
   */
  matchLessThan(field: string, value: any): QueryBuilder {
    this.query[field] = { $lt: value };
    return this;
  }

  /**
   * Add array contains condition
   */
  matchArrayContains(field: string, value: any): QueryBuilder {
    this.query[field] = { $elemMatch: { $eq: value } };
    return this;
  }

  /**
   * Add array size condition
   */
  matchArraySize(field: string, size: number): QueryBuilder {
    this.query[field] = { $size: size };
    return this;
  }

  /**
   * Add OR conditions
   */
  matchOr(conditions: any[]): QueryBuilder {
    if (conditions.length > 0) {
      this.query.$or = conditions;
    }
    return this;
  }

  /**
   * Add AND conditions
   */
  matchAnd(conditions: any[]): QueryBuilder {
    if (conditions.length > 0) {
      this.query.$and = conditions;
    }
    return this;
  }

  /**
   * Add sort options
   */
  sort(sortOptions: SortOptions): QueryBuilder {
    this.sortOptions = sortOptions;
    return this;
  }

  /**
   * Add limit
   */
  limit(limit: number): QueryBuilder {
    this.limitValue = limit;
    return this;
  }

  /**
   * Add skip
   */
  skip(skip: number): QueryBuilder {
    this.skipValue = skip;
    return this;
  }

  /**
   * Add pagination
   */
  paginate(options: PaginationOptions): QueryBuilder {
    this.limitValue = options.limit;
    this.skipValue = (options.page - 1) * options.limit;
    return this;
  }

  /**
   * Build provider search query
   */
  buildProviderSearch(filters: {
    services?: string[];
    location?: LocationFilter;
    minRating?: number;
    maxHourlyRate?: number;
    minHourlyRate?: number;
    searchTerm?: string;
    status?: string;
  }): QueryBuilder {
    if (filters.services && filters.services.length > 0) {
      this.matchIn('services', filters.services);
    }

    if (filters.location) {
      this.matchLocation('serviceArea', filters.location);
    }

    if (filters.minRating) {
      this.matchRange('averageRating', filters.minRating);
    }

    if (filters.minHourlyRate || filters.maxHourlyRate) {
      this.matchRange('hourlyRate', filters.minHourlyRate, filters.maxHourlyRate);
    }

    if (filters.searchTerm) {
      this.matchTextSearch({
        searchTerm: filters.searchTerm,
        fields: ['businessName', 'description', 'services']
      });
    }

    if (filters.status) {
      this.match('status', filters.status);
    }

    return this;
  }

  /**
   * Build service request search query
   */
  buildServiceRequestSearch(filters: {
    category?: string;
    status?: string;
    location?: LocationFilter;
    minBudget?: number;
    maxBudget?: number;
    dateRange?: DateRangeFilter;
    userId?: string;
    providerId?: string;
  }): QueryBuilder {
    if (filters.category) {
      this.match('category', filters.category);
    }

    if (filters.status) {
      this.match('status', filters.status);
    }

    if (filters.location) {
      this.matchLocation('location', filters.location);
    }

    if (filters.minBudget || filters.maxBudget) {
      this.matchRange('budget', filters.minBudget, filters.maxBudget);
    }

    if (filters.dateRange) {
      this.matchDateRange('createdAt', filters.dateRange);
    }

    if (filters.userId) {
      this.match('userId', new mongoose.Types.ObjectId(filters.userId));
    }

    if (filters.providerId) {
      this.match('providerId', new mongoose.Types.ObjectId(filters.providerId));
    }

    return this;
  }

  /**
   * Build review search query
   */
  buildReviewSearch(filters: {
    providerId?: string;
    userId?: string;
    rating?: number;
    minRating?: number;
    maxRating?: number;
    dateRange?: DateRangeFilter;
    flagged?: boolean;
  }): QueryBuilder {
    if (filters.providerId) {
      this.match('providerId', new mongoose.Types.ObjectId(filters.providerId));
    }

    if (filters.userId) {
      this.match('userId', new mongoose.Types.ObjectId(filters.userId));
    }

    if (filters.rating) {
      this.match('rating', filters.rating);
    }

    if (filters.minRating || filters.maxRating) {
      this.matchRange('rating', filters.minRating, filters.maxRating);
    }

    if (filters.dateRange) {
      this.matchDateRange('createdAt', filters.dateRange);
    }

    if (filters.flagged !== undefined) {
      this.match('flagged', filters.flagged);
    }

    return this;
  }

  /**
   * Build user search query
   */
  buildUserSearch(filters: {
    role?: string;
    status?: string;
    location?: LocationFilter;
    emailVerified?: boolean;
    dateRange?: DateRangeFilter;
    searchTerm?: string;
  }): QueryBuilder {
    if (filters.role) {
      this.match('role', filters.role);
    }

    if (filters.status) {
      this.match('status', filters.status);
    }

    if (filters.location) {
      this.matchLocation('location', filters.location);
    }

    if (filters.emailVerified !== undefined) {
      this.match('isEmailVerified', filters.emailVerified);
    }

    if (filters.dateRange) {
      this.matchDateRange('createdAt', filters.dateRange);
    }

    if (filters.searchTerm) {
      this.matchTextSearch({
        searchTerm: filters.searchTerm,
        fields: ['firstName', 'lastName', 'email']
      });
    }

    return this;
  }

  /**
   * Build chat search query
   */
  buildChatSearch(filters: {
    userId?: string;
    chatType?: string;
    dateRange?: DateRangeFilter;
    hasMessages?: boolean;
  }): QueryBuilder {
    if (filters.userId) {
      this.matchArrayContains('participants', new mongoose.Types.ObjectId(filters.userId));
    }

    if (filters.chatType) {
      this.match('chatType', filters.chatType);
    }

    if (filters.dateRange) {
      this.matchDateRange('createdAt', filters.dateRange);
    }

    if (filters.hasMessages !== undefined) {
      if (filters.hasMessages) {
        this.matchGreaterThan('messageCount', 0);
      } else {
        this.match('messageCount', 0);
      }
    }

    return this;
  }

  /**
   * Get the built query object
   */
  getQuery(): any {
    return { ...this.query };
  }

  /**
   * Get the sort options
   */
  getSortOptions(): any {
    return { ...this.sortOptions };
  }

  /**
   * Get the limit value
   */
  getLimit(): number | undefined {
    return this.limitValue;
  }

  /**
   * Get the skip value
   */
  getSkip(): number | undefined {
    return this.skipValue;
  }

  /**
   * Execute the query on a model
   */
  async execute(model: mongoose.Model<any>): Promise<any[]> {
    let query = model.find(this.query);

    if (Object.keys(this.sortOptions).length > 0) {
      query = query.sort(this.sortOptions);
    }

    if (this.skipValue !== undefined) {
      query = query.skip(this.skipValue);
    }

    if (this.limitValue !== undefined) {
      query = query.limit(this.limitValue);
    }

    return await query.exec();
  }

  /**
   * Execute count query
   */
  async count(model: mongoose.Model<any>): Promise<number> {
    return await model.countDocuments(this.query);
  }

  /**
   * Execute paginated query with total count
   */
  async executePaginated(model: mongoose.Model<any>): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [data, total] = await Promise.all([
      this.execute(model),
      this.count(model)
    ]);

    const page = this.skipValue ? Math.floor(this.skipValue / (this.limitValue || 10)) + 1 : 1;
    const limit = this.limitValue || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Clear the query for reuse
   */
  clear(): QueryBuilder {
    this.query = {};
    this.sortOptions = {};
    this.limitValue = undefined;
    this.skipValue = undefined;
    return this;
  }

  /**
   * Clone the current builder
   */
  clone(): QueryBuilder {
    const newBuilder = new QueryBuilder();
    newBuilder.query = { ...this.query };
    newBuilder.sortOptions = { ...this.sortOptions };
    newBuilder.limitValue = this.limitValue;
    newBuilder.skipValue = this.skipValue;
    return newBuilder;
  }
}
