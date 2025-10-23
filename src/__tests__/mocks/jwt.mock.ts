/**
 * JWT Mock
 * 
 * Mock implementation for jsonwebtoken functions in tests
 */

import { jest } from '@jest/globals';

export const mockJwt = {
  sign: jest.fn().mockImplementation((payload: any, secret: string, options?: any) => {
    return 'mock.jwt.token';
  }),
  
  verify: jest.fn().mockImplementation((token: string, secret: string, options?: any) => {
    if (token === 'invalid.token') {
      throw new Error('Invalid token');
    }
    return {
      userId: 'mockUserId',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
  }),
  
  decode: jest.fn().mockImplementation((token: string, options?: any) => {
    return {
      userId: 'mockUserId',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
  }),
};

// Mock jsonwebtoken module
jest.mock('jsonwebtoken', () => mockJwt);

export default mockJwt;
