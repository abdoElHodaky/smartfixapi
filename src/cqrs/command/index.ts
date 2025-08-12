/**
 * CQRS Command Index
 * 
 * Centralized exports for all CQRS command implementations
 * with enhanced optimization and utility integration.
 */

// Admin Commands
export {
  ApproveProviderCommand,
  RejectProviderCommand,
  SuspendProviderCommand,
  DeleteUserCommand,
  GenerateReportCommand,
  BulkUpdateUserRolesCommand,
  AdminCommandFactory
} from './AdminCommands';

// User Commands
export {
  CreateUserCommand,
  UpdateUserProfileCommand,
  ChangePasswordCommand,
  SearchUsersCommand,
  GenerateUserAnalyticsCommand,
  UserCommandFactory
} from './UserCommands';

// Re-export base command utilities
export {
  CommandBase,
  CommandResult,
  CommandContext
} from '../../utils/service-optimization/CommandBase';

// Re-export utility classes for command building
export {
  FilterBuilder
} from '../../utils/service-optimization/FilterBuilder';

export {
  OptionsBuilder
} from '../../utils/service-optimization/OptionsBuilder';

export {
  PaginationOptions
} from '../../utils/service-optimization/PaginationOptions';

// Re-export strategy patterns for command factories
export {
  StrategyRegistry,
  AsyncStrategyRegistry,
  Strategy,
  AsyncStrategy
} from '../../utils/conditions/StrategyPatterns';

/**
 * Universal Command Factory
 * 
 * Provides a unified interface for creating all types of commands
 * using strategy patterns and optimized utilities.
 */
import { AdminCommandFactory } from './AdminCommands';
import { UserCommandFactory } from './UserCommands';
import { CommandBase } from '../../utils/service-optimization/CommandBase';
import { StrategyRegistry } from '../../utils/conditions/StrategyPatterns';

export class UniversalCommandFactory {
  private static factoryRegistry: StrategyRegistry<any, any> = new StrategyRegistry<any, any>();

  static {
    UniversalCommandFactory.initializeFactories();
  }

  private static initializeFactories(): void {
    // Register command factories by domain
    this.factoryRegistry.register('admin', {
      execute: (params: any) => AdminCommandFactory.createCommand(params.commandType, params.params)
    });

    this.factoryRegistry.register('user', {
      execute: (params: any) => UserCommandFactory.createCommand(params.commandType, params.params)
    });
  }

  /**
   * Create command from any domain using unified interface
   */
  static createCommand<T extends CommandBase>(
    domain: string,
    commandType: string,
    params: any
  ): T {
    if (!this.factoryRegistry.has(domain)) {
      throw new Error(`Unsupported command domain: ${domain}`);
    }

    return this.factoryRegistry.execute(domain, { commandType, params });
  }

  /**
   * Get available domains
   */
  static getAvailableDomains(): string[] {
    return this.factoryRegistry.getAvailableKeys();
  }

  /**
   * Get available command types for a domain
   */
  static getAvailableCommandTypes(domain: string): string[] {
    switch (domain) {
      case 'admin':
        return AdminCommandFactory.getAvailableCommandTypes();
      case 'user':
        return UserCommandFactory.getAvailableCommandTypes();
      default:
        throw new Error(`Unsupported domain: ${domain}`);
    }
  }

  /**
   * Create batch commands across multiple domains
   */
  static createBatchCommands(commandConfigs: Array<{
    domain: string;
    commandType: string;
    params: any;
  }>): CommandBase[] {
    return commandConfigs.map(config =>
      this.createCommand(config.domain, config.commandType, config.params)
    );
  }

  /**
   * Get command factory statistics
   */
  static getFactoryStats(): {
    domains: string[];
    totalCommandTypes: number;
    commandTypesByDomain: Record<string, string[]>;
  } {
    const domains = this.getAvailableDomains();
    const commandTypesByDomain: Record<string, string[]> = {};
    let totalCommandTypes = 0;

    domains.forEach(domain => {
      const commandTypes = this.getAvailableCommandTypes(domain);
      commandTypesByDomain[domain] = commandTypes;
      totalCommandTypes += commandTypes.length;
    });

    return {
      domains,
      totalCommandTypes,
      commandTypesByDomain
    };
  }
}

/**
 * Command execution utilities
 */
export class CommandExecutionUtils {
  /**
   * Execute command with error handling and logging
   */
  static async executeCommand<T>(
    command: CommandBase<T>,
    options?: {
      logExecution?: boolean;
      retryOnFailure?: boolean;
      maxRetries?: number;
    }
  ): Promise<T> {
    const startTime = Date.now();
    const opts = {
      logExecution: true,
      retryOnFailure: false,
      maxRetries: 3,
      ...options
    };

    try {
      if (opts.logExecution) {
        console.log(`Executing command: ${command.constructor.name}`);
      }

      // Validate command before execution
      if (!command.validate()) {
        throw new Error('Command validation failed');
      }

      const result = await command.execute();

      if (opts.logExecution) {
        const executionTime = Date.now() - startTime;
        console.log(`Command executed successfully in ${executionTime}ms: ${command.constructor.name}`);
      }

      return result;
    } catch (error) {
      if (opts.logExecution) {
        const executionTime = Date.now() - startTime;
        console.error(`Command failed after ${executionTime}ms: ${command.constructor.name}`, error);
      }

      if (opts.retryOnFailure && opts.maxRetries! > 0) {
        console.log(`Retrying command: ${command.constructor.name} (${opts.maxRetries} attempts remaining)`);
        return this.executeCommand(command, {
          ...opts,
          maxRetries: opts.maxRetries! - 1
        });
      }

      throw error;
    }
  }

  /**
   * Execute multiple commands in parallel
   */
  static async executeCommandsParallel<T>(
    commands: CommandBase<T>[],
    options?: {
      logExecution?: boolean;
      failFast?: boolean;
    }
  ): Promise<T[]> {
    const opts = {
      logExecution: true,
      failFast: true,
      ...options
    };

    if (opts.logExecution) {
      console.log(`Executing ${commands.length} commands in parallel`);
    }

    const startTime = Date.now();

    try {
      const results = await Promise.all(
        commands.map(command => this.executeCommand(command, { logExecution: false }))
      );

      if (opts.logExecution) {
        const executionTime = Date.now() - startTime;
        console.log(`All commands executed successfully in ${executionTime}ms`);
      }

      return results;
    } catch (error) {
      if (opts.logExecution) {
        const executionTime = Date.now() - startTime;
        console.error(`Parallel command execution failed after ${executionTime}ms`, error);
      }

      if (!opts.failFast) {
        // Execute commands individually to get partial results
        const results: (T | Error)[] = await Promise.allSettled(
          commands.map(command => this.executeCommand(command, { logExecution: false }))
        ).then(results => 
          results.map(result => 
            result.status === 'fulfilled' ? result.value : new Error(result.reason)
          )
        );

        return results.filter(result => !(result instanceof Error)) as T[];
      }

      throw error;
    }
  }

  /**
   * Execute commands in sequence
   */
  static async executeCommandsSequential<T>(
    commands: CommandBase<T>[],
    options?: {
      logExecution?: boolean;
      stopOnFailure?: boolean;
    }
  ): Promise<T[]> {
    const opts = {
      logExecution: true,
      stopOnFailure: true,
      ...options
    };

    if (opts.logExecution) {
      console.log(`Executing ${commands.length} commands sequentially`);
    }

    const results: T[] = [];
    const startTime = Date.now();

    for (let i = 0; i < commands.length; i++) {
      try {
        const result = await this.executeCommand(commands[i], { logExecution: false });
        results.push(result);
      } catch (error) {
        if (opts.logExecution) {
          console.error(`Command ${i + 1}/${commands.length} failed:`, error);
        }

        if (opts.stopOnFailure) {
          throw error;
        }
      }
    }

    if (opts.logExecution) {
      const executionTime = Date.now() - startTime;
      console.log(`Sequential command execution completed in ${executionTime}ms (${results.length}/${commands.length} successful)`);
    }

    return results;
  }
}
