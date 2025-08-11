/**
 * LEGACY ROUTES - Kept for backward compatibility
 * 
 * The new modular architecture uses decorator-based controllers
 * that are automatically registered through the module system.
 * 
 * Traditional route files are no longer needed as controllers
 * are automatically attached using @decorators/express.
 */

// Legacy route exports for backward compatibility
export { authRoutes } from './auth';
export { userRoutes } from './user';
export { providerRoutes } from './provider';
export { requestRoutes } from './request';
export { chatRoutes } from './chat';
export { reviewRoutes } from './review';
export { adminRoutes } from './admin';

/**
 * NEW MODULAR SYSTEM
 * 
 * Routes are now handled by decorator-based controllers:
 * - AuthController.decorator.ts
 * - UserController.decorator.ts
 * - ProviderController.decorator.ts
 * - etc.
 * 
 * These controllers are automatically registered through modules
 * and use @Controller, @Get, @Post, etc. decorators.
 */
