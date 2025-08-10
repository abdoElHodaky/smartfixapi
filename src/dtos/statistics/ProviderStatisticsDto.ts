export interface ProviderStatisticsDto {
  totalRequests: number;
  pendingRequests: number;
  activeRequests: number;
  completedRequests: number;
  totalReviews: number;
  averageRating: number;
}

export interface ProviderStatisticsRequestDto {
  providerId: string;
}
