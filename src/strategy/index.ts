/**
 * Strategy Pattern Implementations
 * 
 * Centralized location for all strategy patterns used across services
 * for better separation of concerns and maintainability.
 */

// Base strategy interfaces
export * from './interfaces/BaseStrategy';
export * from './interfaces/ServiceStrategy';

// Admin strategies
export * from './admin/AdminStrategies';

// User strategies  
export * from './user/UserStrategies';

// Auth strategies
export * from './auth/AuthStrategies';

// Provider strategies
export * from './provider/ProviderStrategies';

// Service request strategies
export * from './request/ServiceRequestStrategies';

// Review strategies
export * from './review/ReviewStrategies';

// Chat strategies
export * from './chat/ChatStrategies';
