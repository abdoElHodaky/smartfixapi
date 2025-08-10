/**
 * Portfolio item DTO
 */
export interface PortfolioItemDto {
  title: string;
  description: string;
  images?: string[];
  completedDate: Date;
}

/**
 * Create portfolio item response DTO
 */
export interface CreatePortfolioItemResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    description: string;
    images?: string[];
    completedDate: Date;
    providerId: string;
    createdAt: Date;
  };
}

/**
 * Portfolio response DTO
 */
export interface PortfolioResponseDto {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    title: string;
    description: string;
    images?: string[];
    completedDate: Date;
    createdAt: Date;
  }>;
}

