/**
 * Module Decorators for Organizing Application Architecture
 * 
 * This module provides decorators for creating modular applications with
 * proper dependency injection, service management, and controller organization.
 */

import 'reflect-metadata';
import { Container } from '@decorators/di';
import { ServiceUtils } from './service';

// Module metadata keys
export const MODULE_METADATA_KEY = Symbol('module:metadata');
export const MODULE_IMPORTS_KEY = Symbol('module:imports');
export const MODULE_PROVIDERS_KEY = Symbol('module:providers');
export const MODULE_CONTROLLERS_KEY = Symbol('module:controllers');
export const MODULE_EXPORTS_KEY = Symbol('module:exports');

/**
 * Module configuration interface
 */
export interface ModuleConfig {
  imports?: any[]; // Other modules to import
  providers?: any[]; // Services to provide
  controllers?: any[]; // Controllers to register
  exports?: any[]; // Services to export to other modules
  global?: boolean; // Whether this module should be globally available
}

/**
 * Module metadata interface
 */
export interface ModuleMetadata {
  name: string;
  config: ModuleConfig;
  container: Container;
  initialized: boolean;
  dependencies: string[];
}

/**
 * Module decorator
 */
export function Module(config: ModuleConfig = {}): ClassDecorator {
  return function (target: any) {
    const moduleName = target.name;
    
    // Store module metadata
    Reflect.defineMetadata(MODULE_METADATA_KEY, {
      name: moduleName,
      config,
      container: new Container(),
      initialized: false,
      dependencies: [],
    }, target);

    // Store individual metadata for easier access
    Reflect.defineMetadata(MODULE_IMPORTS_KEY, config.imports || [], target);
    Reflect.defineMetadata(MODULE_PROVIDERS_KEY, config.providers || [], target);
    Reflect.defineMetadata(MODULE_CONTROLLERS_KEY, config.controllers || [], target);
    Reflect.defineMetadata(MODULE_EXPORTS_KEY, config.exports || [], target);

    return target;
  };
}

/**
 * Module manager for handling module lifecycle and dependencies
 */
export class ModuleManager {
  private modules: Map<string, ModuleMetadata> = new Map();
  private globalContainer: Container = new Container();
  private initializationOrder: string[] = [];

  /**
   * Register a module
   */
  registerModule(moduleClass: any): void {
    const metadata = Reflect.getMetadata(MODULE_METADATA_KEY, moduleClass) as ModuleMetadata;
    
    if (!metadata) {
      throw new Error(`${moduleClass.name} is not decorated with @Module`);
    }

    // Create module instance
    const moduleInstance = new moduleClass();
    metadata.instance = moduleInstance;

    this.modules.set(metadata.name, metadata);
    console.log(`📦 Registered module: ${metadata.name}`);
  }

  /**
   * Initialize all modules with proper dependency resolution
   */
  async initializeModules(): Promise<void> {
    console.log('🔧 Initializing modules...');

    // Resolve module dependencies
    this.resolveModuleDependencies();

    // Initialize modules in dependency order
    for (const moduleName of this.initializationOrder) {
      await this.initializeModule(moduleName);
    }

    console.log('✅ All modules initialized successfully');
  }

  /**
   * Resolve module dependencies and determine initialization order
   */
  private resolveModuleDependencies(): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (moduleName: string) => {
      if (visiting.has(moduleName)) {
        throw new Error(`Circular dependency detected involving module: ${moduleName}`);
      }

      if (visited.has(moduleName)) {
        return;
      }

      visiting.add(moduleName);
      const module = this.modules.get(moduleName);
      
      if (module) {
        const imports = module.config.imports || [];
        
        for (const importedModule of imports) {
          const importedModuleName = importedModule.name;
          if (this.modules.has(importedModuleName)) {
            visit(importedModuleName);
          }
        }
      }

      visiting.delete(moduleName);
      visited.add(moduleName);
      order.push(moduleName);
    };

    // Visit all modules
    for (const moduleName of this.modules.keys()) {
      visit(moduleName);
    }

    this.initializationOrder = order;
    console.log('📋 Module initialization order:', order);
  }

  /**
   * Initialize a single module
   */
  private async initializeModule(moduleName: string): Promise<void> {
    const module = this.modules.get(moduleName);
    
    if (!module || module.initialized) {
      return;
    }

    console.log(`🔧 Initializing module: ${moduleName}`);

    try {
      // Import dependencies from other modules
      await this.importModuleDependencies(module);

      // Register providers (services)
      this.registerProviders(module);

      // Register controllers
      this.registerControllers(module);

      // Initialize services with lifecycle hooks
      await this.initializeServices(module);

      // Export services to global container if needed
      this.exportServices(module);

      module.initialized = true;
      console.log(`✅ Module ${moduleName} initialized successfully`);

    } catch (error) {
      console.error(`❌ Failed to initialize module ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Import dependencies from other modules
   */
  private async importModuleDependencies(module: ModuleMetadata): Promise<void> {
    const imports = module.config.imports || [];

    for (const importedModuleClass of imports) {
      const importedModuleName = importedModuleClass.name;
      const importedModule = this.modules.get(importedModuleName);

      if (!importedModule) {
        throw new Error(`Module ${importedModuleName} not found`);
      }

      if (!importedModule.initialized) {
        await this.initializeModule(importedModuleName);
      }

      // Import exported services
      const exports = importedModule.config.exports || [];
      for (const exportedService of exports) {
        const serviceName = exportedService.name || exportedService;
        const serviceInstance = importedModule.container.get(serviceName);
        
        module.container.provide([{
          provide: serviceName,
          useValue: serviceInstance,
        }]);
      }

      module.dependencies.push(importedModuleName);
    }
  }

  /**
   * Register providers (services) in module container
   */
  private registerProviders(module: ModuleMetadata): void {
    const providers = module.config.providers || [];

    const providerConfigs = providers.map(provider => {
      if (typeof provider === 'function') {
        return { provide: provider.name, useClass: provider };
      } else if (typeof provider === 'object' && provider.provide) {
        return provider;
      } else {
        throw new Error(`Invalid provider configuration in module ${module.name}`);
      }
    });

    if (providerConfigs.length > 0) {
      module.container.provide(providerConfigs);
      console.log(`  📋 Registered ${providerConfigs.length} providers in ${module.name}`);
    }
  }

  /**
   * Register controllers in module container
   */
  private registerControllers(module: ModuleMetadata): void {
    const controllers = module.config.controllers || [];

    for (const controller of controllers) {
      module.container.provide([{
        provide: controller.name,
        useClass: controller,
      }]);
    }

    if (controllers.length > 0) {
      console.log(`  🎮 Registered ${controllers.length} controllers in ${module.name}`);
    }
  }

  /**
   * Initialize services with lifecycle hooks
   */
  private async initializeServices(module: ModuleMetadata): Promise<void> {
    const providers = module.config.providers || [];

    for (const provider of providers) {
      try {
        const serviceName = typeof provider === 'function' ? provider.name : provider.provide;
        const serviceInstance = await module.container.get(serviceName);

        // Execute post-construct lifecycle methods
        await ServiceUtils.executePostConstruct(serviceInstance);

        console.log(`    ✅ Service ${serviceName} initialized`);
      } catch (error) {
        console.error(`    ❌ Failed to initialize service in ${module.name}:`, error);
        throw error;
      }
    }
  }

  /**
   * Export services to global container
   */
  private exportServices(module: ModuleMetadata): void {
    const exports = module.config.exports || [];

    for (const exportedService of exports) {
      const serviceName = typeof exportedService === 'function' ? exportedService.name : exportedService;
      const serviceInstance = module.container.get(serviceName);

      // Add to global container if module is global
      if (module.config.global) {
        this.globalContainer.provide([{
          provide: serviceName,
          useValue: serviceInstance,
        }]);
      }
    }

    if (exports.length > 0) {
      console.log(`  📤 Exported ${exports.length} services from ${module.name}`);
    }
  }

  /**
   * Get service from any module
   */
  getService<T>(serviceName: string, moduleName?: string): T {
    if (moduleName) {
      const module = this.modules.get(moduleName);
      if (!module) {
        throw new Error(`Module ${moduleName} not found`);
      }
      return module.container.get(serviceName);
    }

    // Try global container first
    try {
      return this.globalContainer.get(serviceName);
    } catch {
      // Search in all modules
      for (const module of this.modules.values()) {
        try {
          return module.container.get(serviceName);
        } catch {
          continue;
        }
      }
      throw new Error(`Service ${serviceName} not found in any module`);
    }
  }

  /**
   * Get module by name
   */
  getModule(moduleName: string): ModuleMetadata | undefined {
    return this.modules.get(moduleName);
  }

  /**
   * Get all modules
   */
  getAllModules(): ModuleMetadata[] {
    return Array.from(this.modules.values());
  }

  /**
   * Check if module exists
   */
  hasModule(moduleName: string): boolean {
    return this.modules.has(moduleName);
  }

  /**
   * Get module status
   */
  getModuleStatus(): { [moduleName: string]: boolean } {
    const status: { [moduleName: string]: boolean } = {};
    
    for (const [name, module] of this.modules) {
      status[name] = module.initialized;
    }

    return status;
  }

  /**
   * Shutdown all modules gracefully
   */
  async shutdownModules(): Promise<void> {
    console.log('🔄 Shutting down modules...');

    // Shutdown in reverse order
    const shutdownOrder = [...this.initializationOrder].reverse();

    for (const moduleName of shutdownOrder) {
      await this.shutdownModule(moduleName);
    }

    console.log('✅ All modules shut down successfully');
  }

  /**
   * Shutdown a single module
   */
  private async shutdownModule(moduleName: string): Promise<void> {
    const module = this.modules.get(moduleName);
    
    if (!module || !module.initialized) {
      return;
    }

    console.log(`🔄 Shutting down module: ${moduleName}`);

    try {
      // Execute pre-destroy lifecycle methods for all services
      const providers = module.config.providers || [];
      
      for (const provider of providers) {
        try {
          const serviceName = typeof provider === 'function' ? provider.name : provider.provide;
          const serviceInstance = module.container.get(serviceName);
          await ServiceUtils.executePreDestroy(serviceInstance);
        } catch (error) {
          console.error(`Error shutting down service in ${moduleName}:`, error);
        }
      }

      module.initialized = false;
      console.log(`✅ Module ${moduleName} shut down successfully`);

    } catch (error) {
      console.error(`❌ Error shutting down module ${moduleName}:`, error);
    }
  }

  /**
   * Health check for all modules
   */
  async healthCheck(): Promise<{ [moduleName: string]: boolean }> {
    const health: { [moduleName: string]: boolean } = {};

    for (const [name, module] of this.modules) {
      try {
        // Check if module is initialized
        health[name] = module.initialized;

        // Additional health checks could be added here
        // For example, checking if services are responsive
      } catch (error) {
        console.error(`Health check failed for module ${name}:`, error);
        health[name] = false;
      }
    }

    return health;
  }

  /**
   * Get global container
   */
  getGlobalContainer(): Container {
    return this.globalContainer;
  }

  /**
   * Log module status
   */
  logModuleStatus(): void {
    console.log('\n📊 Module Status:');
    console.log('═'.repeat(60));
    
    for (const [name, module] of this.modules) {
      const status = module.initialized ? '✅ Running' : '❌ Stopped';
      const providers = module.config.providers?.length || 0;
      const controllers = module.config.controllers?.length || 0;
      const dependencies = module.dependencies.length;
      
      console.log(`  ${name.padEnd(20)} ${status.padEnd(12)} P:${providers} C:${controllers} D:${dependencies}`);
    }
    
    console.log('═'.repeat(60));
    console.log(`Total Modules: ${this.modules.size}`);
    console.log(`Initialized: ${Array.from(this.modules.values()).filter(m => m.initialized).length}`);
    console.log('');
  }
}

// Create singleton module manager
export const moduleManager = new ModuleManager();

// Export for convenience
export default {
  Module,
  ModuleManager,
  moduleManager,
};

