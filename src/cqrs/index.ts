/**
 * Modern CQRS Module Index
 * 
 * Central export point for the new enhanced CQRS architecture
 * with optimized patterns, event sourcing, and comprehensive utilities.
 */

// Core CQRS Infrastructure
export * from './core';

// Command Implementations
export * from './command/AdminCommands';
export * from './command/UserCommands';
export * from './command/index';

// Query Implementations (to be created)
// export * from './query';

// Event Implementations (to be created)
// export * from './event';

// Re-export for backward compatibility
export {
  EnhancedCommandBus as CommandBus,
  EnhancedQueryBus as QueryBus,
  EnhancedEventBus as EventBus,
} from './core';

/**
 * CQRS System Factory
 * 
 * Provides pre-configured CQRS system instances for different environments
 */
import { CQRSFactory } from './core';

export class CQRSSystemFactory {
  /**
   * Create development CQRS system with full features enabled
   */
  static createDevelopmentSystem() {
    return CQRSFactory.createFullCQRSSystem({
      enableCache: true,
      enableEventStore: true,
    });
  }

  /**
   * Create production CQRS system with optimized settings
   */
  static createProductionSystem() {
    return CQRSFactory.createFullCQRSSystem({
      enableCache: true,
      enableEventStore: false, // Disable in-memory event store for production
    });
  }

  /**
   * Create testing CQRS system with minimal features
   */
  static createTestingSystem() {
    return CQRSFactory.createFullCQRSSystem({
      enableCache: false,
      enableEventStore: true,
    });
  }
}

/**
 * CQRS Middleware Registry
 * 
 * Common middleware for command and query processing
 */
export class CQRSMiddleware {
  /**
   * Logging middleware for commands
   */
  static loggingMiddleware() {
    return async (command: any, next: () => Promise<any>) => {
      console.log(`[CQRS] Executing command: ${command.type}`, {
        id: command.id,
        timestamp: command.timestamp,
        userId: command.metadata?.userId,
      });
      
      const startTime = Date.now();
      try {
        const result = await next();
        const duration = Date.now() - startTime;
        
        console.log(`[CQRS] Command completed: ${command.type}`, {
          success: result.success,
          duration: `${duration}ms`,
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[CQRS] Command failed: ${command.type}`, {
          error: error.message,
          duration: `${duration}ms`,
        });
        throw error;
      }
    };
  }

  /**
   * Validation middleware for commands
   */
  static validationMiddleware() {
    return async (command: any, next: () => Promise<any>) => {
      // Basic validation
      if (!command.type) {
        throw new Error('Command type is required');
      }
      
      if (!command.payload) {
        throw new Error('Command payload is required');
      }
      
      if (!command.metadata?.userId) {
        throw new Error('User ID is required in command metadata');
      }
      
      return await next();
    };
  }

  /**
   * Rate limiting middleware for commands
   */
  static rateLimitingMiddleware(maxRequestsPerMinute: number = 60) {
    const requestCounts = new Map<string, { count: number; resetTime: number }>();
    
    return async (command: any, next: () => Promise<any>) => {
      const userId = command.metadata?.userId;
      if (!userId) {
        return await next();
      }
      
      const now = Date.now();
      const windowStart = Math.floor(now / 60000) * 60000; // 1-minute window
      
      const userRequests = requestCounts.get(userId);
      
      if (!userRequests || userRequests.resetTime !== windowStart) {
        requestCounts.set(userId, { count: 1, resetTime: windowStart });
      } else {
        userRequests.count++;
        
        if (userRequests.count > maxRequestsPerMinute) {
          throw new Error(`Rate limit exceeded: ${maxRequestsPerMinute} requests per minute`);
        }
      }
      
      return await next();
    };
  }

  /**
   * Authentication middleware for commands
   */
  static authenticationMiddleware() {
    return async (command: any, next: () => Promise<any>) => {
      const userId = command.metadata?.userId;
      const source = command.metadata?.source;
      
      // Skip authentication for system commands
      if (source === 'system') {
        return await next();
      }
      
      if (!userId) {
        throw new Error('Authentication required: User ID missing');
      }
      
      // Additional authentication logic would go here
      // For now, just ensure we have a valid user ID format
      if (typeof userId !== 'string' || userId.length < 1) {
        throw new Error('Invalid user ID format');
      }
      
      return await next();
    };
  }
}
