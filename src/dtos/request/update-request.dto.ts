import { IsString, IsEnum, IsOptional, ValidateNested, IsArray, IsDateString, Length, ArrayMaxSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { IsUrl } from '../../utils/validation.utils';
import { BudgetDto } from './create-request.dto';

/**
 * Update service request DTO
 */
export class UpdateRequestDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @Length(5, 100, { message: 'Title must be between 5 and 100 characters' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @Length(20, 1000, { message: 'Description must be between 20 and 1000 characters' })
  description?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'], { message: 'Urgency must be low, medium, or high' })
  urgency?: 'low' | 'medium' | 'high';

  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetDto)
  budget?: BudgetDto;

  @IsOptional()
  @IsDateString({}, { message: 'Preferred date must be a valid date string' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  preferredDate?: Date;

  @IsOptional()
  @IsArray({ message: 'Images must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 images allowed' })
  @IsUrl({ each: true, message: 'Each image must be a valid URL' })
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
