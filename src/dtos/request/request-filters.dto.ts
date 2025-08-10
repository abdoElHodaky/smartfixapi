import { PaginationDto, LocationSearchDto } from '../common';

/**
 * Request search filters DTO
 */
export interface RequestFiltersDto extends PaginationDto {
  category?: string;
  urgency?: 'low' | 'medium' | 'high';
  status?: string;
  minBudget?: number;
  maxBudget?: number;
  location?: LocationSearchDto;
  search?: string;
}

/**
 * Request statistics filters DTO
 */
export interface RequestStatisticsFiltersDto {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  status?: string;
}

/**
 * Request statistics response DTO
 */
export interface RequestStatisticsResponseDto {
  success: boolean;
  message: string;
  data: {
    totalRequests: number;
    pendingRequests: number;
    activeRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    averageBudget: number;
    categoryDistribution: Array<{
      category: string;
      count: number;
    }>;
    urgencyDistribution: Array<{
      urgency: string;
      count: number;
    }>;
  };
}

