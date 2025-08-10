import app from './app';
import { connectDB } from './config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Server instance for graceful shutdown
let server: any;

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  if (server) {
    server.close((err: Error) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('Server closed successfully');
      
      // Close database connection
      process.exit(0);
    });
  }
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after 30 seconds');
    process.exit(1);
  }, 30000);
};

// Connect to database and start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Get port from environment or default to 3000
    const PORT = process.env.PORT || 3000;
    
    // Start the server
    server = app.listen(PORT, () => {
      console.log(`🚀 SmartFix API Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📋 Available Endpoints:');
        console.log('   🔐 Auth: /api/auth');
        console.log('   👤 Users: /api/user');
        console.log('   🔧 Providers: /api/provider');
        console.log('   📝 Requests: /api/requests');
        console.log('   ⭐ Reviews: /api/reviews');
        console.log('   💬 Chat: /api/chat');
        console.log('   👑 Admin: /api/admin');
        console.log('\n🔗 API Documentation: /api');
      }
    });
    
    // Handle server errors
    server.on('error', (err: Error) => {
      console.error('Server error:', err);
      process.exit(1);
    });
    
    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Export server for testing purposes
    global.server = server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export for testing
export default app;
