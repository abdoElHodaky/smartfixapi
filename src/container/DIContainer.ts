/**
 * Dependency Injection Container
 * Manages service registration, resolution, and lifecycle
 */

type ServiceFactory<T = any> = (...args: any[]) => T;
type ServiceConstructor<T = any> = new (...args: any[]) => T;

interface ServiceRegistration<T = any> {
  factory: ServiceFactory<T>;
  singleton: boolean;
  instance?: T;
  dependencies: string[];
}

export class DIContainer {
  private services = new Map<string, ServiceRegistration>();
  private resolving = new Set<string>();

  /**
   * Register a service with its factory function
   */
  register<T>(
    name: string,
    factory: ServiceFactory<T>,
    options: { singleton?: boolean; dependencies?: string[] } = {}
  ): void {
    const { singleton = true, dependencies = [] } = options;
    
    this.services.set(name, {
      factory,
      singleton,
      dependencies,
    });
  }

  /**
   * Register a service class with constructor injection
   */
  registerClass<T>(
    name: string,
    ServiceClass: ServiceConstructor<T>,
    options: { singleton?: boolean; dependencies?: string[] } = {}
  ): void {
    const { singleton = true, dependencies = [] } = options;
    
    const factory = (...args: any[]) => new ServiceClass(...args);
    
    this.register(name, factory, { singleton, dependencies });
  }

  /**
   * Resolve a service by name
   */
  resolve<T>(name: string): T {
    const registration = this.services.get(name);
    if (!registration) {
      throw new Error(`Service '${name}' is not registered`);
    }

    // Check for circular dependencies
    if (this.resolving.has(name)) {
      throw new Error(`Circular dependency detected for service '${name}'`);
    }

    // Return singleton instance if already created
    if (registration.singleton && registration.instance) {
      return registration.instance as T;
    }

    // Mark as resolving to detect circular dependencies
    this.resolving.add(name);

    try {
      // Resolve dependencies
      const dependencies = registration.dependencies.map(dep => this.resolve(dep));
      
      // Create service instance
      const instance = registration.factory(...dependencies);

      // Store singleton instance
      if (registration.singleton) {
        registration.instance = instance;
      }

      return instance as T;
    } finally {
      // Remove from resolving set
      this.resolving.delete(name);
    }
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.services.clear();
    this.resolving.clear();
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Create a child container that inherits from this container
   */
  createChild(): DIContainer {
    const child = new DIContainer();
    
    // Copy all registrations to child
    for (const [name, registration] of this.services) {
      child.services.set(name, { ...registration });
    }
    
    return child;
  }
}

