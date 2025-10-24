/**
 * Test Data Factory
 * 
 * Provides factory functions for generating test data objects.
 */

import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';

/**
 * Generate a valid MongoDB ObjectId
 */
export const generateObjectId = (): string => {
  return new Types.ObjectId().toString();
};

/**
 * Generate test user data
 */
export const createTestUser = (overrides: any = {}) => {
  return {
    _id: generateObjectId(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: '$2b$10$hashedpassword', // Pre-hashed test password
    phone: faker.phone.number(),
    location: {
      type: 'Point',
      coordinates: [
        parseFloat(faker.location.longitude()),
        parseFloat(faker.location.latitude())
      ]
    },
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country()
    },
    profileImage: faker.image.avatar(),
    isEmailVerified: true,
    isActive: true,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

/**
 * Generate test service provider data
 */
export const createTestProvider = (overrides: any = {}) => {
  return {
    _id: generateObjectId(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: '$2b$10$hashedpassword',
    phone: faker.phone.number(),
    businessName: faker.company.name(),
    businessDescription: faker.company.catchPhrase(),
    services: [
      faker.commerce.department(),
      faker.commerce.department()
    ],
    serviceAreas: [
      faker.location.city(),
      faker.location.city()
    ],
    location: {
      type: 'Point',
      coordinates: [
        parseFloat(faker.location.longitude()),
        parseFloat(faker.location.latitude())
      ]
    },
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country()
    },
    profileImage: faker.image.avatar(),
    businessLicense: faker.string.alphanumeric(10),
    insurance: {
      provider: faker.company.name(),
      policyNumber: faker.string.alphanumeric(12),
      expiryDate: faker.date.future()
    },
    rating: parseFloat(faker.number.float({ min: 1, max: 5, fractionDigits: 1 }).toFixed(1)),
    totalReviews: faker.number.int({ min: 0, max: 100 }),
    isVerified: true,
    isActive: true,
    role: 'provider',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

/**
 * Generate test service request data
 */
export const createTestServiceRequest = (overrides: any = {}) => {
  return {
    _id: generateObjectId(),
    userId: generateObjectId(),
    providerId: generateObjectId(),
    title: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    category: faker.commerce.department(),
    urgency: faker.helpers.arrayElement(['low', 'medium', 'high', 'emergency']),
    budget: {
      min: faker.number.int({ min: 50, max: 200 }),
      max: faker.number.int({ min: 200, max: 1000 })
    },
    location: {
      type: 'Point',
      coordinates: [
        parseFloat(faker.location.longitude()),
        parseFloat(faker.location.latitude())
      ]
    },
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country()
    },
    preferredDate: faker.date.future(),
    images: [
      faker.image.url(),
      faker.image.url()
    ],
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

/**
 * Generate test review data
 */
export const createTestReview = (overrides: any = {}) => {
  return {
    _id: generateObjectId(),
    userId: generateObjectId(),
    providerId: generateObjectId(),
    serviceRequestId: generateObjectId(),
    rating: faker.number.int({ min: 1, max: 5 }),
    comment: faker.lorem.paragraph(),
    images: [faker.image.url()],
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

/**
 * Generate test chat message data
 */
export const createTestChatMessage = (overrides: any = {}) => {
  return {
    _id: generateObjectId(),
    senderId: generateObjectId(),
    receiverId: generateObjectId(),
    serviceRequestId: generateObjectId(),
    message: faker.lorem.sentence(),
    messageType: 'text',
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

/**
 * Generate test admin data
 */
export const createTestAdmin = (overrides: any = {}) => {
  return {
    _id: generateObjectId(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: '$2b$10$hashedpassword',
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

/**
 * Generate multiple test objects
 */
export const createMultiple = <T>(factory: () => T, count: number): T[] => {
  return Array.from({ length: count }, () => factory());
};

/**
 * Generate test DTOs for API requests
 */
export const createTestDTOs = {
  userRegistration: (overrides: any = {}) => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: 'TestPassword123!',
    phone: faker.phone.number(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country()
    },
    ...overrides
  }),

  providerRegistration: (overrides: any = {}) => ({
    businessName: faker.company.name(),
    businessDescription: faker.company.catchPhrase(),
    services: [faker.commerce.department()],
    serviceAreas: [faker.location.city()],
    businessLicense: faker.string.alphanumeric(10),
    insurance: {
      provider: faker.company.name(),
      policyNumber: faker.string.alphanumeric(12),
      expiryDate: faker.date.future()
    },
    ...overrides
  }),

  login: (overrides: any = {}) => ({
    email: faker.internet.email(),
    password: 'TestPassword123!',
    ...overrides
  }),

  serviceRequestCreate: (overrides: any = {}) => ({
    title: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    category: faker.commerce.department(),
    urgency: 'medium',
    budget: {
      min: 100,
      max: 500
    },
    preferredDate: faker.date.future(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country()
    },
    ...overrides
  }),

  reviewCreate: (overrides: any = {}) => ({
    rating: faker.number.int({ min: 1, max: 5 }),
    comment: faker.lorem.paragraph(),
    ...overrides
  })
};

/**
 * Reset faker seed for consistent test data
 */
export const resetFakerSeed = (seed = 12345) => {
  faker.seed(seed);
};
