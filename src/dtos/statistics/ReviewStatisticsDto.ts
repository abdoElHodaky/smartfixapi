export interface ReviewStatisticsDto {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export interface ReviewStatisticsRequestDto {
  providerId?: string;
  userId?: string;
  serviceRequestId?: string;
}
