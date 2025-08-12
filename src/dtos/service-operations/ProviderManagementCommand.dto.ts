/**
 * Provider Management Command DTOs
 * 
 * Structured DTOs for provider management operations to replace
 * complex method signatures with well-defined command objects.
 */

import { IsString, IsOptional, IsObject, IsEnum, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Provider management action types
 */
export enum ProviderManagementAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  SUSPEND = 'suspend',
  REACTIVATE = 'reactivate',
  UPDATE_VERIFICATION = 'update_verification',
  UPDATE_RATING = 'update_rating',
  UPDATE_SERVICES = 'update_services',
  UPDATE_PRICING = 'update_pricing',
  UPDATE_AVAILABILITY = 'update_availability',
  DELETE = 'delete'
}

/**
 * Provider verification data
 */
export class ProviderVerificationData {
  @IsBoolean()
  isVerified: boolean;

  @IsOptional()
  @IsString()
  verificationLevel?: 'basic' | 'standard' | 'premium';

  @IsOptional()
  @IsArray()
  verifiedDocuments?: string[];

  @IsOptional()
  @IsString()
  verificationNotes?: string;

  @IsOptional()
  @IsString()
  verifiedBy?: string;
}

/**
 * Provider suspension data
 */
export class ProviderSuspensionData {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  duration?: string; // e.g., '30d', '1y', 'permanent'

  @IsOptional()
  @IsBoolean()
  notifyProvider?: boolean = true;

  @IsOptional()
  @IsBoolean()
  suspendActiveRequests?: boolean = false;
}

/**
 * Provider services update data
 */
export class ProviderServicesUpdateData {
  @IsArray()
  services: string[];

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsArray()
  certifications?: string[];

  @IsOptional()
  @IsNumber()
  experienceYears?: number;
}

/**
 * Provider pricing update data
 */
export class ProviderPricingUpdateData {
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsObject()
  servicePricing?: Record<string, number>;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsOptional()
  @IsBoolean()
  negotiable?: boolean = false;
}

/**
 * Provider availability update data
 */
export class ProviderAvailabilityData {
  @IsOptional()
  @IsObject()
  schedule?: {
    monday?: { start: string; end: string; available: boolean };
    tuesday?: { start: string; end: string; available: boolean };
    wednesday?: { start: string; end: string; available: boolean };
    thursday?: { start: string; end: string; available: boolean };
    friday?: { start: string; end: string; available: boolean };
    saturday?: { start: string; end: string; available: boolean };
    sunday?: { start: string; end: string; available: boolean };
  };

  @IsOptional()
  @IsArray()
  unavailableDates?: Date[];

  @IsOptional()
  @IsBoolean()
  acceptingNewRequests?: boolean = true;

  @IsOptional()
  @IsNumber()
  maxConcurrentRequests?: number;
}

/**
 * Provider rating update data
 */
export class ProviderRatingUpdateData {
  @IsNumber()
  rating: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  adminOverride?: boolean = false;
}

/**
 * Main provider management command DTO
 */
export class ProviderManagementCommand {
  @IsString()
  adminId: string;

  @IsString()
  providerId: string;

  @IsEnum(ProviderManagementAction)
  action: ProviderManagementAction;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  data?: ProviderVerificationData | ProviderSuspensionData | ProviderServicesUpdateData | 
         ProviderPricingUpdateData | ProviderAvailabilityData | ProviderRatingUpdateData | 
         Record<string, any>;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  notifyProvider?: boolean = true;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  constructor(
    adminId: string,
    providerId: string,
    action: ProviderManagementAction,
    data?: any,
    options?: {
      reason?: string;
      notifyProvider?: boolean;
      metadata?: Record<string, any>;
    }
  ) {
    this.adminId = adminId;
    this.providerId = providerId;
    this.action = action;
    this.data = data;
    this.reason = options?.reason;
    this.notifyProvider = options?.notifyProvider ?? true;
    this.metadata = options?.metadata;
  }

  /**
   * Create a provider approval command
   */
  static approve(adminId: string, providerId: string, reason?: string): ProviderManagementCommand {
    return new ProviderManagementCommand(adminId, providerId, ProviderManagementAction.APPROVE, undefined, { reason });
  }

  /**
   * Create a provider rejection command
   */
  static reject(adminId: string, providerId: string, reason?: string): ProviderManagementCommand {
    return new ProviderManagementCommand(adminId, providerId, ProviderManagementAction.REJECT, undefined, { reason });
  }

  /**
   * Create a provider suspension command
   */
  static suspend(
    adminId: string,
    providerId: string,
    suspensionData: ProviderSuspensionData
  ): ProviderManagementCommand {
    return new ProviderManagementCommand(adminId, providerId, ProviderManagementAction.SUSPEND, suspensionData);
  }

  /**
   * Create a provider reactivation command
   */
  static reactivate(adminId: string, providerId: string, reason?: string): ProviderManagementCommand {
    return new ProviderManagementCommand(adminId, providerId, ProviderManagementAction.REACTIVATE, undefined, { reason });
  }

  /**
   * Create a verification update command
   */
  static updateVerification(
    adminId: string,
    providerId: string,
    verificationData: ProviderVerificationData
  ): ProviderManagementCommand {
    return new ProviderManagementCommand(adminId, providerId, ProviderManagementAction.UPDATE_VERIFICATION, verificationData);
  }

  /**
   * Create a services update command
   */
  static updateServices(
    adminId: string,
    providerId: string,
    servicesData: ProviderServicesUpdateData
  ): ProviderManagementCommand {
    return new ProviderManagementCommand(adminId, providerId, ProviderManagementAction.UPDATE_SERVICES, servicesData);
  }

  /**
   * Create a pricing update command
   */
  static updatePricing(
    adminId: string,
    providerId: string,
    pricingData: ProviderPricingUpdateData
  ): ProviderManagementCommand {
    return new ProviderManagementCommand(adminId, providerId, ProviderManagementAction.UPDATE_PRICING, pricingData);
  }

  /**
   * Create an availability update command
   */
  static updateAvailability(
    adminId: string,
    providerId: string,
    availabilityData: ProviderAvailabilityData
  ): ProviderManagementCommand {
    return new ProviderManagementCommand(adminId, providerId, ProviderManagementAction.UPDATE_AVAILABILITY, availabilityData);
  }

  /**
   * Create a rating update command
   */
  static updateRating(
    adminId: string,
    providerId: string,
    ratingData: ProviderRatingUpdateData
  ): ProviderManagementCommand {
    return new ProviderManagementCommand(adminId, providerId, ProviderManagementAction.UPDATE_RATING, ratingData);
  }

  /**
   * Create a provider deletion command
   */
  static delete(adminId: string, providerId: string, reason?: string): ProviderManagementCommand {
    return new ProviderManagementCommand(adminId, providerId, ProviderManagementAction.DELETE, undefined, { reason });
  }

  /**
   * Check if the command requires additional data
   */
  requiresData(): boolean {
    return [
      ProviderManagementAction.SUSPEND,
      ProviderManagementAction.UPDATE_VERIFICATION,
      ProviderManagementAction.UPDATE_SERVICES,
      ProviderManagementAction.UPDATE_PRICING,
      ProviderManagementAction.UPDATE_AVAILABILITY,
      ProviderManagementAction.UPDATE_RATING
    ].includes(this.action);
  }

  /**
   * Validate the command data based on action type
   */
  isValid(): boolean {
    if (this.requiresData() && !this.data) {
      return false;
    }

    switch (this.action) {
      case ProviderManagementAction.SUSPEND:
        return this.data instanceof ProviderSuspensionData || (this.data && typeof this.data === 'object');
      case ProviderManagementAction.UPDATE_VERIFICATION:
        return this.data instanceof ProviderVerificationData || (this.data && 'isVerified' in this.data);
      case ProviderManagementAction.UPDATE_SERVICES:
        return this.data instanceof ProviderServicesUpdateData || (this.data && 'services' in this.data);
      case ProviderManagementAction.UPDATE_PRICING:
        return this.data instanceof ProviderPricingUpdateData || (this.data && typeof this.data === 'object');
      case ProviderManagementAction.UPDATE_AVAILABILITY:
        return this.data instanceof ProviderAvailabilityData || (this.data && typeof this.data === 'object');
      case ProviderManagementAction.UPDATE_RATING:
        return this.data instanceof ProviderRatingUpdateData || (this.data && 'rating' in this.data);
      default:
        return true;
    }
  }

  /**
   * Get typed data for specific actions
   */
  getSuspensionData(): ProviderSuspensionData | undefined {
    return this.action === ProviderManagementAction.SUSPEND ? this.data as ProviderSuspensionData : undefined;
  }

  getVerificationData(): ProviderVerificationData | undefined {
    return this.action === ProviderManagementAction.UPDATE_VERIFICATION ? this.data as ProviderVerificationData : undefined;
  }

  getServicesData(): ProviderServicesUpdateData | undefined {
    return this.action === ProviderManagementAction.UPDATE_SERVICES ? this.data as ProviderServicesUpdateData : undefined;
  }

  getPricingData(): ProviderPricingUpdateData | undefined {
    return this.action === ProviderManagementAction.UPDATE_PRICING ? this.data as ProviderPricingUpdateData : undefined;
  }

  getAvailabilityData(): ProviderAvailabilityData | undefined {
    return this.action === ProviderManagementAction.UPDATE_AVAILABILITY ? this.data as ProviderAvailabilityData : undefined;
  }

  getRatingData(): ProviderRatingUpdateData | undefined {
    return this.action === ProviderManagementAction.UPDATE_RATING ? this.data as ProviderRatingUpdateData : undefined;
  }
}
