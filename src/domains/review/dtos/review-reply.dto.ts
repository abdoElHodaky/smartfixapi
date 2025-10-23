import { IsString, Length } from 'class-validator';

/**
 * Review reply DTO
 */
export class ReviewReplyDto {
  @IsString({ message: 'Reply must be a string' })
  @Length(1, 500, { message: 'Reply must be between 1 and 500 characters' })
  reply: string;
}

/**
 * Flag review DTO
 */
export class FlagReviewDto {
  @IsString({ message: 'Reason must be a string' })
  @Length(1, 200, { message: 'Reason must be between 1 and 200 characters' })
  reason: string;
}
