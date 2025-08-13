/**
 * Pagination parameters DTO
 */
export interface PaginationDto {
  page?: number;
  limit?: number;
}

/**
 * Pagination response metadata DTO
 */
export interface PaginationMetaDto {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response DTO
 */
export interface PaginatedResponseDto<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMetaDto;
}

