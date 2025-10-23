/**
 * Platform Statistics DTOs
 * 
 * Interface definitions for platform-wide statistics
 */

export interface UserRoleStatsDto {
  _id: string;
  count: number;
}

export interface ProviderServiceStatsDto {
  _id: string;
  count: number;
}

export interface RequestStatusStatsDto {
  _id: string;
  count: number;
}

export interface PlatformStatisticsDto {
  userRoleStats: UserRoleStatsDto[];
  providerServiceStats: ProviderServiceStatsDto[];
  requestStatusStats: RequestStatusStatsDto[];
  averageRating: number;
  lastUpdated?: number;
}
