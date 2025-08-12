import { IsNumber, IsOptional, ValidateNested, IsObject, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class UserRoleStatsDto {
  @IsNumber()
  _id: string;

  @IsNumber()
  count: number;
}

class ProviderServiceStatsDto {
  @IsNumber()
  _id: string;

  @IsNumber()
  count: number;
}

class RequestStatusStatsDto {
  @IsNumber()
  _id: string;

  @IsNumber()
  count: number;
}

export class PlatformStatisticsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserRoleStatsDto)
  userRoleStats: UserRoleStatsDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProviderServiceStatsDto)
  providerServiceStats: ProviderServiceStatsDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestStatusStatsDto)
  requestStatusStats: RequestStatusStatsDto[];

  @IsNumber()
  averageRating: number;

  @IsOptional()
  @IsNumber()
  lastUpdated?: number;
}
