/**
 * Strategy Pattern Implementations for Complex Conditional Logic
 * 
 * Provides strategy pattern implementations to replace complex switch statements
 * and nested conditional logic with maintainable, extensible patterns.
 */

export interface Strategy<T, R> {
  execute(input: T): R;
}

export interface AsyncStrategy<T, R> {
  execute(input: T): Promise<R>;
}

export interface StrategyContext<T, R> {
  strategy: Strategy<T, R>;
  setStrategy(strategy: Strategy<T, R>): void;
  execute(input: T): R;
}

export interface AsyncStrategyContext<T, R> {
  strategy: AsyncStrategy<T, R>;
  setStrategy(strategy: AsyncStrategy<T, R>): void;
  execute(input: T): Promise<R>;
}

/**
 * Generic Strategy Context Implementation
 */
export class GenericStrategyContext<T, R> implements StrategyContext<T, R> {
  constructor(public strategy: Strategy<T, R>) {}

  setStrategy(strategy: Strategy<T, R>): void {
    this.strategy = strategy;
  }

  execute(input: T): R {
    return this.strategy.execute(input);
  }
}

/**
 * Generic Async Strategy Context Implementation
 */
export class GenericAsyncStrategyContext<T, R> implements AsyncStrategyContext<T, R> {
  constructor(public strategy: AsyncStrategy<T, R>) {}

  setStrategy(strategy: AsyncStrategy<T, R>): void {
    this.strategy = strategy;
  }

  async execute(input: T): Promise<R> {
    return await this.strategy.execute(input);
  }
}

/**
 * Strategy Registry for managing multiple strategies
 */
export class StrategyRegistry<T, R> {
  private strategies: Map<string, Strategy<T, R>> = new Map();

  register(key: string, strategy: Strategy<T, R>): void {
    this.strategies.set(key, strategy);
  }

  get(key: string): Strategy<T, R> | undefined {
    return this.strategies.get(key);
  }

  execute(key: string, input: T): R {
    const strategy = this.get(key);
    if (!strategy) {
      throw new Error(`Strategy not found for key: ${key}`);
    }
    return strategy.execute(input);
  }

  has(key: string): boolean {
    return this.strategies.has(key);
  }

  getAvailableKeys(): string[] {
    return Array.from(this.strategies.keys());
  }
}

/**
 * Async Strategy Registry
 */
export class AsyncStrategyRegistry<T, R> {
  private strategies: Map<string, AsyncStrategy<T, R>> = new Map();

  register(key: string, strategy: AsyncStrategy<T, R>): void {
    this.strategies.set(key, strategy);
  }

  get(key: string): AsyncStrategy<T, R> | undefined {
    return this.strategies.get(key);
  }

  async execute(key: string, input: T): Promise<R> {
    const strategy = this.get(key);
    if (!strategy) {
      throw new Error(`Strategy not found for key: ${key}`);
    }
    return await strategy.execute(input);
  }

  has(key: string): boolean {
    return this.strategies.has(key);
  }

  getAvailableKeys(): string[] {
    return Array.from(this.strategies.keys());
  }
}

/**
 * Conditional Strategy Selector
 */
export class ConditionalStrategySelector<T, R> {
  private conditions: Array<{
    condition: (input: T) => boolean;
    strategy: Strategy<T, R>;
  }> = [];
  private defaultStrategy?: Strategy<T, R>;

  addCondition(condition: (input: T) => boolean, strategy: Strategy<T, R>): this {
    this.conditions.push({ condition, strategy });
    return this;
  }

  setDefault(strategy: Strategy<T, R>): this {
    this.defaultStrategy = strategy;
    return this;
  }

  execute(input: T): R {
    for (const { condition, strategy } of this.conditions) {
      if (condition(input)) {
        return strategy.execute(input);
      }
    }

    if (this.defaultStrategy) {
      return this.defaultStrategy.execute(input);
    }

    throw new Error('No matching strategy found and no default strategy set');
  }
}

/**
 * User Action Strategy Implementations
 */
export interface UserActionInput {
  userId: string;
  data?: any;
}

export interface UserActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export class ActivateUserStrategy implements AsyncStrategy<UserActionInput, UserActionResult> {
  async execute(input: UserActionInput): Promise<UserActionResult> {
    // Implementation would go here
    return {
      success: true,
      message: `User ${input.userId} activated successfully`,
      data: { status: 'active' }
    };
  }
}

export class DeactivateUserStrategy implements AsyncStrategy<UserActionInput, UserActionResult> {
  async execute(input: UserActionInput): Promise<UserActionResult> {
    return {
      success: true,
      message: `User ${input.userId} deactivated successfully`,
      data: { status: 'inactive' }
    };
  }
}

export class SuspendUserStrategy implements AsyncStrategy<UserActionInput, UserActionResult> {
  async execute(input: UserActionInput): Promise<UserActionResult> {
    return {
      success: true,
      message: `User ${input.userId} suspended successfully`,
      data: { status: 'suspended' }
    };
  }
}

export class DeleteUserStrategy implements AsyncStrategy<UserActionInput, UserActionResult> {
  async execute(input: UserActionInput): Promise<UserActionResult> {
    return {
      success: true,
      message: `User ${input.userId} deleted successfully`,
      data: null
    };
  }
}

export class UpdateUserRoleStrategy implements AsyncStrategy<UserActionInput, UserActionResult> {
  async execute(input: UserActionInput): Promise<UserActionResult> {
    return {
      success: true,
      message: `User ${input.userId} role updated successfully`,
      data: { role: input.data?.role }
    };
  }
}

/**
 * Provider Action Strategy Implementations
 */
export interface ProviderActionInput {
  providerId: string;
  data?: any;
}

export interface ProviderActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export class ApproveProviderStrategy implements AsyncStrategy<ProviderActionInput, ProviderActionResult> {
  async execute(input: ProviderActionInput): Promise<ProviderActionResult> {
    return {
      success: true,
      message: `Provider ${input.providerId} approved successfully`,
      data: { status: 'approved' }
    };
  }
}

export class RejectProviderStrategy implements AsyncStrategy<ProviderActionInput, ProviderActionResult> {
  async execute(input: ProviderActionInput): Promise<ProviderActionResult> {
    return {
      success: true,
      message: `Provider ${input.providerId} rejected successfully`,
      data: { status: 'rejected' }
    };
  }
}

export class SuspendProviderStrategy implements AsyncStrategy<ProviderActionInput, ProviderActionResult> {
  async execute(input: ProviderActionInput): Promise<ProviderActionResult> {
    return {
      success: true,
      message: `Provider ${input.providerId} suspended successfully`,
      data: { status: 'suspended' }
    };
  }
}

/**
 * Status Transition Strategy
 */
export interface StatusTransitionInput {
  currentStatus: string;
  newStatus: string;
  entityId: string;
  data?: any;
}

export interface StatusTransitionResult {
  success: boolean;
  message: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}

export class ServiceRequestStatusStrategy implements AsyncStrategy<StatusTransitionInput, StatusTransitionResult> {
  private allowedTransitions: Record<string, string[]> = {
    'pending': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  };

  async execute(input: StatusTransitionInput): Promise<StatusTransitionResult> {
    const { currentStatus, newStatus, entityId } = input;
    
    if (!this.allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    return {
      success: true,
      message: `Service request ${entityId} status updated from ${currentStatus} to ${newStatus}`,
      previousStatus: currentStatus,
      newStatus,
      timestamp: new Date()
    };
  }
}

/**
 * Validation Strategy Pattern
 */
export interface ValidationInput {
  data: any;
  context?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class EmailValidationStrategy implements Strategy<ValidationInput, ValidationResult> {
  execute(input: ValidationInput): ValidationResult {
    const { data } = input;
    const errors: string[] = [];
    
    if (!data.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export class PasswordValidationStrategy implements Strategy<ValidationInput, ValidationResult> {
  execute(input: ValidationInput): ValidationResult {
    const { data } = input;
    const errors: string[] = [];
    
    if (!data.password) {
      errors.push('Password is required');
    } else {
      if (data.password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/(?=.*[a-z])/.test(data.password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(data.password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(data.password)) {
        errors.push('Password must contain at least one number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Factory for creating pre-configured strategy registries
 */
export class StrategyFactory {
  static createUserActionRegistry(): AsyncStrategyRegistry<UserActionInput, UserActionResult> {
    const registry = new AsyncStrategyRegistry<UserActionInput, UserActionResult>();
    
    registry.register('activate', new ActivateUserStrategy());
    registry.register('deactivate', new DeactivateUserStrategy());
    registry.register('suspend', new SuspendUserStrategy());
    registry.register('delete', new DeleteUserStrategy());
    registry.register('update_role', new UpdateUserRoleStrategy());
    
    return registry;
  }

  static createProviderActionRegistry(): AsyncStrategyRegistry<ProviderActionInput, ProviderActionResult> {
    const registry = new AsyncStrategyRegistry<ProviderActionInput, ProviderActionResult>();
    
    registry.register('approve', new ApproveProviderStrategy());
    registry.register('reject', new RejectProviderStrategy());
    registry.register('suspend', new SuspendProviderStrategy());
    
    return registry;
  }

  static createValidationRegistry(): StrategyRegistry<ValidationInput, ValidationResult> {
    const registry = new StrategyRegistry<ValidationInput, ValidationResult>();
    
    registry.register('email', new EmailValidationStrategy());
    registry.register('password', new PasswordValidationStrategy());
    
    return registry;
  }

  static createStatusTransitionSelector(): ConditionalStrategySelector<StatusTransitionInput, Promise<StatusTransitionResult>> {
    const selector = new ConditionalStrategySelector<StatusTransitionInput, Promise<StatusTransitionResult>>();
    
    selector.addCondition(
      (input) => input.currentStatus.startsWith('service_request'),
      {
        execute: async (input) => {
          const strategy = new ServiceRequestStatusStrategy();
          return await strategy.execute(input);
        }
      }
    );
    
    return selector;
  }
}

