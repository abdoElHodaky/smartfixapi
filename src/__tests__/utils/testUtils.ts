/**
 * Test Utilities
 * 
 * Common utilities and helpers for testing across the SmartFix API
 */

import { jest } from '@jest/globals';
import { Types } from 'mongoose';
import { faker } from '@faker-js/faker';

// Mock types for better TypeScript support
export type MockFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T>;

export interface MockUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'provider' | 'admin';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface MockProvider extends MockUser {
  role: 'provider';
  businessName: string;
  services: string[];
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  rating: number;
  reviewCount: number;
}

export interface MockServiceRequest {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  providerId?: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  budget: {
    min: number;
    max: number;
  };
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

/**
 * Test Data Factories
 */
export class TestDataFactory {
  /**
   * Create a mock user
   */
  static createMockUser(overrides: Partial<MockUser> = {}): MockUser {
    return {
      _id: new Types.ObjectId(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '$2b$10$hashedpassword',
      role: 'user',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
      ...overrides,
    };
  }

  /**
   * Create a mock provider
   */
  static createMockProvider(overrides: Partial<MockProvider> = {}): MockProvider {
    return {
      ...TestDataFactory.createMockUser({ role: 'provider' }),
      businessName: faker.company.name(),
      services: [faker.commerce.department(), faker.commerce.department()],
      location: {
        type: 'Point',
        coordinates: [faker.location.longitude(), faker.location.latitude()],
      },
      rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      reviewCount: faker.number.int({ min: 0, max: 100 }),
      ...overrides,
    } as MockProvider;
  }

  /**
   * Create a mock service request
   */
  static createMockServiceRequest(overrides: Partial<MockServiceRequest> = {}): MockServiceRequest {
    return {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      title: faker.commerce.productName(),
      description: faker.lorem.paragraph(),
      category: faker.commerce.department(),
      status: 'pending',
      budget: {
        min: faker.number.int({ min: 50, max: 200 }),
        max: faker.number.int({ min: 200, max: 1000 }),
      },
      location: {
        type: 'Point',
        coordinates: [faker.location.longitude(), faker.location.latitude()],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
      ...overrides,
    };
  }
}

/**
 * Mock Helpers
 */
export class MockHelpers {
  /**
   * Create a properly typed mock function
   */
  static createMockFunction<T extends (...args: any[]) => any>(): MockFunction<T> {
    return jest.fn() as MockFunction<T>;
  }

  /**
   * Create mock bcrypt functions
   */
  static createBcryptMocks() {
    return {
      hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
      compare: jest.fn().mockResolvedValue(true),
    };
  }

  /**
   * Create mock JWT functions
   */
  static createJwtMocks() {
    return {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      verify: jest.fn().mockReturnValue({ userId: 'mockUserId', email: 'test@example.com', role: 'user' }),
    };
  }

  /**
   * Create mock Mongoose model
   */
  static createMockModel<T>(mockData: T) {
    return {
      findById: jest.fn().mockResolvedValue(mockData),
      findOne: jest.fn().mockResolvedValue(mockData),
      find: jest.fn().mockResolvedValue([mockData]),
      create: jest.fn().mockResolvedValue(mockData),
      findByIdAndUpdate: jest.fn().mockResolvedValue(mockData),
      findByIdAndDelete: jest.fn().mockResolvedValue(mockData),
      countDocuments: jest.fn().mockResolvedValue(1),
      aggregate: jest.fn().mockResolvedValue([mockData]),
      save: jest.fn().mockResolvedValue(mockData),
    };
  }

  /**
   * Create mock Express request
   */
  static createMockRequest(overrides: any = {}) {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: TestDataFactory.createMockUser(),
      ...overrides,
    };
  }

  /**
   * Create mock Express response
   */
  static createMockResponse() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  }

  /**
   * Create mock Express next function
   */
  static createMockNext() {
    return jest.fn();
  }
}

/**
 * Test Environment Setup
 */
export class TestEnvironment {
  /**
   * Setup test environment variables
   */
  static setupEnv() {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/smartfix_test';
    process.env.PORT = '3001';
  }

  /**
   * Clear all mocks
   */
  static clearAllMocks() {
    jest.clearAllMocks();
  }

  /**
   * Reset all mocks
   */
  static resetAllMocks() {
    jest.resetAllMocks();
  }
}

/**
 * Common test assertions
 */
export class TestAssertions {
  /**
   * Assert response structure
   */
  static assertResponseStructure(response: any, expectedKeys: string[]) {
    expectedKeys.forEach(key => {
      expect(response).toHaveProperty(key);
    });
  }

  /**
   * Assert error response
   */
  static assertErrorResponse(response: any, statusCode: number, message?: string) {
    expect(response.status).toBe(statusCode);
    if (message) {
      expect(response.body.message).toContain(message);
    }
  }

  /**
   * Assert success response
   */
  static assertSuccessResponse(response: any, statusCode: number = 200) {
    expect(response.status).toBe(statusCode);
    expect(response.body).toBeDefined();
  }
}

export default {
  TestDataFactory,
  MockHelpers,
  TestEnvironment,
  TestAssertions,
};
