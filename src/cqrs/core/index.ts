/**
 * Modern CQRS Core Implementation
 * 
 * Enhanced CQRS architecture with optimized patterns, dependency injection,
 * event sourcing capabilities, and comprehensive error handling.
 */

import { StrategyRegistry, AsyncStrategyRegistry } from '../../utils/conditions/StrategyPatterns';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';
import { AggregationBuilder } from '../../utils/aggregation/AggregationBuilder';

// Core CQRS Interfaces
export interface ICommand {
  readonly id: string;
  readonly type: string;
  readonly aggregateId?: string;
  readonly payload: any;
  readonly metadata: CommandMetadata;
  readonly timestamp: Date;
}

export interface IQuery {
  readonly id: string;
  readonly type: string;
  readonly payload: any;
  readonly metadata: QueryMetadata;
  readonly timestamp: Date;
}

export interface IEvent {
  readonly id: string;
  readonly type: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly version: number;
  readonly payload: any;
  readonly metadata: EventMetadata;
  readonly timestamp: Date;
}

export interface CommandMetadata {
  userId: string;
  correlationId: string;
  causationId?: string;
  source: string;
  version: string;
  traceId?: string;
  context?: Record<string, any>;
}

export interface QueryMetadata {
  userId: string;
  correlationId: string;
  source: string;
  version: string;
  traceId?: string;
  context?: Record<string, any>;
}

export interface EventMetadata {
  userId: string;
  correlationId: string;
  causationId: string;
  source: string;
  version: string;
  traceId?: string;
  context?: Record<string, any>;
}

// Handler Interfaces
export interface ICommandHandler<TCommand extends ICommand, TResult = any> {
  handle(command: TCommand): Promise<CommandResult<TResult>>;
  canHandle(command: ICommand): boolean;
}

export interface IQueryHandler<TQuery extends IQuery, TResult = any> {
  handle(query: TQuery): Promise<QueryResult<TResult>>;
  canHandle(query: IQuery): boolean;
}

export interface IEventHandler<TEvent extends IEvent> {
  handle(event: TEvent): Promise<void>;
  canHandle(event: IEvent): boolean;
}

// Result Types
export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  metadata?: any;
  events?: IEvent[];
  executionTime?: number;
}

export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  metadata?: any;
  pagination?: PaginationResult;
  executionTime?: number;
}

export interface PaginationResult {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Bus Interfaces
export interface ICommandBus {
  execute<TResult = any>(command: ICommand): Promise<CommandResult<TResult>>;
  register<TCommand extends ICommand>(
    commandType: string,
    handler: ICommandHandler<TCommand>
  ): void;
  unregister(commandType: string): void;
  getRegisteredHandlers(): string[];
}

export interface IQueryBus {
  execute<TResult = any>(query: IQuery): Promise<QueryResult<TResult>>;
  register<TQuery extends IQuery>(
    queryType: string,
    handler: IQueryHandler<TQuery>
  ): void;
  unregister(queryType: string): void;
  getRegisteredHandlers(): string[];
}

export interface IEventBus {
  publish(event: IEvent): Promise<void>;
  publishMany(events: IEvent[]): Promise<void>;
  subscribe<TEvent extends IEvent>(
    eventType: string,
    handler: IEventHandler<TEvent>
  ): void;
  unsubscribe(eventType: string, handlerId?: string): void;
  getSubscribedHandlers(): Record<string, string[]>;
}

// Base Classes
export abstract class BaseCommand implements ICommand {
  public readonly id: string;
  public readonly timestamp: Date;

  constructor(
    public readonly type: string,
    public readonly payload: any,
    public readonly metadata: CommandMetadata,
    public readonly aggregateId?: string
  ) {
    this.id = this.generateId();
    this.timestamp = new Date();
  }

  private generateId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export abstract class BaseQuery implements IQuery {
  public readonly id: string;
  public readonly timestamp: Date;

  constructor(
    public readonly type: string,
    public readonly payload: any,
    public readonly metadata: QueryMetadata
  ) {
    this.id = this.generateId();
    this.timestamp = new Date();
  }

  private generateId(): string {
    return `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export abstract class BaseEvent implements IEvent {
  public readonly id: string;
  public readonly timestamp: Date;

  constructor(
    public readonly type: string,
    public readonly aggregateId: string,
    public readonly aggregateType: string,
    public readonly version: number,
    public readonly payload: any,
    public readonly metadata: EventMetadata
  ) {
    this.id = this.generateId();
    this.timestamp = new Date();
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Enhanced Command Bus Implementation
export class EnhancedCommandBus implements ICommandBus {
  private handlers: StrategyRegistry<ICommand, CommandResult>;
  private middleware: Array<(command: ICommand, next: () => Promise<CommandResult>) => Promise<CommandResult>>;
  private eventBus?: IEventBus;

  constructor(eventBus?: IEventBus) {
    this.handlers = new StrategyRegistry<ICommand, CommandResult>();
    this.middleware = [];
    this.eventBus = eventBus;
  }

  register<TCommand extends ICommand>(
    commandType: string,
    handler: ICommandHandler<TCommand>
  ): void {
    this.handlers.register(commandType, {
      execute: async (command: ICommand) => {
        if (!handler.canHandle(command)) {
          throw new Error(`Handler cannot handle command of type: ${command.type}`);
        }
        return await handler.handle(command as TCommand);
      }
    });
  }

  unregister(commandType: string): void {
    this.handlers.unregister(commandType);
  }

  getRegisteredHandlers(): string[] {
    return this.handlers.getAvailableKeys();
  }

  addMiddleware(
    middleware: (command: ICommand, next: () => Promise<CommandResult>) => Promise<CommandResult>
  ): void {
    this.middleware.push(middleware);
  }

  async execute<TResult = any>(command: ICommand): Promise<CommandResult<TResult>> {
    const startTime = Date.now();

    try {
      // Validate command
      if (!command.type || !command.payload) {
        return {
          success: false,
          error: 'Invalid command: missing type or payload',
          executionTime: Date.now() - startTime
        };
      }

      // Execute middleware chain
      let middlewareIndex = 0;

      const executeNext = async (): Promise<CommandResult> => {
        if (middlewareIndex < this.middleware.length) {
          const middleware = this.middleware[middlewareIndex++];
          return await middleware(command, executeNext);
        } else {
          // Execute the actual handler
          if (!this.handlers.has(command.type)) {
            throw new Error(`No handler registered for command type: ${command.type}`);
          }
          return await this.handlers.execute(command.type, command);
        }
      };

      const result = await executeNext();

      // Publish events if any
      if (result.events && result.events.length > 0 && this.eventBus) {
        await this.eventBus.publishMany(result.events);
      }

      result.executionTime = Date.now() - startTime;
      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }
}

// Enhanced Query Bus Implementation
export class EnhancedQueryBus implements IQueryBus {
  private handlers: StrategyRegistry<IQuery, QueryResult>;
  private middleware: Array<(query: IQuery, next: () => Promise<QueryResult>) => Promise<QueryResult>>;
  private cache?: Map<string, { result: QueryResult; expiry: number }>;

  constructor(enableCache = false) {
    this.handlers = new StrategyRegistry<IQuery, QueryResult>();
    this.middleware = [];
    if (enableCache) {
      this.cache = new Map();
    }
  }

  register<TQuery extends IQuery>(
    queryType: string,
    handler: IQueryHandler<TQuery>
  ): void {
    this.handlers.register(queryType, {
      execute: async (query: IQuery) => {
        if (!handler.canHandle(query)) {
          throw new Error(`Handler cannot handle query of type: ${query.type}`);
        }
        return await handler.handle(query as TQuery);
      }
    });
  }

  unregister(queryType: string): void {
    this.handlers.unregister(queryType);
  }

  getRegisteredHandlers(): string[] {
    return this.handlers.getAvailableKeys();
  }

  addMiddleware(
    middleware: (query: IQuery, next: () => Promise<QueryResult>) => Promise<QueryResult>
  ): void {
    this.middleware.push(middleware);
  }

  async execute<TResult = any>(query: IQuery): Promise<QueryResult<TResult>> {
    const startTime = Date.now();

    try {
      // Check cache first
      if (this.cache) {
        const cacheKey = this.generateCacheKey(query);
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiry > Date.now()) {
          cached.result.executionTime = Date.now() - startTime;
          return cached.result;
        }
      }

      // Validate query
      if (!query.type || !query.payload) {
        return {
          success: false,
          error: 'Invalid query: missing type or payload',
          executionTime: Date.now() - startTime
        };
      }

      // Execute middleware chain
      let middlewareIndex = 0;

      const executeNext = async (): Promise<QueryResult> => {
        if (middlewareIndex < this.middleware.length) {
          const middleware = this.middleware[middlewareIndex++];
          return await middleware(query, executeNext);
        } else {
          // Execute the actual handler
          if (!this.handlers.has(query.type)) {
            throw new Error(`No handler registered for query type: ${query.type}`);
          }
          return await this.handlers.execute(query.type, query);
        }
      };

      const result = await executeNext();
      result.executionTime = Date.now() - startTime;

      // Cache result if caching is enabled
      if (this.cache && result.success) {
        const cacheKey = this.generateCacheKey(query);
        const expiry = Date.now() + (5 * 60 * 1000); // 5 minutes default
        this.cache.set(cacheKey, { result, expiry });
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  private generateCacheKey(query: IQuery): string {
    return `${query.type}_${JSON.stringify(query.payload)}`;
  }

  clearCache(): void {
    if (this.cache) {
      this.cache.clear();
    }
  }
}

// Enhanced Event Bus Implementation
export class EnhancedEventBus implements IEventBus {
  private handlers: AsyncStrategyRegistry<IEvent, void>;
  private eventStore?: IEvent[];

  constructor(enableEventStore = false) {
    this.handlers = new AsyncStrategyRegistry<IEvent, void>();
    if (enableEventStore) {
      this.eventStore = [];
    }
  }

  subscribe<TEvent extends IEvent>(
    eventType: string,
    handler: IEventHandler<TEvent>
  ): void {
    this.handlers.register(`${eventType}_${Date.now()}`, {
      execute: async (event: IEvent) => {
        if (handler.canHandle(event)) {
          await handler.handle(event as TEvent);
        }
      }
    });
  }

  unsubscribe(eventType: string, handlerId?: string): void {
    if (handlerId) {
      this.handlers.unregister(handlerId);
    } else {
      // Remove all handlers for this event type
      const keys = this.handlers.getAvailableKeys();
      keys.filter(key => key.startsWith(eventType)).forEach(key => {
        this.handlers.unregister(key);
      });
    }
  }

  getSubscribedHandlers(): Record<string, string[]> {
    const handlers: Record<string, string[]> = {};
    const keys = this.handlers.getAvailableKeys();
    
    keys.forEach(key => {
      const eventType = key.split('_')[0];
      if (!handlers[eventType]) {
        handlers[eventType] = [];
      }
      handlers[eventType].push(key);
    });

    return handlers;
  }

  async publish(event: IEvent): Promise<void> {
    // Store event if event store is enabled
    if (this.eventStore) {
      this.eventStore.push(event);
    }

    // Execute all handlers for this event type
    const keys = this.handlers.getAvailableKeys();
    const relevantHandlers = keys.filter(key => key.startsWith(event.type));

    await Promise.all(
      relevantHandlers.map(handlerKey =>
        this.handlers.execute(handlerKey, event).catch(error => {
          console.error(`Error in event handler ${handlerKey}:`, error);
        })
      )
    );
  }

  async publishMany(events: IEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }

  getEventStore(): IEvent[] | undefined {
    return this.eventStore ? [...this.eventStore] : undefined;
  }

  clearEventStore(): void {
    if (this.eventStore) {
      this.eventStore.length = 0;
    }
  }
}

// CQRS Factory for creating configured instances
export class CQRSFactory {
  static createCommandBus(options?: {
    enableEvents?: boolean;
    eventBus?: IEventBus;
  }): EnhancedCommandBus {
    const eventBus = options?.eventBus || (options?.enableEvents ? new EnhancedEventBus() : undefined);
    return new EnhancedCommandBus(eventBus);
  }

  static createQueryBus(options?: {
    enableCache?: boolean;
  }): EnhancedQueryBus {
    return new EnhancedQueryBus(options?.enableCache || false);
  }

  static createEventBus(options?: {
    enableEventStore?: boolean;
  }): EnhancedEventBus {
    return new EnhancedEventBus(options?.enableEventStore || false);
  }

  static createFullCQRSSystem(options?: {
    enableCache?: boolean;
    enableEventStore?: boolean;
  }): {
    commandBus: EnhancedCommandBus;
    queryBus: EnhancedQueryBus;
    eventBus: EnhancedEventBus;
  } {
    const eventBus = this.createEventBus(options);
    const commandBus = this.createCommandBus({ enableEvents: true, eventBus });
    const queryBus = this.createQueryBus(options);

    return { commandBus, queryBus, eventBus };
  }
}

// Utility functions
export class CQRSUtils {
  static createCommandMetadata(
    userId: string,
    source = 'api',
    context?: Record<string, any>
  ): CommandMetadata {
    return {
      userId,
      correlationId: this.generateCorrelationId(),
      source,
      version: '1.0.0',
      traceId: this.generateTraceId(),
      context
    };
  }

  static createQueryMetadata(
    userId: string,
    source = 'api',
    context?: Record<string, any>
  ): QueryMetadata {
    return {
      userId,
      correlationId: this.generateCorrelationId(),
      source,
      version: '1.0.0',
      traceId: this.generateTraceId(),
      context
    };
  }

  static createEventMetadata(
    userId: string,
    correlationId: string,
    causationId: string,
    source = 'api',
    context?: Record<string, any>
  ): EventMetadata {
    return {
      userId,
      correlationId,
      causationId,
      source,
      version: '1.0.0',
      traceId: this.generateTraceId(),
      context
    };
  }

  private static generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
