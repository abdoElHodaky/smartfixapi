/**
 * Update service request DTO
 */
export interface UpdateRequestDto {
  title?: string;
  description?: string;
  urgency?: 'low' | 'medium' | 'high';
  budget?: {
    min: number;
    max: number;
  };
  preferredDate?: Date;
  images?: string[];
}

/**
 * Update request response DTO
 */
export interface UpdateRequestResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    description: string;
    urgency: string;
    budget?: {
      min: number;
      max: number;
    };
    preferredDate?: Date;
    images?: string[];
    updatedAt: Date;
  };
}

