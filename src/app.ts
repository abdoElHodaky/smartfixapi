/**
 * SmartFix Service Providers Platform - Main Application
 * 
 * This is the main entry point that uses the new modular architecture
 * with decorator-based services and dependency injection.
 */

import 'reflect-metadata';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import the modular server from modules
import { ModularSmartFixServer } from './modules/ModularSmartFixServer';

/**
 * Main application entry point
 */
async function main() {
  console.log('🚀 Starting SmartFix Service Providers Platform...');
  console.log('🏗️  Using Modular Architecture with Decorator-based Services');

  try {
    // Create modular server instance
    const server = new ModularSmartFixServer();

    // Initialize the modular server
    await server.initialize();

    // Start the server
    await server.start();

    console.log('✅ SmartFix Platform started successfully!');
    console.log('🎯 Architecture: Modular with Dependency Injection');
    console.log('📦 All modules loaded and services initialized');

  } catch (error) {
    console.error('❌ Failed to start SmartFix Platform:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received. Initiating graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received. Initiating graceful shutdown...');
  process.exit(0);
});

// Start the application
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Application startup failed:', error);
    process.exit(1);
  });
}

// Export for testing and external use
export { main };
export default main;
