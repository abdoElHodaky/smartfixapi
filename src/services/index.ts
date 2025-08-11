// NEW DECORATOR-BASED SERVICES
// These services use advanced decorators for caching, retry logic, logging, and validation

// Authentication Services
export { AuthService } from './auth/AuthService.decorator';

// User Services
export { UserService } from './user/UserService.decorator';

// Provider Services
export { ProviderService } from './provider/ProviderService.decorator';

// Service Request Services
export { ServiceRequestService } from './request/ServiceRequestService.decorator';

// Review Services
export { ReviewService } from './review/ReviewService.decorator';

// Admin Services
export { AdminService } from './admin/AdminService.decorator';

// Chat Services
export { ChatService } from './chat/ChatService.decorator';

// Service Registry for Decorator-based Services
export { ServiceRegistry } from './ServiceRegistry.decorator';

// Export service interfaces and types from decorator services
export type {
  UserRegistrationData,
  ServiceProviderRegistrationData,
  LoginCredentials
} from './auth/AuthService.decorator';

export type {
  UserUpdateData,
  UserSearchFilters
} from './user/UserService.decorator';

export type {
  ProviderUpdateData,
  ProviderSearchFilters,
  PortfolioItem
} from './provider/ProviderService.decorator';

export type {
  ServiceMatchCriteria
} from './request/ServiceRequestService.decorator';

export type {
  MessageData,
  ChatFilters
} from './chat/ChatService.decorator';

export type {
  ReviewData,
  ReviewFilters,
  ReviewUpdateData
} from './review/ReviewService.decorator';

export type {
  AdminDashboardData,
  PlatformStatistics
} from './admin/AdminService.decorator';
