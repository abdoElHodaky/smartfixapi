import { IsString, IsBoolean, IsOptional, ValidateNested, IsEnum, IsArray, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Time slot DTO
 */
export class TimeSlotDto {
  @IsString({ message: 'Start time must be a string' })
  startTime: string; // Format: "HH:MM"

  @IsString({ message: 'End time must be a string' })
  endTime: string; // Format: "HH:MM"
}

/**
 * Daily availability DTO
 */
export class DailyAvailabilityDto {
  @IsBoolean({ message: 'Available must be a boolean' })
  available: boolean;

  @IsOptional()
  @IsArray({ message: 'Time slots must be an array' })
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  @ArrayMaxSize(10, { message: 'Maximum 10 time slots per day allowed' })
  timeSlots?: TimeSlotDto[];

  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}

/**
 * Weekly availability DTO
 */
export class WeeklyAvailabilityDto {
  @ValidateNested()
  @Type(() => DailyAvailabilityDto)
  monday: DailyAvailabilityDto;

  @ValidateNested()
  @Type(() => DailyAvailabilityDto)
  tuesday: DailyAvailabilityDto;

  @ValidateNested()
  @Type(() => DailyAvailabilityDto)
  wednesday: DailyAvailabilityDto;

  @ValidateNested()
  @Type(() => DailyAvailabilityDto)
  thursday: DailyAvailabilityDto;

  @ValidateNested()
  @Type(() => DailyAvailabilityDto)
  friday: DailyAvailabilityDto;

  @ValidateNested()
  @Type(() => DailyAvailabilityDto)
  saturday: DailyAvailabilityDto;

  @ValidateNested()
  @Type(() => DailyAvailabilityDto)
  sunday: DailyAvailabilityDto;
}

/**
 * Exception date DTO for special availability
 */
export class AvailabilityExceptionDto {
  @IsString({ message: 'Date must be a string' })
  date: string; // Format: "YYYY-MM-DD"

  @IsEnum(['unavailable', 'custom'], { message: 'Type must be unavailable or custom' })
  type: 'unavailable' | 'custom';

  @IsOptional()
  @ValidateNested()
  @Type(() => DailyAvailabilityDto)
  customAvailability?: DailyAvailabilityDto;

  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  reason?: string;
}

/**
 * Update availability DTO
 */
export class UpdateAvailabilityDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => WeeklyAvailabilityDto)
  weeklySchedule?: WeeklyAvailabilityDto;

  @IsOptional()
  @IsArray({ message: 'Exceptions must be an array' })
  @ValidateNested({ each: true })
  @Type(() => AvailabilityExceptionDto)
  @ArrayMaxSize(100, { message: 'Maximum 100 exceptions allowed' })
  exceptions?: AvailabilityExceptionDto[];

  @IsOptional()
  @IsString({ message: 'Timezone must be a string' })
  timezone?: string;

  @IsOptional()
  @IsBoolean({ message: 'Auto accept must be a boolean' })
  autoAcceptBookings?: boolean;
}

