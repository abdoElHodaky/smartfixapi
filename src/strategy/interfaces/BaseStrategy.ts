/**
 * Base Strategy Interfaces
 * 
 * Core strategy pattern interfaces used across all service strategies
 */

import { CommandResult } from '../../utils/service-optimization/CommandBase';

/**
 * Base input interface for all strategy operations
 */
export interface BaseStrategyInput {
  requesterId?: string;
  metadata?: Record<string, any>;
}

/**
 * Service operation input interface
 */
export interface ServiceOperationInput extends BaseStrategyInput {
  entityId: string;
  data?: any;
}

/**
 * Search operation input interface
 */
export interface SearchOperationInput extends BaseStrategyInput {
  filters: any;
  includeInactive?: boolean;
}

/**
 * Statistics operation input interface
 */
export interface StatisticsOperationInput extends BaseStrategyInput {
  entityId: string;
  dateRange?: { from: Date; to: Date };
  includeDetails?: boolean;
}

/**
 * Batch operation input interface
 */
export interface BatchOperationInput extends BaseStrategyInput {
  entityIds: string[];
  operation: string;
  data?: any;
}

/**
 * Validation operation input interface
 */
export interface ValidationOperationInput extends BaseStrategyInput {
  data: any;
  rules?: Record<string, any>;
}

/**
 * Notification operation input interface
 */
export interface NotificationOperationInput extends BaseStrategyInput {
  recipientId: string;
  type: string;
  data: any;
  channels?: string[];
}
