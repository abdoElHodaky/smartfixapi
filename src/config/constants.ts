/**
 * Application constants
 */

// User roles
export const USER_ROLES = {
  USER: 'user',
  PROVIDER: 'provider',
  ADMIN: 'admin',
} as const;

// Service request statuses
export const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
} as const;

// Service categories
export const SERVICE_CATEGORIES = {
  PLUMBING: 'plumbing',
  ELECTRICAL: 'electrical',
  CLEANING: 'cleaning',
  CARPENTRY: 'carpentry',
  PAINTING: 'painting',
  APPLIANCE_REPAIR: 'appliance_repair',
  HVAC: 'hvac',
  GARDENING: 'gardening',
  PEST_CONTROL: 'pest_control',
  HANDYMAN: 'handyman',
  OTHER: 'other',
} as const;

// Provider verification status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

// Chat message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
} as const;

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Rate limiting
export const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  UPLOAD: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 10,
  },
} as const;

// JWT token expiration
export const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: '15m',
  REFRESH_TOKEN: '7d',
  RESET_TOKEN: '1h',
  VERIFICATION_TOKEN: '24h',
} as const;

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification',
  SERVICE_REQUEST: 'service_request',
  SERVICE_COMPLETED: 'service_completed',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  SERVICE_REQUEST: 'service_request',
  SERVICE_ACCEPTED: 'service_accepted',
  SERVICE_COMPLETED: 'service_completed',
  MESSAGE_RECEIVED: 'message_received',
  REVIEW_RECEIVED: 'review_received',
  PAYMENT_RECEIVED: 'payment_received',
} as const;

// Distance units
export const DISTANCE_UNITS = {
  KM: 'km',
  MILES: 'miles',
} as const;

// Default search radius (in kilometers)
export const DEFAULT_SEARCH_RADIUS = 25;

// Review rating range
export const RATING_RANGE = {
  MIN: 1,
  MAX: 5,
} as const;

// Provider availability status
export const AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline',
} as const;

// Working hours format
export const WORKING_HOURS = {
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday',
  SUNDAY: 'sunday',
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_RESET: 'Password reset successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  SERVICE_REQUEST_CREATED: 'Service request created successfully',
  SERVICE_REQUEST_UPDATED: 'Service request updated successfully',
  PROVIDER_REGISTERED: 'Provider registered successfully',
  REVIEW_CREATED: 'Review created successfully',
  MESSAGE_SENT: 'Message sent successfully',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INVALID_TOKEN: 'Invalid or expired token',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  SERVICE_REQUEST_NOT_FOUND: 'Service request not found',
  PROVIDER_NOT_FOUND: 'Service provider not found',
  REVIEW_NOT_FOUND: 'Review not found',
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_FAILED: 'Validation failed',
} as const;

