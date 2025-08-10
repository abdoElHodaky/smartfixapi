/**
 * Update review DTO
 */
export interface UpdateReviewDto {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

/**
 * Update review response DTO
 */
export interface UpdateReviewResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    rating: number;
    title: string;
    comment: string;
    images?: string[];
    updatedAt: Date;
  };
}

/**
 * Provider response DTO
 */
export interface ProviderResponseDto {
  response: string;
}

/**
 * Provider response response DTO
 */
export interface ProviderResponseResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    response: string;
    responseDate: Date;
  };
}

