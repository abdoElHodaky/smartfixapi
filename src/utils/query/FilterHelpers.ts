/**
 * Filter Helper Utilities
 * 
 * Provides helper functions for common filtering operations
 * to complement the QueryBuilder class.
 */

import mongoose from 'mongoose';

export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedFilters: any;
}

export class FilterHelpers {
  /**
   * Validate and sanitize location filter
   */
  static validateLocationFilter(location: any): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedFilters: any = {};

    if (!location) {
      return { isValid: true, errors: [], sanitizedFilters: {} };
    }

    if (typeof location.latitude !== 'number' || location.latitude < -90 || location.latitude > 90) {
      errors.push('Latitude must be a number between -90 and 90');
    } else {
      sanitizedFilters.latitude = location.latitude;
    }

    if (typeof location.longitude !== 'number' || location.longitude < -180 || location.longitude > 180) {
      errors.push('Longitude must be a number between -180 and 180');
    } else {
      sanitizedFilters.longitude = location.longitude;
    }

    if (typeof location.radius !== 'number' || location.radius <= 0 || location.radius > 1000) {
      errors.push('Radius must be a number between 0 and 1000 km');
    } else {
      sanitizedFilters.radius = location.radius;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters: errors.length === 0 ? sanitizedFilters : {}
    };
  }

  /**
   * Validate and sanitize date range filter
   */
  static validateDateRangeFilter(dateRange: any): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedFilters: any = {};

    if (!dateRange) {
      return { isValid: true, errors: [], sanitizedFilters: {} };
    }

    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      if (isNaN(fromDate.getTime())) {
        errors.push('Invalid from date format');
      } else {
        sanitizedFilters.from = fromDate;
      }
    }

    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      if (isNaN(toDate.getTime())) {
        errors.push('Invalid to date format');
      } else {
        sanitizedFilters.to = toDate;
      }
    }

    if (sanitizedFilters.from && sanitizedFilters.to && sanitizedFilters.from > sanitizedFilters.to) {
      errors.push('From date must be before to date');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters: errors.length === 0 ? sanitizedFilters : {}
    };
  }

  /**
   * Validate and sanitize pagination parameters
   */
  static validatePaginationFilter(pagination: any): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedFilters: any = {
      page: 1,
      limit: 10
    };

    if (pagination?.page) {
      const page = parseInt(pagination.page);
      if (isNaN(page) || page < 1) {
        errors.push('Page must be a positive integer');
      } else {
        sanitizedFilters.page = page;
      }
    }

    if (pagination?.limit) {
      const limit = parseInt(pagination.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        errors.push('Limit must be between 1 and 100');
      } else {
        sanitizedFilters.limit = limit;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters
    };
  }

  /**
   * Validate and sanitize numeric range filter
   */
  static validateNumericRangeFilter(
    range: any,
    fieldName: string,
    min?: number,
    max?: number
  ): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedFilters: any = {};

    if (!range) {
      return { isValid: true, errors: [], sanitizedFilters: {} };
    }

    if (range.min !== undefined) {
      const minValue = parseFloat(range.min);
      if (isNaN(minValue)) {
        errors.push(`${fieldName} minimum must be a valid number`);
      } else if (min !== undefined && minValue < min) {
        errors.push(`${fieldName} minimum must be at least ${min}`);
      } else {
        sanitizedFilters.min = minValue;
      }
    }

    if (range.max !== undefined) {
      const maxValue = parseFloat(range.max);
      if (isNaN(maxValue)) {
        errors.push(`${fieldName} maximum must be a valid number`);
      } else if (max !== undefined && maxValue > max) {
        errors.push(`${fieldName} maximum must be at most ${max}`);
      } else {
        sanitizedFilters.max = maxValue;
      }
    }

    if (sanitizedFilters.min !== undefined && sanitizedFilters.max !== undefined && 
        sanitizedFilters.min > sanitizedFilters.max) {
      errors.push(`${fieldName} minimum must be less than maximum`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters: errors.length === 0 ? sanitizedFilters : {}
    };
  }

  /**
   * Validate and sanitize array filter
   */
  static validateArrayFilter(
    array: any,
    fieldName: string,
    allowedValues?: string[],
    maxLength?: number
  ): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedFilters: any = {};

    if (!array) {
      return { isValid: true, errors: [], sanitizedFilters: {} };
    }

    if (!Array.isArray(array)) {
      errors.push(`${fieldName} must be an array`);
      return { isValid: false, errors, sanitizedFilters: {} };
    }

    if (maxLength && array.length > maxLength) {
      errors.push(`${fieldName} cannot have more than ${maxLength} items`);
    }

    if (allowedValues) {
      const invalidValues = array.filter(value => !allowedValues.includes(value));
      if (invalidValues.length > 0) {
        errors.push(`${fieldName} contains invalid values: ${invalidValues.join(', ')}`);
      }
    }

    if (errors.length === 0) {
      sanitizedFilters.values = [...array];
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters: errors.length === 0 ? sanitizedFilters : {}
    };
  }

  /**
   * Validate and sanitize search term
   */
  static validateSearchTermFilter(searchTerm: any): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedFilters: any = {};

    if (!searchTerm) {
      return { isValid: true, errors: [], sanitizedFilters: {} };
    }

    if (typeof searchTerm !== 'string') {
      errors.push('Search term must be a string');
      return { isValid: false, errors, sanitizedFilters: {} };
    }

    const trimmed = searchTerm.trim();
    if (trimmed.length === 0) {
      return { isValid: true, errors: [], sanitizedFilters: {} };
    }

    if (trimmed.length < 2) {
      errors.push('Search term must be at least 2 characters long');
    } else if (trimmed.length > 100) {
      errors.push('Search term cannot be longer than 100 characters');
    } else {
      sanitizedFilters.searchTerm = trimmed;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters: errors.length === 0 ? sanitizedFilters : {}
    };
  }

  /**
   * Validate ObjectId filter
   */
  static validateObjectIdFilter(id: any, fieldName: string): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedFilters: any = {};

    if (!id) {
      return { isValid: true, errors: [], sanitizedFilters: {} };
    }

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      errors.push(`${fieldName} must be a valid ObjectId`);
    } else {
      sanitizedFilters.id = new mongoose.Types.ObjectId(id);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters: errors.length === 0 ? sanitizedFilters : {}
    };
  }

  /**
   * Validate enum filter
   */
  static validateEnumFilter(
    value: any,
    fieldName: string,
    allowedValues: string[]
  ): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedFilters: any = {};

    if (!value) {
      return { isValid: true, errors: [], sanitizedFilters: {} };
    }

    if (typeof value !== 'string') {
      errors.push(`${fieldName} must be a string`);
    } else if (!allowedValues.includes(value)) {
      errors.push(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    } else {
      sanitizedFilters.value = value;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters: errors.length === 0 ? sanitizedFilters : {}
    };
  }

  /**
   * Validate boolean filter
   */
  static validateBooleanFilter(value: any, fieldName: string): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedFilters: any = {};

    if (value === undefined || value === null) {
      return { isValid: true, errors: [], sanitizedFilters: {} };
    }

    if (typeof value === 'boolean') {
      sanitizedFilters.value = value;
    } else if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') {
        sanitizedFilters.value = true;
      } else if (lowerValue === 'false') {
        sanitizedFilters.value = false;
      } else {
        errors.push(`${fieldName} must be true or false`);
      }
    } else {
      errors.push(`${fieldName} must be a boolean value`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters: errors.length === 0 ? sanitizedFilters : {}
    };
  }

  /**
   * Validate provider search filters
   */
  static validateProviderSearchFilters(filters: any): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedFilters: any = {};

    // Validate services array
    if (filters.services) {
      const servicesValidation = this.validateArrayFilter(
        filters.services,
        'services',
        undefined,
        20
      );
      if (!servicesValidation.isValid) {
        errors.push(...servicesValidation.errors);
      } else {
        sanitizedFilters.services = servicesValidation.sanitizedFilters.values;
      }
    }

    // Validate location
    if (filters.location) {
      const locationValidation = this.validateLocationFilter(filters.location);
      if (!locationValidation.isValid) {
        errors.push(...locationValidation.errors);
      } else {
        sanitizedFilters.location = locationValidation.sanitizedFilters;
      }
    }

    // Validate rating range
    if (filters.minRating !== undefined) {
      const ratingValidation = this.validateNumericRangeFilter(
        { min: filters.minRating },
        'rating',
        1,
        5
      );
      if (!ratingValidation.isValid) {
        errors.push(...ratingValidation.errors);
      } else {
        sanitizedFilters.minRating = ratingValidation.sanitizedFilters.min;
      }
    }

    // Validate hourly rate range
    if (filters.minHourlyRate !== undefined || filters.maxHourlyRate !== undefined) {
      const rateValidation = this.validateNumericRangeFilter(
        { min: filters.minHourlyRate, max: filters.maxHourlyRate },
        'hourly rate',
        0,
        10000
      );
      if (!rateValidation.isValid) {
        errors.push(...rateValidation.errors);
      } else {
        if (rateValidation.sanitizedFilters.min !== undefined) {
          sanitizedFilters.minHourlyRate = rateValidation.sanitizedFilters.min;
        }
        if (rateValidation.sanitizedFilters.max !== undefined) {
          sanitizedFilters.maxHourlyRate = rateValidation.sanitizedFilters.max;
        }
      }
    }

    // Validate search term
    if (filters.searchTerm) {
      const searchValidation = this.validateSearchTermFilter(filters.searchTerm);
      if (!searchValidation.isValid) {
        errors.push(...searchValidation.errors);
      } else {
        sanitizedFilters.searchTerm = searchValidation.sanitizedFilters.searchTerm;
      }
    }

    // Validate status
    if (filters.status) {
      const statusValidation = this.validateEnumFilter(
        filters.status,
        'status',
        ['active', 'inactive', 'pending', 'suspended']
      );
      if (!statusValidation.isValid) {
        errors.push(...statusValidation.errors);
      } else {
        sanitizedFilters.status = statusValidation.sanitizedFilters.value;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters
    };
  }

  /**
   * Validate service request search filters
   */
  static validateServiceRequestSearchFilters(filters: any): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedFilters: any = {};

    // Validate category
    if (filters.category) {
      const categoryValidation = this.validateEnumFilter(
        filters.category,
        'category',
        ['plumbing', 'electrical', 'cleaning', 'repair', 'maintenance', 'other']
      );
      if (!categoryValidation.isValid) {
        errors.push(...categoryValidation.errors);
      } else {
        sanitizedFilters.category = categoryValidation.sanitizedFilters.value;
      }
    }

    // Validate status
    if (filters.status) {
      const statusValidation = this.validateEnumFilter(
        filters.status,
        'status',
        ['pending', 'accepted', 'in_progress', 'completed', 'cancelled']
      );
      if (!statusValidation.isValid) {
        errors.push(...statusValidation.errors);
      } else {
        sanitizedFilters.status = statusValidation.sanitizedFilters.value;
      }
    }

    // Validate location
    if (filters.location) {
      const locationValidation = this.validateLocationFilter(filters.location);
      if (!locationValidation.isValid) {
        errors.push(...locationValidation.errors);
      } else {
        sanitizedFilters.location = locationValidation.sanitizedFilters;
      }
    }

    // Validate budget range
    if (filters.minBudget !== undefined || filters.maxBudget !== undefined) {
      const budgetValidation = this.validateNumericRangeFilter(
        { min: filters.minBudget, max: filters.maxBudget },
        'budget',
        0,
        100000
      );
      if (!budgetValidation.isValid) {
        errors.push(...budgetValidation.errors);
      } else {
        if (budgetValidation.sanitizedFilters.min !== undefined) {
          sanitizedFilters.minBudget = budgetValidation.sanitizedFilters.min;
        }
        if (budgetValidation.sanitizedFilters.max !== undefined) {
          sanitizedFilters.maxBudget = budgetValidation.sanitizedFilters.max;
        }
      }
    }

    // Validate date range
    if (filters.dateRange) {
      const dateValidation = this.validateDateRangeFilter(filters.dateRange);
      if (!dateValidation.isValid) {
        errors.push(...dateValidation.errors);
      } else {
        sanitizedFilters.dateRange = dateValidation.sanitizedFilters;
      }
    }

    // Validate user ID
    if (filters.userId) {
      const userIdValidation = this.validateObjectIdFilter(filters.userId, 'userId');
      if (!userIdValidation.isValid) {
        errors.push(...userIdValidation.errors);
      } else {
        sanitizedFilters.userId = filters.userId;
      }
    }

    // Validate provider ID
    if (filters.providerId) {
      const providerIdValidation = this.validateObjectIdFilter(filters.providerId, 'providerId');
      if (!providerIdValidation.isValid) {
        errors.push(...providerIdValidation.errors);
      } else {
        sanitizedFilters.providerId = filters.providerId;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters
    };
  }

  /**
   * Create default sort options for different entity types
   */
  static getDefaultSortOptions(entityType: string): any {
    switch (entityType.toLowerCase()) {
      case 'user':
        return { createdAt: -1 };
      case 'provider':
        return { averageRating: -1, createdAt: -1 };
      case 'servicerequest':
        return { createdAt: -1 };
      case 'review':
        return { createdAt: -1 };
      case 'chat':
        return { updatedAt: -1 };
      default:
        return { createdAt: -1 };
    }
  }

  /**
   * Sanitize and validate all common filters
   */
  static validateCommonFilters(filters: any): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedFilters: any = {};

    // Validate pagination
    const paginationValidation = this.validatePaginationFilter(filters);
    if (!paginationValidation.isValid) {
      errors.push(...paginationValidation.errors);
    } else {
      sanitizedFilters.pagination = paginationValidation.sanitizedFilters;
    }

    // Validate search term
    if (filters.searchTerm) {
      const searchValidation = this.validateSearchTermFilter(filters.searchTerm);
      if (!searchValidation.isValid) {
        errors.push(...searchValidation.errors);
      } else if (searchValidation.sanitizedFilters.searchTerm) {
        sanitizedFilters.searchTerm = searchValidation.sanitizedFilters.searchTerm;
      }
    }

    // Validate date range
    if (filters.dateRange) {
      const dateValidation = this.validateDateRangeFilter(filters.dateRange);
      if (!dateValidation.isValid) {
        errors.push(...dateValidation.errors);
      } else if (Object.keys(dateValidation.sanitizedFilters).length > 0) {
        sanitizedFilters.dateRange = dateValidation.sanitizedFilters;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilters
    };
  }
}
