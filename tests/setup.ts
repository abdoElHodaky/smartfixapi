import { jest } from '@jest/globals';

// Global test setup
beforeAll(async () => {
  // Setup test database connection
  // Initialize test environment
});

afterAll(async () => {
  // Close database connections
  // Cleanup test environment
});

// Mock external services
jest.mock('../src/config/database', () => ({
  connectDB: jest.fn(),
  disconnectDB: jest.fn()
}));

// Mock Redis
jest.mock('../src/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn()
  }
}));

// Mock file upload service
jest.mock('../src/services/upload', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn()
}));

// Mock email service
jest.mock('../src/services/email', () => ({
  sendEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));

// Mock SMS service
jest.mock('../src/services/sms', () => ({
  sendSMS: jest.fn(),
  sendOTP: jest.fn()
}));

// Global test utilities
global.testUtils = {
  createTestUser: async (userData = {}) => {
    // Create test user utility
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      ...userData
    };
  },
  
  createTestProvider: async (providerData = {}) => {
    // Create test provider utility
    return {
      id: 'test-provider-id',
      businessName: 'Test Provider',
      ...providerData
    };
  },
  
  generateAuthToken: (userId: string) => {
    // Generate test JWT token
    return 'test-jwt-token';
  }
};

