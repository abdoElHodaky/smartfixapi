import { IsString, IsOptional, IsArray, Length, ArrayMaxSize } from 'class-validator';
import { IsRating, IsUrl } from '../../utils/validation.utils';

/**
 * Update review DTO
 */
export class UpdateReviewDto {
  @IsOptional()
  @IsRating({ message: 'Rating must be an integer between 1 and 5' })
  rating?: number;

  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @Length(5, 100, { message: 'Title must be between 5 and 100 characters' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Comment must be a string' })
  @Length(10, 1000, { message: 'Comment must be between 10 and 1000 characters' })
  comment?: string;

  @IsOptional()
  @IsArray({ message: 'Images must be an array' })
  @ArrayMaxSize(5, { message: 'Maximum 5 images allowed' })
  @IsUrl({ each: true, message: 'Each image must be a valid URL' })
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
