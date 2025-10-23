/**
 * Admin Dashboard DTOs
 * 
 * Interface definitions for admin dashboard statistics
 */

export interface UserStatsDto {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  growthRate: number;
}

export interface ProviderStatsDto {
  total: number;
  verified: number;
  pending: number;
  active: number;
  newThisMonth: number;
  averageRating: number;
}

export interface ServiceRequestStatsDto {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  thisMonth: number;
  completionRate: number;
}

export interface RevenueStatsDto {
  total: number;
  thisMonth: number;
  lastMonth: number;
  growthRate: number;
  averageOrderValue: number;
}

export interface AdminDashboardDto {
  users: UserStatsDto;
  providers: ProviderStatsDto;
  serviceRequests: ServiceRequestStatsDto;
  revenue: RevenueStatsDto;
  lastUpdated?: number;
}
