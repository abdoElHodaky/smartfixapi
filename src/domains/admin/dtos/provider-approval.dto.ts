import { IsString, IsOptional, IsBoolean, IsDateString, IsEnum, IsArray, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { IsObjectId } from '../../utils/validation.utils';

export enum ProviderApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended'
}

export enum DocumentType {
  ID_CARD = 'id_card',
  BUSINESS_LICENSE = 'business_license',
  INSURANCE = 'insurance',
  CERTIFICATION = 'certification',
  OTHER = 'other'
}

class DocumentDto {
  @IsString()
  type: DocumentType;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  uploadedAt?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

export class ProviderApprovalDto {
  @IsObjectId()
  id: string;

  @IsString()
  businessName: string;

  @IsString()
  ownerName: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;

  @IsArray()
  @IsString({ each: true })
  serviceTypes: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProviderApprovalStatus)
  status: ProviderApprovalStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents: DocumentDto[];

  @IsDateString()
  submittedAt: string;

  @IsOptional()
  @IsDateString()
  reviewedAt?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalJobs?: number;
}

export class ApproveProviderDto {
  @IsEnum(ProviderApprovalStatus)
  status: ProviderApprovalStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  approvedServiceTypes?: string[];
}

export class ProviderSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProviderApprovalStatus)
  status?: ProviderApprovalStatus;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

