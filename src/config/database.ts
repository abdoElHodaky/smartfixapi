import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Database connection configuration
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartfix';
    
    const options = {
      // Connection options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      
      // Authentication options (if needed)
      // authSource: 'admin',
      // user: process.env.MONGODB_USER,
      // pass: process.env.MONGODB_PASSWORD,
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from database
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    throw error;
  }
};

/**
 * Check database connection status
 */
export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get database connection info
 */
export const getConnectionInfo = () => {
  return {
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
  };
};

