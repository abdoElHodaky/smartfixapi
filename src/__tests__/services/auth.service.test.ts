/**
 * AuthService Unit Tests
 * 
 * Comprehensive unit tests for the AuthService including all authentication operations.
 */

import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

// Import test utilities
import { connectTestDB, disconnectTestDB, clearTestDB } from '../utils/testDatabase';
import { createTestUser, createTestProvider, createTestDTOs, resetFakerSeed } from '../utils/testDataFactory';
import { createMockModel, resetAllMocks } from '../utils/mockHelpers';
import { testConfig } from '../config/testConfig';

// Import the service and dependencies
import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { AuthenticationError, ValidationError, NotFoundError } from '../../middleware/errorHandler';

// Mock the models
jest.mock('../../models/User');
jest.mock('../../models/ServiceProvider');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const MockUser = User as jest.MockedClass<typeof User>;
const MockServiceProvider = ServiceProvider as jest.MockedClass<typeof ServiceProvider>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: any;
  let mockUserModel: any;
  let mockProviderModel: any;

  beforeEach(async () => {
    // Reset all mocks
    resetAllMocks();
    resetFakerSeed();

    // Create mock models
    mockUserModel = createMockModel();
    mockProviderModel = createMockModel();

    // Mock the model constructors
    MockUser.mockImplementation(() => mockUserModel);
    MockServiceProvider.mockImplementation(() => mockProviderModel);

    // Mock bcrypt methods
    mockBcrypt.hash = jest.fn().mockResolvedValue('$2b$10$hashedpassword');
    mockBcrypt.compare = jest.fn().mockResolvedValue(true);

    // Mock JWT methods
    mockJwt.sign = jest.fn().mockReturnValue('mock-jwt-token');
    mockJwt.verify = jest.fn().mockReturnValue({
      userId: 'mock-user-id',
      email: 'test@example.com',
      role: 'user'
    });

    // Import and instantiate the service after mocking
    const { AuthService } = await import('../../services/auth/AuthService.strategy');
    authService = new AuthService();
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('Token Operations', () => {
    describe('generateToken', () => {
      it('should generate a valid JWT token', () => {
        const userId = 'test-user-id';
        const email = 'test@example.com';
        const role = 'user';

        const token = authService.generateToken(userId, email, role);

        expect(mockJwt.sign).toHaveBeenCalledWith(
          { userId, email, role },
          testConfig.jwt.secret,
          { expiresIn: testConfig.jwt.expiresIn }
        );
        expect(token).toBe('mock-jwt-token');
      });

      it('should handle different user roles', () => {
        const roles = ['user', 'provider', 'admin'];

        roles.forEach(role => {
          authService.generateToken('test-id', 'test@example.com', role);
          expect(mockJwt.sign).toHaveBeenCalledWith(
            expect.objectContaining({ role }),
            expect.any(String),
            expect.any(Object)
          );
        });
      });
    });

    describe('verifyToken', () => {
      it('should verify a valid token', () => {
        const token = 'valid-token';
        const expectedPayload = {
          userId: 'test-user-id',
          email: 'test@example.com',
          role: 'user'
        };

        mockJwt.verify.mockReturnValue(expectedPayload);

        const result = authService.verifyToken(token);

        expect(mockJwt.verify).toHaveBeenCalledWith(token, testConfig.jwt.secret);
        expect(result).toEqual(expectedPayload);
      });

      it('should throw error for invalid token', () => {
        const token = 'invalid-token';
        mockJwt.verify.mockImplementation(() => {
          throw new Error('Invalid token');
        });

        expect(() => authService.verifyToken(token)).toThrow('Invalid token');
      });

      it('should throw error for expired token', () => {
        const token = 'expired-token';
        mockJwt.verify.mockImplementation(() => {
          throw new Error('Token expired');
        });

        expect(() => authService.verifyToken(token)).toThrow('Token expired');
      });
    });

    describe('refreshToken', () => {
      it('should refresh a valid token', async () => {
        const oldToken = 'old-token';
        const mockUser = createTestUser();
        
        mockJwt.verify.mockReturnValue({
          userId: mockUser._id,
          email: mockUser.email,
          role: mockUser.role
        });
        
        MockUser.findById = jest.fn().mockResolvedValue(mockUser);

        const result = await authService.refreshToken(oldToken);

        expect(result.success).toBe(true);
        expect(result.data.token).toBe('mock-jwt-token');
        expect(MockUser.findById).toHaveBeenCalledWith(mockUser._id);
      });

      it('should reject refresh for non-existent user', async () => {
        const oldToken = 'old-token';
        
        mockJwt.verify.mockReturnValue({
          userId: 'non-existent-id',
          email: 'test@example.com',
          role: 'user'
        });
        
        MockUser.findById = jest.fn().mockResolvedValue(null);

        await expect(authService.refreshToken(oldToken)).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('Password Operations', () => {
    describe('hashPassword', () => {
      it('should hash a password', async () => {
        const password = 'testpassword123';
        const hashedPassword = await authService.hashPassword(password);

        expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);
        expect(hashedPassword).toBe('$2b$10$hashedpassword');
      });

      it('should handle empty password', async () => {
        await expect(authService.hashPassword('')).rejects.toThrow(ValidationError);
      });

      it('should handle null password', async () => {
        await expect(authService.hashPassword(null)).rejects.toThrow(ValidationError);
      });
    });

    describe('comparePassword', () => {
      it('should compare passwords correctly', async () => {
        const password = 'testpassword123';
        const hashedPassword = '$2b$10$hashedpassword';

        const result = await authService.comparePassword(password, hashedPassword);

        expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        expect(result).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        mockBcrypt.compare.mockResolvedValue(false);

        const result = await authService.comparePassword('wrongpassword', '$2b$10$hashedpassword');

        expect(result).toBe(false);
      });

      it('should handle empty passwords', async () => {
        await expect(authService.comparePassword('', 'hash')).rejects.toThrow(ValidationError);
        await expect(authService.comparePassword('password', '')).rejects.toThrow(ValidationError);
      });
    });

    describe('changePassword', () => {
      it('should change password successfully', async () => {
        const userId = 'test-user-id';
        const currentPassword = 'oldpassword';
        const newPassword = 'newpassword123';
        const mockUser = createTestUser({ _id: userId, password: '$2b$10$oldhash' });

        MockUser.findById = jest.fn().mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(true);
        mockUser.save = jest.fn().mockResolvedValue(mockUser);

        const result = await authService.changePassword(userId, currentPassword, newPassword);

        expect(result.success).toBe(true);
        expect(MockUser.findById).toHaveBeenCalledWith(userId);
        expect(mockBcrypt.compare).toHaveBeenCalledWith(currentPassword, mockUser.password);
        expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
        expect(mockUser.save).toHaveBeenCalled();
      });

      it('should reject change with incorrect current password', async () => {
        const userId = 'test-user-id';
        const mockUser = createTestUser({ _id: userId });

        MockUser.findById = jest.fn().mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(false);

        await expect(
          authService.changePassword(userId, 'wrongpassword', 'newpassword')
        ).rejects.toThrow(AuthenticationError);
      });

      it('should reject change for non-existent user', async () => {
        MockUser.findById = jest.fn().mockResolvedValue(null);

        await expect(
          authService.changePassword('non-existent-id', 'old', 'new')
        ).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('User Registration', () => {
    describe('register', () => {
      it('should register a new user successfully', async () => {
        const registrationData = createTestDTOs.userRegistration();
        const mockUser = createTestUser(registrationData);

        MockUser.findOne = jest.fn().mockResolvedValue(null); // Email not exists
        MockUser.prototype.save = jest.fn().mockResolvedValue(mockUser);

        const result = await authService.register(registrationData);

        expect(result.success).toBe(true);
        expect(result.data.userId).toBeDefined();
        expect(result.data.token).toBe('mock-jwt-token');
        expect(MockUser.findOne).toHaveBeenCalledWith({ email: registrationData.email });
        expect(mockBcrypt.hash).toHaveBeenCalledWith(registrationData.password, 10);
      });

      it('should reject registration with existing email', async () => {
        const registrationData = createTestDTOs.userRegistration();
        const existingUser = createTestUser();

        MockUser.findOne = jest.fn().mockResolvedValue(existingUser);

        await expect(authService.register(registrationData)).rejects.toThrow(ValidationError);
        expect(MockUser.findOne).toHaveBeenCalledWith({ email: registrationData.email });
      });

      it('should validate required fields', async () => {
        const invalidData = { email: 'test@example.com' }; // Missing required fields

        await expect(authService.register(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should validate email format', async () => {
        const invalidData = createTestDTOs.userRegistration({ email: 'invalid-email' });

        await expect(authService.register(invalidData)).rejects.toThrow(ValidationError);
      });

      it('should validate password strength', async () => {
        const weakPasswordData = createTestDTOs.userRegistration({ password: '123' });

        await expect(authService.register(weakPasswordData)).rejects.toThrow(ValidationError);
      });
    });

    describe('registerProvider', () => {
      it('should register a new provider successfully', async () => {
        const userData = createTestDTOs.userRegistration();
        const providerData = createTestDTOs.providerRegistration();
        const mockUser = createTestUser(userData);
        const mockProvider = createTestProvider(providerData);

        MockUser.findOne = jest.fn().mockResolvedValue(null);
        MockUser.prototype.save = jest.fn().mockResolvedValue(mockUser);
        MockServiceProvider.prototype.save = jest.fn().mockResolvedValue(mockProvider);

        const result = await authService.registerProvider(userData, providerData);

        expect(result.success).toBe(true);
        expect(result.data.userId).toBeDefined();
        expect(result.data.providerId).toBeDefined();
        expect(result.data.token).toBe('mock-jwt-token');
      });

      it('should reject provider registration with existing email', async () => {
        const userData = createTestDTOs.userRegistration();
        const providerData = createTestDTOs.providerRegistration();
        const existingUser = createTestUser();

        MockUser.findOne = jest.fn().mockResolvedValue(existingUser);

        await expect(
          authService.registerProvider(userData, providerData)
        ).rejects.toThrow(ValidationError);
      });

      it('should validate business license', async () => {
        const userData = createTestDTOs.userRegistration();
        const invalidProviderData = createTestDTOs.providerRegistration({ businessLicense: '' });

        await expect(
          authService.registerProvider(userData, invalidProviderData)
        ).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('Authentication', () => {
    describe('login', () => {
      it('should login user successfully', async () => {
        const loginData = createTestDTOs.login();
        const mockUser = createTestUser({
          email: loginData.email,
          password: '$2b$10$hashedpassword',
          isActive: true
        });

        MockUser.findOne = jest.fn().mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(true);

        const result = await authService.login(loginData);

        expect(result.success).toBe(true);
        expect(result.data.token).toBe('mock-jwt-token');
        expect(result.data.user.id).toBe(mockUser._id);
        expect(MockUser.findOne).toHaveBeenCalledWith({ email: loginData.email });
        expect(mockBcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      });

      it('should reject login with non-existent email', async () => {
        const loginData = createTestDTOs.login();

        MockUser.findOne = jest.fn().mockResolvedValue(null);

        await expect(authService.login(loginData)).rejects.toThrow(AuthenticationError);
      });

      it('should reject login with incorrect password', async () => {
        const loginData = createTestDTOs.login();
        const mockUser = createTestUser({ email: loginData.email });

        MockUser.findOne = jest.fn().mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(false);

        await expect(authService.login(loginData)).rejects.toThrow(AuthenticationError);
      });

      it('should reject login for inactive user', async () => {
        const loginData = createTestDTOs.login();
        const mockUser = createTestUser({
          email: loginData.email,
          isActive: false
        });

        MockUser.findOne = jest.fn().mockResolvedValue(mockUser);

        await expect(authService.login(loginData)).rejects.toThrow(AuthenticationError);
      });

      it('should reject login for unverified email', async () => {
        const loginData = createTestDTOs.login();
        const mockUser = createTestUser({
          email: loginData.email,
          isEmailVerified: false
        });

        MockUser.findOne = jest.fn().mockResolvedValue(mockUser);

        await expect(authService.login(loginData)).rejects.toThrow(AuthenticationError);
      });
    });
  });

  describe('Account Management', () => {
    describe('getUserProfile', () => {
      it('should get user profile successfully', async () => {
        const userId = 'test-user-id';
        const mockUser = createTestUser({ _id: userId });

        MockUser.findById = jest.fn().mockResolvedValue(mockUser);

        const result = await authService.getUserProfile(userId);

        expect(result.id).toBe(userId);
        expect(result.email).toBe(mockUser.email);
        expect(result.password).toBeUndefined(); // Password should be excluded
        expect(MockUser.findById).toHaveBeenCalledWith(userId, '-password');
      });

      it('should throw error for non-existent user', async () => {
        MockUser.findById = jest.fn().mockResolvedValue(null);

        await expect(authService.getUserProfile('non-existent-id')).rejects.toThrow(NotFoundError);
      });
    });

    describe('verifyEmail', () => {
      it('should verify email successfully', async () => {
        const userId = 'test-user-id';
        const mockUser = createTestUser({ _id: userId, isEmailVerified: false });

        MockUser.findById = jest.fn().mockResolvedValue(mockUser);
        mockUser.save = jest.fn().mockResolvedValue({ ...mockUser, isEmailVerified: true });

        const result = await authService.verifyEmail(userId);

        expect(result.success).toBe(true);
        expect(mockUser.isEmailVerified).toBe(true);
        expect(mockUser.save).toHaveBeenCalled();
      });

      it('should handle already verified email', async () => {
        const userId = 'test-user-id';
        const mockUser = createTestUser({ _id: userId, isEmailVerified: true });

        MockUser.findById = jest.fn().mockResolvedValue(mockUser);

        const result = await authService.verifyEmail(userId);

        expect(result.success).toBe(true);
        expect(result.message).toContain('already verified');
      });
    });

    describe('deactivateAccount', () => {
      it('should deactivate account successfully', async () => {
        const userId = 'test-user-id';
        const mockUser = createTestUser({ _id: userId, isActive: true });

        MockUser.findById = jest.fn().mockResolvedValue(mockUser);
        mockUser.save = jest.fn().mockResolvedValue({ ...mockUser, isActive: false });

        const result = await authService.deactivateAccount(userId);

        expect(result.success).toBe(true);
        expect(mockUser.isActive).toBe(false);
        expect(mockUser.save).toHaveBeenCalled();
      });

      it('should handle already deactivated account', async () => {
        const userId = 'test-user-id';
        const mockUser = createTestUser({ _id: userId, isActive: false });

        MockUser.findById = jest.fn().mockResolvedValue(mockUser);

        const result = await authService.deactivateAccount(userId);

        expect(result.success).toBe(true);
        expect(result.message).toContain('already deactivated');
      });
    });

    describe('resetPassword', () => {
      it('should reset password successfully', async () => {
        const email = 'test@example.com';
        const newPassword = 'newpassword123';
        const mockUser = createTestUser({ email });

        MockUser.findOne = jest.fn().mockResolvedValue(mockUser);
        mockUser.save = jest.fn().mockResolvedValue(mockUser);

        const result = await authService.resetPassword(email, newPassword);

        expect(result.success).toBe(true);
        expect(MockUser.findOne).toHaveBeenCalledWith({ email });
        expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
        expect(mockUser.save).toHaveBeenCalled();
      });

      it('should reject reset for non-existent email', async () => {
        MockUser.findOne = jest.fn().mockResolvedValue(null);

        await expect(
          authService.resetPassword('nonexistent@example.com', 'newpassword')
        ).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database connection errors', async () => {
      MockUser.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      await expect(
        authService.login(createTestDTOs.login())
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle bcrypt errors', async () => {
      mockBcrypt.hash.mockRejectedValue(new Error('Bcrypt error'));

      await expect(
        authService.hashPassword('password')
      ).rejects.toThrow('Bcrypt error');
    });

    it('should handle JWT signing errors', () => {
      mockJwt.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      expect(() => 
        authService.generateToken('user-id', 'email@test.com', 'user')
      ).toThrow('JWT signing failed');
    });

    it('should validate input parameters', async () => {
      // Test null/undefined inputs
      await expect(authService.register(null)).rejects.toThrow(ValidationError);
      await expect(authService.login(undefined)).rejects.toThrow(ValidationError);
      await expect(authService.changePassword(null, 'old', 'new')).rejects.toThrow(ValidationError);
    });

    it('should handle concurrent registration attempts', async () => {
      const registrationData = createTestDTOs.userRegistration();
      
      // First call succeeds
      MockUser.findOne = jest.fn().mockResolvedValueOnce(null);
      MockUser.prototype.save = jest.fn().mockResolvedValue(createTestUser());
      
      // Second call should detect existing email
      MockUser.findOne.mockResolvedValueOnce(createTestUser());

      const firstRegistration = authService.register(registrationData);
      const secondRegistration = authService.register(registrationData);

      await expect(firstRegistration).resolves.toBeDefined();
      await expect(secondRegistration).rejects.toThrow(ValidationError);
    });
  });
});
