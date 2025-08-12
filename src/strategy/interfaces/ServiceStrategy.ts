/**
 * Service Strategy Interfaces
 * 
 * Specific strategy interfaces for different service domains
 */

import { BaseStrategyInput, ServiceOperationInput, SearchOperationInput, StatisticsOperationInput } from './BaseStrategy';

// User-specific strategy inputs
export interface UserOperationInput extends ServiceOperationInput {
  userId: string;
  includePassword?: boolean;
}

export interface UserSearchInput extends SearchOperationInput {
  filters: {
    name?: string;
    role?: string;
    location?: any;
    radius?: number;
    page?: number;
    limit?: number;
  };
}

export interface UserLocationInput extends BaseStrategyInput {
  userId: string;
  location?: { type: 'Point'; coordinates: [number, number] };
  coordinates?: [number, number];
  radius?: number;
}

export interface UserStatisticsInput extends BaseStrategyInput {
  userId: string;
  dateRange?: { from: Date; to: Date };
  includeDetails?: boolean;
}

// Auth-specific strategy inputs
export interface AuthOperationInput extends BaseStrategyInput {
  userId?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
  newPassword?: string;
  token?: string;
  userData?: any;
  providerData?: any;
}

export interface TokenOperationInput extends BaseStrategyInput {
  userId?: string;
  email?: string;
  role?: string;
  token?: string;
  expiresIn?: string;
}

export interface PasswordOperationInput extends BaseStrategyInput {
  password: string;
  hashedPassword?: string;
  saltRounds?: number;
}

export interface RegistrationInput extends BaseStrategyInput {
  userData: any;
  providerData?: any;
  role: 'user' | 'provider';
}

// Provider-specific strategy inputs
export interface ProviderOperationInput extends ServiceOperationInput {
  providerId: string;
  userId?: string;
}

export interface ProviderSearchInput extends SearchOperationInput {
  filters: {
    services?: string[];
    location?: any;
    radius?: number;
    minRating?: number;
    isVerified?: boolean;
    page?: number;
    limit?: number;
  };
}

export interface PortfolioOperationInput extends BaseStrategyInput {
  providerId: string;
  itemId?: string;
  portfolioItem?: any;
  updateData?: any;
}

// Service Request-specific strategy inputs
export interface ServiceRequestOperationInput extends ServiceOperationInput {
  requestId: string;
  userId?: string;
  providerId?: string;
}

export interface ServiceRequestSearchInput extends SearchOperationInput {
  filters: {
    status?: string;
    category?: string;
    location?: any;
    radius?: number;
    priceRange?: { min: number; max: number };
    dateRange?: { from: Date; to: Date };
    page?: number;
    limit?: number;
  };
}

export interface MatchingInput extends BaseStrategyInput {
  requestId: string;
  criteria?: {
    maxDistance?: number;
    minRating?: number;
    maxProviders?: number;
  };
}

// Review-specific strategy inputs
export interface ReviewOperationInput extends ServiceOperationInput {
  reviewId: string;
  userId?: string;
  providerId?: string;
  serviceRequestId?: string;
}

export interface ReviewSearchInput extends SearchOperationInput {
  filters: {
    userId?: string;
    providerId?: string;
    rating?: number;
    minRating?: number;
    maxRating?: number;
    dateRange?: { from: Date; to: Date };
    page?: number;
    limit?: number;
  };
}

export interface ReviewModerationInput extends BaseStrategyInput {
  reviewId: string;
  action: 'approve' | 'reject' | 'flag' | 'unflag';
  reason?: string;
}

// Chat-specific strategy inputs
export interface ChatOperationInput extends ServiceOperationInput {
  chatId?: string;
  roomId?: string;
  messageId?: string;
  userId?: string;
  recipientId?: string;
}

export interface MessageOperationInput extends BaseStrategyInput {
  messageId?: string;
  roomId: string;
  senderId: string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'system';
  attachments?: any[];
}

export interface RoomOperationInput extends BaseStrategyInput {
  roomId?: string;
  participants: string[];
  type?: 'direct' | 'group' | 'support';
  metadata?: any;
}
