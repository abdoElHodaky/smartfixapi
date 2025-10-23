import { IsNumber, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class UserStatsDto {
  @IsNumber()
  total: number;

  @IsNumber()
  active: number;

  @IsNumber()
  inactive: number;

  @IsNumber()
  newThisMonth: number;

  @IsNumber()
  growthRate: number;
}

class ProviderStatsDto {
  @IsNumber()
  total: number;

  @IsNumber()
  verified: number;

  @IsNumber()
  pending: number;

  @IsNumber()
  active: number;

  @IsNumber()
  newThisMonth: number;

  @IsNumber()
  averageRating: number;
}

class ServiceRequestStatsDto {
  @IsNumber()
  total: number;

  @IsNumber()
  pending: number;

  @IsNumber()
  inProgress: number;

  @IsNumber()
  completed: number;

  @IsNumber()
  cancelled: number;

  @IsNumber()
  thisMonth: number;

  @IsNumber()
  completionRate: number;
}

class RevenueStatsDto {
  @IsNumber()
  total: number;

  @IsNumber()
  thisMonth: number;

  @IsNumber()
  lastMonth: number;

  @IsNumber()
  growthRate: number;

  @IsNumber()
  averageOrderValue: number;
}

export class AdminDashboardDto {
  @ValidateNested()
  @Type(() => UserStatsDto)
  @IsObject()
  users: UserStatsDto;

  @ValidateNested()
  @Type(() => ProviderStatsDto)
  @IsObject()
  providers: ProviderStatsDto;

  @ValidateNested()
  @Type(() => ServiceRequestStatsDto)
  @IsObject()
  serviceRequests: ServiceRequestStatsDto;

  @ValidateNested()
  @Type(() => RevenueStatsDto)
  @IsObject()
  revenue: RevenueStatsDto;

  @IsOptional()
  @IsNumber()
  lastUpdated?: number;
}

