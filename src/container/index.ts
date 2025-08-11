// LEGACY CONTAINERS - Kept for backward compatibility
export { DIContainer } from './DIContainer';
export { ServiceContainer } from './ServiceContainer';
export { ServiceRegistry } from './ServiceRegistry';

// NEW MODULAR SYSTEM
// Import the new decorator-based service registry and module manager
export { ServiceRegistry as DecoratorServiceRegistry } from '../services/ServiceRegistry.decorator';
export { moduleManager, ModuleManager } from '../decorators/module';

// Legacy instances for backward compatibility
export const serviceRegistry = new ServiceRegistry();
export const serviceContainer = ServiceContainer.getInstance();

// NEW: Module manager instance for the modular architecture
export { moduleManager as globalModuleManager };
