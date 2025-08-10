/**
 * Create review DTO
 */
export interface CreateReviewDto {
  serviceRequestId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

/**
 * Create review response DTO
 */
export interface CreateReviewResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    serviceRequestId: string;
    userId: string;
    providerId: string;
    rating: number;
    title: string;
    comment: string;
    images?: string[];
    isVerified: boolean;
    helpfulCount: number;
    createdAt: Date;
    user: {
      firstName: string;
      lastName: string;
      profileImage?: string;
    };
    serviceRequest: {
      title: string;
      category: string;
    };
  };
}

