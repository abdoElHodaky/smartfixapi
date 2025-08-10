// Dependency Injection Container
export { DIContainer } from './DIContainer';

// Service Container
export { ServiceContainer } from './ServiceContainer';

// Service Registry
export { ServiceRegistry } from './ServiceRegistry';

// Create and export global instances
export const serviceRegistry = new ServiceRegistry();
export const serviceContainer = ServiceContainer.getInstance();
