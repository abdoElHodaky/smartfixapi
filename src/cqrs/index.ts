/**
 * CQRS Module Index
 * 
 * Central export point for all CQRS components
 */

// Types
export * from './types';

// Commands
export * from './commands/admin.commands';

// Queries
export * from './queries/admin.queries';

// Command Handlers
export * from './handlers/command/admin.command.handlers';

// Query Handlers
export * from './handlers/query/admin.query.handlers';

// Events (placeholder for future implementation)
// export * from './events/admin.events';

/**
 * CQRS Command Bus Interface
 */
export interface CommandBus {
  execute<T>(command: T): Promise<any>;
}

/**
 * CQRS Query Bus Interface
 */
export interface QueryBus {
  execute<T>(query: T): Promise<any>;
}

/**
 * Simple Command Bus Implementation
 */
export class SimpleCommandBus implements CommandBus {
  private handlers = new Map();

  register(commandType: string, handler: any) {
    this.handlers.set(commandType, handler);
  }

  async execute<T>(command: any): Promise<any> {
    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(`No handler registered for command type: ${command.type}`);
    }
    return await handler.handle(command);
  }
}

/**
 * Simple Query Bus Implementation
 */
export class SimpleQueryBus implements QueryBus {
  private handlers = new Map();

  register(queryType: string, handler: any) {
    this.handlers.set(queryType, handler);
  }

  async execute<T>(query: any): Promise<any> {
    const handler = this.handlers.get(query.type);
    if (!handler) {
      throw new Error(`No handler registered for query type: ${query.type}`);
    }
    return await handler.handle(query);
  }
}

