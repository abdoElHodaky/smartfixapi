export interface UserStatisticsDto {
  totalRequests: number;
  totalServiceRequests: number;
  pendingRequests: number;
  activeRequests: number;
  completedRequests: number;
  totalReviews: number;
}

export interface UserStatisticsRequestDto {
  userId: string;
}
