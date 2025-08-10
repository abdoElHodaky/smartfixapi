// Authentication Services
export { AuthService } from './auth/AuthService';

// User Services
export { UserService } from './user/UserService';

// Provider Services
export { ProviderService } from './provider/ProviderService';

// Service Request Services
export { ServiceRequestService } from './request/ServiceRequestService';

// Chat Services
export { ChatService } from './chat/ChatService';

// Review Services
export { ReviewService } from './review/ReviewService';

// Admin Services
export { AdminService } from './admin/AdminService';

// Export service interfaces and types
export type {
  UserRegistrationData,
  ServiceProviderRegistrationData,
  LoginCredentials
} from './auth/AuthService';

export type {
  UserUpdateData,
  UserSearchFilters
} from './user/UserService';

export type {
  ProviderUpdateData,
  ProviderSearchFilters,
  PortfolioItem
} from './provider/ProviderService';

export type {
  ServiceMatchCriteria
} from './request/ServiceRequestService';

export type {
  MessageData,
  ChatFilters
} from './chat/ChatService';

export type {
  ReviewData,
  ReviewFilters,
  ReviewUpdateData
} from './review/ReviewService';

export type {
  AdminDashboardData,
  PlatformStatistics
} from './admin/AdminService';

