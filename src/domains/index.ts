/**
 * Domains - Root Export
 * 
 * Centralized access to all domain functionality
 */

// Domain Exports
export * from './auth';
export * from './user';
export * from './provider';
export * from './request';
export * from './review';
export * from './admin';
export * from './chat';
export * from './common';

// Re-export commonly used types and interfaces
export type { 
  // Add commonly used types here as needed
} from './common';

