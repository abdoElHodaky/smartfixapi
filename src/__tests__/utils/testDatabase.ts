/**
 * Test Database Utilities
 * 
 * Provides database setup, teardown, and management utilities for testing.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

/**
 * Connect to in-memory MongoDB instance for testing
 */
export const connectTestDB = async (): Promise<void> => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
};

/**
 * Disconnect and stop the in-memory MongoDB instance
 */
export const disconnectTestDB = async (): Promise<void> => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Test database disconnection failed:', error);
    throw error;
  }
};

/**
 * Clear all collections in the test database
 */
export const clearTestDB = async (): Promise<void> => {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    console.log('✅ Test database cleared');
  } catch (error) {
    console.error('❌ Test database clear failed:', error);
    throw error;
  }
};

/**
 * Seed test database with initial data
 */
export const seedTestDB = async (seedData?: any): Promise<void> => {
  try {
    if (seedData) {
      // Implement seeding logic based on provided data
      for (const [collectionName, data] of Object.entries(seedData)) {
        const collection = mongoose.connection.collection(collectionName);
        if (Array.isArray(data)) {
          await collection.insertMany(data);
        }
      }
    }
    console.log('✅ Test database seeded');
  } catch (error) {
    console.error('❌ Test database seeding failed:', error);
    throw error;
  }
};

/**
 * Get test database connection status
 */
export const getTestDBStatus = (): string => {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
};

/**
 * Create a test transaction for isolated testing
 */
export const createTestTransaction = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();
  return session;
};

/**
 * Rollback test transaction
 */
export const rollbackTestTransaction = async (session: mongoose.ClientSession) => {
  await session.abortTransaction();
  session.endSession();
};
