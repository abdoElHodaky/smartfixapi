/**
 * Strategy Interfaces Index
 * 
 * Exports all strategy-related interfaces
 */

export * from './ChatOperationInput';
export * from './MessageOperationInput';
export * from './RoomOperationInput';
export * from './NotificationOperationInput';

// Base strategy interface
export interface BaseStrategyInput {
  userId: string;
  metadata?: {
    timestamp: Date;
    source: string;
    requestId: string;
  };
}

// Common strategy result interface
export interface StrategyResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    executionTime: number;
    timestamp: Date;
  };
}

