/**
 * SmartFix Service Providers Platform - Unified Application
 * 
 * This is the main entry point that uses the unified optimized architecture
 * with advanced performance tracking and enterprise-grade service management.
 */

import 'reflect-metadata';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import the unified container system
import { initializeContainer, getContainerHealth } from './container';

// Import the modular server from modules
import { ModularSmartFixServer } from './modules/ModularSmartFixServer';

/**
 * Main application entry point
 */
async function main() {
  console.log('🚀 Starting SmartFix Service Providers Platform...');
  console.log('🏗️  Using Unified Optimized Architecture');

  try {
    // Initialize the unified container system first
    console.log('🔧 Initializing container system...');
    await initializeContainer();
    
    // Verify container health
    const containerHealth = await getContainerHealth();
    console.log('📊 Container Health:', containerHealth);

    // Create modular server instance
    const server = new ModularSmartFixServer();

    // Start the server (initialization is handled internally)
    await server.start();

    console.log('✅ SmartFix Platform started successfully!');
    console.log('🎯 Architecture: Unified Optimized with Performance Tracking');
    console.log('📦 All modules loaded and services optimized');
    console.log('📊 Development metrics enabled:', process.env.NODE_ENV !== 'production');

    // Log optimization summary
    if (process.env.NODE_ENV !== 'production') {
      console.log('📈 Service optimization levels initialized');
      console.log('🔍 Performance tracking active');
    }

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

