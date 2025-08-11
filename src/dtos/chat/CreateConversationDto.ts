import { IsString, IsEnum, IsOptional, IsArray, Length, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { IsObjectId } from '../../utils/validation.utils';

/**
 * Create conversation DTO
 */
export class CreateConversationDto {
  @IsArray({ message: 'Participants must be an array' })
  @ArrayMinSize(1, { message: 'At least 1 participant is required' })
  @ArrayMaxSize(50, { message: 'Maximum 50 participants allowed' })
  @IsObjectId({ each: true, message: 'Each participant ID must be a valid MongoDB ObjectId' })
  participants: string[];

  @IsEnum(['direct', 'group', 'support'], { 
    message: 'Type must be direct, group, or support' 
  })
  type: 'direct' | 'group' | 'support';

  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @Length(1, 100, { message: 'Title must be between 1 and 100 characters' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @Length(1, 500, { message: 'Description must be between 1 and 500 characters' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Service request ID must be a string' })
  @IsObjectId({ message: 'Service request ID must be a valid MongoDB ObjectId' })
  serviceRequestId?: string;

  @IsOptional()
  metadata?: {
    [key: string]: any;
  };
}
