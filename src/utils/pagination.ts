/**
 * Pagination utility functions
 */

import { PaginationMetaDto } from '../dtos/common/pagination.dto';

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  currentPage: number,
  totalItems: number,
  itemsPerPage: number
): PaginationMetaDto {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
}

/**
 * Calculate skip value for database queries
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(page?: number, limit?: number): { page: number; limit: number } {
  const validatedPage = Math.max(1, page || 1);
  const validatedLimit = Math.min(100, Math.max(1, limit || 10));
  
  return {
    page: validatedPage,
    limit: validatedLimit
  };
}
