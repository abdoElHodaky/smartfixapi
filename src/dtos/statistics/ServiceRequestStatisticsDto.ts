export interface ServiceRequestStatisticsDto {
  totalRequests: number;
  pendingRequests: number;
  activeRequests: number;
  completedRequests: number;
  cancelledRequests: number;
}

export interface ServiceRequestStatisticsRequestDto {
  userId?: string;
  providerId?: string;
}
