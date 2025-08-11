import { IsString, IsEnum, IsOptional, ValidateNested, IsArray, IsNumber, Length, Min, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { IsObjectId, IsUrl } from '../../utils/validation.utils';

/**
 * Message attachment DTO
 */
export class MessageAttachmentDto {
  @IsString({ message: 'URL must be a string' })
  @IsUrl({ message: 'URL must be a valid URL' })
  url: string;

  @IsString({ message: 'Type must be a string' })
  @Length(1, 50, { message: 'Type must be between 1 and 50 characters' })
  type: string;

  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Length(1, 255, { message: 'Name must be between 1 and 255 characters' })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Size must be a number' })
  @Min(0, { message: 'Size must be at least 0' })
  size?: number;
}

/**
 * Send message DTO
 */
export class SendMessageDto {
  @IsString({ message: 'Sender ID must be a string' })
  @IsObjectId({ message: 'Sender ID must be a valid MongoDB ObjectId' })
  senderId: string;

  @IsString({ message: 'Content must be a string' })
  @Length(1, 2000, { message: 'Content must be between 1 and 2000 characters' })
  content: string;

  @IsEnum(['text', 'image', 'file', 'location', 'system'], { 
    message: 'Type must be text, image, file, location, or system' 
  })
  type: 'text' | 'image' | 'file' | 'location' | 'system';

  @IsOptional()
  @IsArray({ message: 'Attachments must be an array' })
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentDto)
  @ArrayMaxSize(10, { message: 'Maximum 10 attachments allowed' })
  attachments?: MessageAttachmentDto[];

  @IsOptional()
  @IsString({ message: 'Reply to must be a string' })
  @IsObjectId({ message: 'Reply to must be a valid MongoDB ObjectId' })
  replyTo?: string;

  @IsOptional()
  metadata?: {
    [key: string]: any;
  };
}
