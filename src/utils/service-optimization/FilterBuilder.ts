/**
 * Filter Builder and Criteria Classes
 * 
 * Provides a unified filtering framework for building complex queries
 * across all services with type safety and fluent interface.
 */

import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsDate } from 'class-validator';

/**
 * Base filter criteria interface
 */
export interface FilterCriteria {
  [key: string]: any;
}

/**
 * Comparison operators for filtering
 */
export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  NOT_IN = 'nin',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  REGEX = 'regex',
  EXISTS = 'exists'
}

/**
 * Filter condition for building complex queries
 */
export class FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  options?: any;

  constructor(field: string, operator: FilterOperator, value: any, options?: any) {
    this.field = field;
    this.operator = operator;
    this.value = value;
    this.options = options;
  }

  /**
   * Convert to MongoDB query format
   */
  toMongoQuery(): any {
    const query: any = {};
    
    switch (this.operator) {
      case FilterOperator.EQUALS:
        query[this.field] = this.value;
        break;
      case FilterOperator.NOT_EQUALS:
        query[this.field] = { $ne: this.value };
        break;
      case FilterOperator.GREATER_THAN:
        query[this.field] = { $gt: this.value };
        break;
      case FilterOperator.GREATER_THAN_OR_EQUAL:
        query[this.field] = { $gte: this.value };
        break;
      case FilterOperator.LESS_THAN:
        query[this.field] = { $lt: this.value };
        break;
      case FilterOperator.LESS_THAN_OR_EQUAL:
        query[this.field] = { $lte: this.value };
        break;
      case FilterOperator.IN:
        query[this.field] = { $in: this.value };
        break;
      case FilterOperator.NOT_IN:
        query[this.field] = { $nin: this.value };
        break;
      case FilterOperator.CONTAINS:
        query[this.field] = { $regex: this.value, $options: this.options?.caseSensitive ? '' : 'i' };
        break;
      case FilterOperator.STARTS_WITH:
        query[this.field] = { $regex: `^${this.value}`, $options: this.options?.caseSensitive ? '' : 'i' };
        break;
      case FilterOperator.ENDS_WITH:
        query[this.field] = { $regex: `${this.value}$`, $options: this.options?.caseSensitive ? '' : 'i' };
        break;
      case FilterOperator.REGEX:
        query[this.field] = { $regex: this.value, $options: this.options || 'i' };
        break;
      case FilterOperator.EXISTS:
        query[this.field] = { $exists: this.value };
        break;
      default:
        query[this.field] = this.value;
    }

    return query;
  }
}

/**
 * Sort options for queries
 */
export class SortOptions {
  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  direction?: 'asc' | 'desc' = 'asc';

  constructor(field?: string, direction: 'asc' | 'desc' = 'asc') {
    this.field = field;
    this.direction = direction;
  }

  /**
   * Convert to MongoDB sort format
   */
  toMongoSort(): any {
    if (!this.field) return {};
    return { [this.field]: this.direction === 'asc' ? 1 : -1 };
  }

  /**
   * Create from query parameters
   */
  static fromQuery(query: any): SortOptions {
    return new SortOptions(query.sortBy, query.sortOrder || 'asc');
  }
}

/**
 * Date range filter
 */
export class DateRangeFilter {
  @IsOptional()
  @IsDate()
  from?: Date;

  @IsOptional()
  @IsDate()
  to?: Date;

  constructor(from?: Date, to?: Date) {
    this.from = from;
    this.to = to;
  }

  /**
   * Convert to MongoDB query format
   */
  toMongoQuery(field: string): any {
    const query: any = {};
    
    if (this.from && this.to) {
      query[field] = { $gte: this.from, $lte: this.to };
    } else if (this.from) {
      query[field] = { $gte: this.from };
    } else if (this.to) {
      query[field] = { $lte: this.to };
    }

    return query;
  }

  /**
   * Check if date range is valid
   */
  isValid(): boolean {
    if (!this.from && !this.to) return false;
    if (this.from && this.to && this.from > this.to) return false;
    return true;
  }
}

/**
 * Main filter builder class with fluent interface
 */
export class FilterBuilder {
  private conditions: FilterCondition[] = [];
  private sortOptions: SortOptions = new SortOptions();
  private logicalOperator: 'AND' | 'OR' = 'AND';

  /**
   * Add an equals condition
   */
  equals(field: string, value: any): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.EQUALS, value));
    return this;
  }

  /**
   * Add a not equals condition
   */
  notEquals(field: string, value: any): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.NOT_EQUALS, value));
    return this;
  }

  /**
   * Add a greater than condition
   */
  greaterThan(field: string, value: any): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.GREATER_THAN, value));
    return this;
  }

  /**
   * Add a greater than or equal condition
   */
  greaterThanOrEqual(field: string, value: any): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.GREATER_THAN_OR_EQUAL, value));
    return this;
  }

  /**
   * Add a less than condition
   */
  lessThan(field: string, value: any): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.LESS_THAN, value));
    return this;
  }

  /**
   * Add a less than or equal condition
   */
  lessThanOrEqual(field: string, value: any): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.LESS_THAN_OR_EQUAL, value));
    return this;
  }

  /**
   * Add an in condition
   */
  in(field: string, values: any[]): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.IN, values));
    return this;
  }

  /**
   * Add a not in condition
   */
  notIn(field: string, values: any[]): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.NOT_IN, values));
    return this;
  }

  /**
   * Add a contains condition (case-insensitive by default)
   */
  contains(field: string, value: string, caseSensitive = false): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.CONTAINS, value, { caseSensitive }));
    return this;
  }

  /**
   * Add a starts with condition
   */
  startsWith(field: string, value: string, caseSensitive = false): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.STARTS_WITH, value, { caseSensitive }));
    return this;
  }

  /**
   * Add an ends with condition
   */
  endsWith(field: string, value: string, caseSensitive = false): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.ENDS_WITH, value, { caseSensitive }));
    return this;
  }

  /**
   * Add a regex condition
   */
  regex(field: string, pattern: string, options = 'i'): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.REGEX, pattern, options));
    return this;
  }

  /**
   * Add an exists condition
   */
  exists(field: string, exists = true): FilterBuilder {
    this.conditions.push(new FilterCondition(field, FilterOperator.EXISTS, exists));
    return this;
  }

  /**
   * Add a date range condition
   */
  dateRange(field: string, from?: Date, to?: Date): FilterBuilder {
    const dateRange = new DateRangeFilter(from, to);
    if (dateRange.isValid()) {
      const query = dateRange.toMongoQuery(field);
      Object.keys(query).forEach(key => {
        this.conditions.push(new FilterCondition(key, FilterOperator.EQUALS, query[key]));
      });
    }
    return this;
  }

  /**
   * Set sort options
   */
  sort(field: string, direction: 'asc' | 'desc' = 'asc'): FilterBuilder {
    this.sortOptions = new SortOptions(field, direction);
    return this;
  }

  /**
   * Set logical operator for combining conditions
   */
  useOr(): FilterBuilder {
    this.logicalOperator = 'OR';
    return this;
  }

  /**
   * Set logical operator for combining conditions
   */
  useAnd(): FilterBuilder {
    this.logicalOperator = 'AND';
    return this;
  }

  /**
   * Add custom condition
   */
  custom(condition: FilterCondition): FilterBuilder {
    this.conditions.push(condition);
    return this;
  }

  /**
   * Build MongoDB query
   */
  buildMongoQuery(): any {
    if (this.conditions.length === 0) {
      return {};
    }

    const queries = this.conditions.map(condition => condition.toMongoQuery());

    if (queries.length === 1) {
      return queries[0];
    }

    if (this.logicalOperator === 'OR') {
      return { $or: queries };
    } else {
      return { $and: queries };
    }
  }

  /**
   * Build sort options
   */
  buildSort(): any {
    return this.sortOptions.toMongoSort();
  }

  /**
   * Reset the builder
   */
  reset(): FilterBuilder {
    this.conditions = [];
    this.sortOptions = new SortOptions();
    this.logicalOperator = 'AND';
    return this;
  }

  /**
   * Create a new filter builder
   */
  static create(): FilterBuilder {
    return new FilterBuilder();
  }
}
