/**
 * Conditional Logic Helper Functions
 * 
 * Provides reusable helper functions for common conditional patterns
 * to reduce code duplication and improve maintainability.
 */

import { Response } from 'express';
import { AuthRequest } from '../../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface RoleCheckOptions {
  allowedRoles: string[];
  requireActive?: boolean;
  requireEmailVerified?: boolean;
}

export interface LocationValidation {
  latitude: number;
  longitude: number;
}

export class ConditionalHelpers {
  /**
   * Check if user has required role
   */
  static hasRequiredRole(userRole: string, allowedRoles: string[]): boolean {
    return allowedRoles.includes(userRole);
  }

  /**
   * Check if user meets all role-based requirements
   */
  static validateUserRole(user: any, options: RoleCheckOptions): ValidationResult {
    const errors: string[] = [];

    if (!user) {
      errors.push('User not found');
      return { isValid: false, errors };
    }

    if (!this.hasRequiredRole(user.role, options.allowedRoles)) {
      errors.push(`Required role: ${options.allowedRoles.join(' or ')}`);
    }

    if (options.requireActive && !user.isActive) {
      errors.push('User account must be active');
    }

    if (options.requireEmailVerified && !user.isEmailVerified) {
      errors.push('Email verification required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user is admin or super admin
   */
  static isAdmin(userRole: string): boolean {
    return ['admin', 'super_admin'].includes(userRole);
  }

  /**
   * Check if user is provider
   */
  static isProvider(userRole: string): boolean {
    return userRole === 'provider';
  }

  /**
   * Check if user can access resource (admin or owner)
   */
  static canAccessResource(currentUserId: string, resourceUserId: string, userRole: string): boolean {
    return this.isAdmin(userRole) || currentUserId === resourceUserId;
  }

  /**
   * Validate location coordinates
   */
  static validateLocation(location: LocationValidation): ValidationResult {
    const errors: string[] = [];

    if (location.latitude < -90 || location.latitude > 90) {
      errors.push('Latitude must be between -90 and 90');
    }

    if (location.longitude < -180 || location.longitude > 180) {
      errors.push('Longitude must be between -180 and 180');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate required fields
   */
  static validateRequiredFields(data: any, requiredFields: string[]): ValidationResult {
    const errors: string[] = [];

    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim().length === 0)) {
        errors.push(`${field} is required`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate rating value
   */
  static validateRating(rating: number): ValidationResult {
    const errors: string[] = [];

    if (!rating || rating < 1 || rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate comment length
   */
  static validateComment(comment: string, minLength: number = 10): ValidationResult {
    const errors: string[] = [];

    if (!comment || comment.trim().length < minLength) {
      errors.push(`Comment must be at least ${minLength} characters long`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if array has minimum length
   */
  static hasMinimumLength<T>(array: T[], minLength: number): boolean {
    return array && array.length >= minLength;
  }

  /**
   * Check if value is within range
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Check if date is within range
   */
  static isDateInRange(date: Date, startDate?: Date, endDate?: Date): boolean {
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  }

  /**
   * Check multiple conditions with AND logic
   */
  static checkAllConditions(conditions: (() => boolean)[]): boolean {
    return conditions.every(condition => condition());
  }

  /**
   * Check multiple conditions with OR logic
   */
  static checkAnyCondition(conditions: (() => boolean)[]): boolean {
    return conditions.some(condition => condition());
  }

  /**
   * Validate portfolio item
   */
  static validatePortfolioItem(portfolioItem: any): ValidationResult {
    const requiredFields = ['title', 'description'];
    return this.validateRequiredFields(portfolioItem, requiredFields);
  }

  /**
   * Validate service request data
   */
  static validateServiceRequest(requestData: any): ValidationResult {
    const requiredFields = ['title', 'description', 'category', 'location'];
    return this.validateRequiredFields(requestData, requiredFields);
  }

  /**
   * Validate chat participants
   */
  static validateChatParticipants(participants: any[]): ValidationResult {
    const errors: string[] = [];

    if (!participants || participants.length < 2) {
      errors.push('Chat must have at least 2 participants');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate message content
   */
  static validateMessageContent(content: string): ValidationResult {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push('Message content cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user has provider access
   */
  static hasProviderAccess(user: any): boolean {
    return user && (user.role === 'provider' || user.role === 'admin');
  }

  /**
   * Check if user has admin access
   */
  static hasAdminAccess(user: any): boolean {
    return user && (user.role === 'admin' || user.role === 'super_admin');
  }

  /**
   * Validate services array
   */
  static validateServices(services: any[]): ValidationResult {
    const errors: string[] = [];

    if (!services || services.length === 0) {
      errors.push('At least one service must be provided');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create conditional response helper
   */
  static createConditionalResponse<T>(
    condition: boolean,
    successValue: T,
    failureValue: T
  ): T {
    return condition ? successValue : failureValue;
  }

  /**
   * Safe property access with default value
   */
  static safeGet<T>(obj: any, path: string, defaultValue: T): T {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current == null || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }

    return current !== undefined ? current : defaultValue;
  }

  /**
   * Check if object has all required properties
   */
  static hasAllProperties(obj: any, properties: string[]): boolean {
    return properties.every(prop => obj && obj.hasOwnProperty(prop));
  }

  /**
   * Validate email format (basic check)
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if string is not empty after trimming
   */
  static isNonEmptyString(value: any): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Validate numeric range
   */
  static validateNumericRange(value: number, min?: number, max?: number): ValidationResult {
    const errors: string[] = [];

    if (min !== undefined && value < min) {
      errors.push(`Value must be at least ${min}`);
    }

    if (max !== undefined && value > max) {
      errors.push(`Value must be at most ${max}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user status is active
   */
  static isActiveUser(user: any): boolean {
    return user && user.status === 'active';
  }

  /**
   * Validate array length range
   */
  static validateArrayLength<T>(array: T[], min?: number, max?: number): ValidationResult {
    const errors: string[] = [];

    if (!Array.isArray(array)) {
      errors.push('Value must be an array');
      return { isValid: false, errors };
    }

    if (min !== undefined && array.length < min) {
      errors.push(`Array must have at least ${min} items`);
    }

    if (max !== undefined && array.length > max) {
      errors.push(`Array must have at most ${max} items`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
