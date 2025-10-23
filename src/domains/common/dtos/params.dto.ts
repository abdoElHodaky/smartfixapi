import { IsString, IsOptional, IsUUID } from 'class-validator';
import { IsObjectId } from '../../../utils/validation.utils';

/**
 * MongoDB ObjectId parameter DTO
 */
export class ObjectIdParamDto {
  @IsString({ message: 'ID must be a string' })
  @IsObjectId({ message: 'ID must be a valid MongoDB ObjectId' })
  id: string;
}

/**
 * User ID parameter DTO
 */
export class UserIdParamDto {
  @IsString({ message: 'User ID must be a string' })
  @IsObjectId({ message: 'User ID must be a valid MongoDB ObjectId' })
  userId: string;
}

/**
 * Provider ID parameter DTO
 */
export class ProviderIdParamDto {
  @IsString({ message: 'Provider ID must be a string' })
  @IsObjectId({ message: 'Provider ID must be a valid MongoDB ObjectId' })
  providerId: string;
}

/**
 * Request ID parameter DTO
 */
export class RequestIdParamDto {
  @IsString({ message: 'Request ID must be a string' })
  @IsObjectId({ message: 'Request ID must be a valid MongoDB ObjectId' })
  requestId: string;
}

/**
 * Review ID parameter DTO
 */
export class ReviewIdParamDto {
  @IsString({ message: 'Review ID must be a string' })
  @IsObjectId({ message: 'Review ID must be a valid MongoDB ObjectId' })
  reviewId: string;
}

/**
 * Conversation ID parameter DTO
 */
export class ConversationIdParamDto {
  @IsString({ message: 'Conversation ID must be a string' })
  @IsObjectId({ message: 'Conversation ID must be a valid MongoDB ObjectId' })
  conversationId: string;
}

/**
 * Message ID parameter DTO
 */
export class MessageIdParamDto {
  @IsString({ message: 'Message ID must be a string' })
  @IsObjectId({ message: 'Message ID must be a valid MongoDB ObjectId' })
  messageId: string;
}

/**
 * Slug parameter DTO
 */
export class SlugParamDto {
  @IsString({ message: 'Slug must be a string' })
  slug: string;
}

/**
 * UUID parameter DTO
 */
export class UuidParamDto {
  @IsString({ message: 'UUID must be a string' })
  @IsUUID(4, { message: 'UUID must be a valid UUID v4' })
  uuid: string;
}

/**
 * Combined user and request ID parameters DTO
 */
export class UserRequestParamsDto {
  @IsString({ message: 'User ID must be a string' })
  @IsObjectId({ message: 'User ID must be a valid MongoDB ObjectId' })
  userId: string;

  @IsString({ message: 'Request ID must be a string' })
  @IsObjectId({ message: 'Request ID must be a valid MongoDB ObjectId' })
  requestId: string;
}

/**
 * Service Request ID parameter DTO
 */
export class ServiceRequestIdParamDto {
  @IsString({ message: 'Service Request ID must be a string' })
  @IsObjectId({ message: 'Service Request ID must be a valid MongoDB ObjectId' })
  serviceRequestId: string;
}

/**
 * Combined provider and service ID parameters DTO
 */
export class ProviderServiceParamsDto {
  @IsString({ message: 'Provider ID must be a string' })
  @IsObjectId({ message: 'Provider ID must be a valid MongoDB ObjectId' })
  providerId: string;

  @IsString({ message: 'Service ID must be a string' })
  @IsObjectId({ message: 'Service ID must be a valid MongoDB ObjectId' })
  serviceId: string;
}
