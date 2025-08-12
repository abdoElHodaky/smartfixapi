/**
 * CQRS Types and Interfaces
 * 
 * Common types and interfaces for CQRS implementation
 */

export interface Command {
  readonly type: string;
  readonly payload: any;
  readonly metadata?: {
    userId: string;
    timestamp: Date;
    correlationId?: string;
  };
}

export interface Query {
  readonly type: string;
  readonly payload: any;
  readonly metadata?: {
    userId: string;
    timestamp: Date;
    correlationId?: string;
  };
}

export interface CommandHandler<T extends Command, R = any> {
  handle(command: T): Promise<R>;
}

export interface QueryHandler<T extends Query, R = any> {
  handle(query: T): Promise<R>;
}

export interface Event {
  readonly type: string;
  readonly payload: any;
  readonly metadata: {
    aggregateId: string;
    version: number;
    timestamp: Date;
    correlationId?: string;
  };
}

export interface EventHandler<T extends Event> {
  handle(event: T): Promise<void>;
}

// Base result types
export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: any;
}

export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

