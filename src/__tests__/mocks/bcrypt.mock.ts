/**
 * Bcrypt Mock
 * 
 * Mock implementation for bcrypt functions in tests
 */

import { jest } from '@jest/globals';

export const mockBcrypt = {
  hash: jest.fn().mockImplementation((password: string, saltRounds: number) => {
    return Promise.resolve(`$2b$${saltRounds}$hashedpassword`);
  }),
  
  compare: jest.fn().mockImplementation((password: string, hash: string) => {
    return Promise.resolve(true);
  }),
  
  genSalt: jest.fn().mockImplementation((rounds: number) => {
    return Promise.resolve(`$2b$${rounds}$salt`);
  }),
  
  hashSync: jest.fn().mockImplementation((password: string, saltRounds: number) => {
    return `$2b$${saltRounds}$hashedpassword`;
  }),
  
  compareSync: jest.fn().mockImplementation((password: string, hash: string) => {
    return true;
  }),
  
  genSaltSync: jest.fn().mockImplementation((rounds: number) => {
    return `$2b$${rounds}$salt`;
  }),
};

// Mock bcrypt module
jest.mock('bcrypt', () => mockBcrypt);

export default mockBcrypt;
