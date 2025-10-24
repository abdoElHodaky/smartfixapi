/**
 * Command Pattern Base Classes
 * 
 * Provides a foundation for implementing the Command pattern
 * to handle complex action-based operations in services.
 */

import { IsString, IsOptional, IsObject, validateSync } from 'class-validator';

/**
 * Base command interface
 */
export interface ICommand<TResult = any> {
  execute(): Promise<TResult>;
  undo?(): Promise<void>;
  validate(): boolean;
}

/**
 * Command execution context
 */
export interface CommandContext {
  userId?: string;
  adminId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Command result wrapper
 */
export class CommandResult<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
  metadata?: Record<string, any>;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    errors?: string[],
    metadata?: Record<string, any>
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;
    this.metadata = metadata;
  }

  static success<T>(data: T, message = 'Operation completed successfully'): CommandResult<T> {
    return new CommandResult(true, message, data);
  }

  static failure<T>(message: string, errors?: string[]): CommandResult<T> {
    return new CommandResult<T>(false, message, undefined, errors);
  }
}

/**
 * Abstract base command class
 */
export abstract class CommandBase<TResult = any> implements ICommand<TResult> {
  protected context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  /**
   * Execute the command
   */
  abstract execute(): Promise<TResult>;

  /**
   * Validate the command (override in subclasses)
   */
  validate(): boolean {
    const errors = validateSync(this);
    return errors.length === 0;
  }

  /**
   * Optional undo operation
   */
  async undo(): Promise<void> {
    throw new Error('Undo operation not implemented');
  }

  /**
   * Get command context
   */
  getContext(): CommandContext {
    return this.context;
  }

  /**
   * Update command context
   */
  updateContext(updates: Partial<CommandContext>): void {
    this.context = { ...this.context, ...updates };
  }
}

/**
 * Action command for handling action-based operations
 */
export abstract class ActionCommand<TData = any, TResult = any> extends CommandBase<TResult> {
  @IsString()
  protected action: string;

  @IsOptional()
  @IsObject()
  protected data?: TData;

  constructor(action: string, context: CommandContext, data?: TData) {
    super(context);
    this.action = action;
    this.data = data;
  }

  /**
   * Get the action type
   */
  getAction(): string {
    return this.action;
  }

  /**
   * Get the action data
   */
  getData(): TData | undefined {
    return this.data;
  }

  /**
   * Set action data
   */
  setData(data: TData): void {
    this.data = data;
  }
}

/**
 * Command invoker for executing commands
 */
export class CommandInvoker {
  private history: ICommand[] = [];
  private maxHistorySize = 100;

  constructor(maxHistorySize = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Execute a command
   */
  async execute<T>(command: ICommand<T>): Promise<T> {
    if (!command.validate()) {
      throw new Error('Command validation failed');
    }

    const result = await command.execute();
    
    // Add to history
    this.history.push(command);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    return result;
  }

  /**
   * Execute multiple commands in sequence
   */
  async executeSequence<T>(commands: ICommand<T>[]): Promise<T[]> {
    const results: T[] = [];
    
    for (const command of commands) {
      const result = await this.execute(command);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute multiple commands in parallel
   */
  async executeParallel<T>(commands: ICommand<T>[]): Promise<T[]> {
    const promises = commands.map(command => this.execute(command));
    return Promise.all(promises);
  }

  /**
   * Undo the last command
   */
  async undoLast(): Promise<void> {
    const lastCommand = this.history.pop();
    if (lastCommand && lastCommand.undo) {
      await lastCommand.undo();
    }
  }

  /**
   * Get command history
   */
  getHistory(): ICommand[] {
    return [...this.history];
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.history = [];
  }
}

/**
 * Command factory for creating commands
 */
export abstract class CommandFactory<TCommand extends ICommand> {
  /**
   * Create a command based on type and parameters
   */
  abstract createCommand(type: string, context: CommandContext, ...args: any[]): TCommand;

  /**
   * Get available command types
   */
  abstract getAvailableTypes(): string[];

  /**
   * Validate command type
   */
  isValidType(type: string): boolean {
    return this.getAvailableTypes().includes(type);
  }
}

/**
 * Command registry for managing command types
 */
export class CommandRegistry {
  private commands: Map<string, new (...args: any[]) => ICommand> = new Map();

  /**
   * Register a command class
   */
  register<T extends ICommand>(type: string, commandClass: new (...args: any[]) => T): void {
    this.commands.set(type, commandClass);
  }

  /**
   * Create a command instance
   */
  create<T extends ICommand>(type: string, ...args: any[]): T {
    const CommandClass = this.commands.get(type);
    if (!CommandClass) {
      throw new Error(`Command type '${type}' not registered`);
    }
    return new CommandClass(...args) as T;
  }

  /**
   * Check if command type is registered
   */
  has(type: string): boolean {
    return this.commands.has(type);
  }

  /**
   * Get all registered command types
   */
  getTypes(): string[] {
    return Array.from(this.commands.keys());
  }

  /**
   * Unregister a command type
   */
  unregister(type: string): boolean {
    return this.commands.delete(type);
  }

  /**
   * Clear all registered commands
   */
  clear(): void {
    this.commands.clear();
  }
}

/**
 * Composite command for executing multiple commands as one
 */
export class CompositeCommand extends CommandBase<any[]> {
  private commands: ICommand[] = [];

  constructor(context: CommandContext, commands: ICommand[] = []) {
    super(context);
    this.commands = commands;
  }

  /**
   * Add a command to the composite
   */
  addCommand(command: ICommand): void {
    this.commands.push(command);
  }

  /**
   * Remove a command from the composite
   */
  removeCommand(command: ICommand): void {
    const index = this.commands.indexOf(command);
    if (index > -1) {
      this.commands.splice(index, 1);
    }
  }

  /**
   * Execute all commands in sequence
   */
  async execute(): Promise<any[]> {
    const results: any[] = [];
    
    for (const command of this.commands) {
      if (!command.validate()) {
        throw new Error(`Command validation failed: ${command.constructor.name}`);
      }
      const result = await command.execute();
      results.push(result);
    }

    return results;
  }

  /**
   * Undo all commands in reverse order
   */
  async undo(): Promise<void> {
    const reversedCommands = [...this.commands].reverse();
    
    for (const command of reversedCommands) {
      if (command.undo) {
        await command.undo();
      }
    }
  }

  /**
   * Validate all commands
   */
  validate(): boolean {
    return this.commands.every(command => command.validate());
  }
}
