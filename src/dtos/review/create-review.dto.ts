// Validation imports
import { IsString, IsOptional, IsArray, Length, ArrayMaxSize } from 'class-validator';

// Custom validation imports
import { IsObjectId, IsRating, IsUrl } from '../../utils/validation.utils';

/**
 * Create review DTO
 */
export class CreateReviewDto {
  @IsString({ message: 'Service request ID must be a string' })
  @IsObjectId({ message: 'Service request ID must be a valid MongoDB ObjectId' })
  serviceRequestId: string;

  @IsRating({ message: 'Rating must be an integer between 1 and 5' })
  rating: number;

  @IsString({ message: 'Title must be a string' })
  @Length(5, 100, { message: 'Title must be between 5 and 100 characters' })
  title: string;

  @IsString({ message: 'Comment must be a string' })
  @Length(10, 1000, { message: 'Comment must be between 10 and 1000 characters' })
  comment: string;

  @IsOptional()
  @IsArray({ message: 'Images must be an array' })
  @ArrayMaxSize(5, { message: 'Maximum 5 images allowed' })
  @IsUrl({ each: true, message: 'Each image must be a valid URL' })
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
