/**
 * Provider Approval DTOs
 * 
 * Interface definitions for provider approval and management
 */

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

export interface DocumentDto {
  type: DocumentType;
  url: string;
  name?: string;
  uploadedAt?: string;
  verified?: boolean;
}

export interface ProviderApprovalDto {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessAddress?: string;
  serviceTypes: string[];
  description?: string;
  status: ProviderApprovalStatus;
  documents: DocumentDto[];
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  rating?: number;
  totalJobs?: number;
}

export interface ApproveProviderDto {
  status: ProviderApprovalStatus;
  notes?: string;
  approvedServiceTypes?: string[];
}

export interface ProviderSearchDto {
  search?: string;
  status?: ProviderApprovalStatus;
  serviceType?: string;
  page?: number;
  limit?: number;
}
