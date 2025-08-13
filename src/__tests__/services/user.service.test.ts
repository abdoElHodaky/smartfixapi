/**
 * UserService Unit Tests
 * 
 * Comprehensive unit tests for the UserService including all user management operations.
 */

import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { Types } from 'mongoose';

// Import test utilities
import { createTestUser, createTestServiceRequest, createTestReview, createTestDTOs, resetFakerSeed } from '../utils/testDataFactory';
import { createMockModel, createMockUserService, resetAllMocks } from '../utils/mockHelpers';
import { testConfig } from '../config/testConfig';

// Import the service and dependencies
import { User } from '../../models/User';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { ValidationError, NotFoundError } from '../../middleware/errorHandler';

// Mock the models
jest.mock('../../models/User');
jest.mock('../../models/ServiceRequest');
jest.mock('../../models/Review');

const MockUser = User as jest.MockedClass<typeof User>;
const MockServiceRequest = ServiceRequest as jest.MockedClass<typeof ServiceRequest>;
const MockReview = Review as jest.MockedClass<typeof Review>;

describe('UserService', () => {
  let userService: any;
  let mockUserModel: any;

  beforeEach(async () => {
    // Reset all mocks
    resetAllMocks();
    resetFakerSeed();

    // Create mock models
    mockUserModel = createMockModel();

    // Mock the model constructors
    MockUser.mockImplementation(() => mockUserModel);

    // Import and instantiate the service after mocking
    const { UserService } = await import('../../services/user/UserService.decorator');
    userService = new UserService();
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      const userId = 'test-user-id';
      const mockUser = createTestUser({ _id: userId });

      MockUser.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(result.id).toBe(userId);
      expect(result.email).toBe(mockUser.email);
      expect(MockUser.findById).toHaveBeenCalledWith(userId, '-password');
    });

    it('should get user with password when requested', async () => {
      const userId = 'test-user-id';
      const mockUser = createTestUser({ _id: userId });

      MockUser.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId, true);

      expect(MockUser.findById).toHaveBeenCalledWith(userId);
      expect(result.password).toBeDefined();
    });

    it('should throw error for non-existent user', async () => {
      MockUser.findById = jest.fn().mockResolvedValue(null);

      await expect(userService.getUserById('non-existent-id')).rejects.toThrow(NotFoundError);
    });

    it('should validate user ID format', async () => {
      await expect(userService.getUserById('invalid-id')).rejects.toThrow(ValidationError);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'test-user-id';
      const updateData = {
        name: 'Updated Name',
        phone: '+1234567890',
        address: {
          street: '123 Updated St',
          city: 'Updated City'
        }
      };
      const mockUser = createTestUser({ _id: userId });

      MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockUser, ...updateData });

      const result = await userService.updateUserProfile(userId, updateData);

      expect(result.success).toBe(true);
      expect(MockUser.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
    });

    it('should validate update data', async () => {
      const userId = 'test-user-id';
      const invalidData = { email: 'invalid-email' };

      await expect(userService.updateUserProfile(userId, invalidData)).rejects.toThrow(ValidationError);
    });

    it('should not allow updating sensitive fields', async () => {
      const userId = 'test-user-id';
      const sensitiveData = { password: 'newpassword', role: 'admin' };

      await expect(userService.updateUserProfile(userId, sensitiveData)).rejects.toThrow(ValidationError);
    });

    it('should handle non-existent user', async () => {
      MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await expect(
        userService.updateUserProfile('non-existent-id', { name: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteUserAccount', () => {
    it('should delete user account successfully', async () => {
      const userId = 'test-user-id';
      const mockUser = createTestUser({ _id: userId });

      MockUser.findById = jest.fn().mockResolvedValue(mockUser);
      MockUser.findByIdAndDelete = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.deleteUserAccount(userId);

      expect(result.success).toBe(true);
      expect(MockUser.findByIdAndDelete).toHaveBeenCalledWith(userId);
    });

    it('should handle non-existent user deletion', async () => {
      MockUser.findById = jest.fn().mockResolvedValue(null);

      await expect(userService.deleteUserAccount('non-existent-id')).rejects.toThrow(NotFoundError);
    });

    it('should prevent deletion of admin users', async () => {
      const userId = 'admin-user-id';
      const mockAdminUser = createTestUser({ _id: userId, role: 'admin' });

      MockUser.findById = jest.fn().mockResolvedValue(mockAdminUser);

      await expect(userService.deleteUserAccount(userId)).rejects.toThrow(ValidationError);
    });
  });

  describe('searchUsers', () => {
    it('should search users with filters', async () => {
      const filters = {
        name: 'John',
        city: 'New York',
        page: 1,
        limit: 10
      };
      const mockUsers = [createTestUser(), createTestUser()];

      MockUser.find = jest.fn().mockReturnThis();
      MockUser.countDocuments = jest.fn().mockResolvedValue(2);
      MockUser.skip = jest.fn().mockReturnThis();
      MockUser.limit = jest.fn().mockReturnThis();
      MockUser.sort = jest.fn().mockReturnThis();
      MockUser.select = jest.fn().mockReturnThis();
      MockUser.exec = jest.fn().mockResolvedValue(mockUsers);

      const result = await userService.searchUsers(filters);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should handle empty search results', async () => {
      const filters = { name: 'NonExistent' };

      MockUser.find = jest.fn().mockReturnThis();
      MockUser.countDocuments = jest.fn().mockResolvedValue(0);
      MockUser.skip = jest.fn().mockReturnThis();
      MockUser.limit = jest.fn().mockReturnThis();
      MockUser.sort = jest.fn().mockReturnThis();
      MockUser.select = jest.fn().mockReturnThis();
      MockUser.exec = jest.fn().mockResolvedValue([]);

      const result = await userService.searchUsers(filters);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should validate search filters', async () => {
      const invalidFilters = { page: -1, limit: 1000 };

      await expect(userService.searchUsers(invalidFilters)).rejects.toThrow(ValidationError);
    });
  });

  describe('getUserServiceRequests', () => {
    it('should get user service requests', async () => {
      const userId = 'test-user-id';
      const mockRequests = [createTestServiceRequest(), createTestServiceRequest()];

      MockServiceRequest.find = jest.fn().mockReturnThis();
      MockServiceRequest.countDocuments = jest.fn().mockResolvedValue(2);
      MockServiceRequest.populate = jest.fn().mockReturnThis();
      MockServiceRequest.sort = jest.fn().mockReturnThis();
      MockServiceRequest.skip = jest.fn().mockReturnThis();
      MockServiceRequest.limit = jest.fn().mockReturnThis();
      MockServiceRequest.exec = jest.fn().mockResolvedValue(mockRequests);

      const result = await userService.getUserServiceRequests(userId);

      expect(result.data).toHaveLength(2);
      expect(MockServiceRequest.find).toHaveBeenCalledWith({ userId });
    });

    it('should filter by status when provided', async () => {
      const userId = 'test-user-id';
      const status = 'completed';

      MockServiceRequest.find = jest.fn().mockReturnThis();
      MockServiceRequest.countDocuments = jest.fn().mockResolvedValue(0);
      MockServiceRequest.populate = jest.fn().mockReturnThis();
      MockServiceRequest.sort = jest.fn().mockReturnThis();
      MockServiceRequest.skip = jest.fn().mockReturnThis();
      MockServiceRequest.limit = jest.fn().mockReturnThis();
      MockServiceRequest.exec = jest.fn().mockResolvedValue([]);

      await userService.getUserServiceRequests(userId, status);

      expect(MockServiceRequest.find).toHaveBeenCalledWith({ userId, status });
    });
  });

  describe('getUserReviews', () => {
    it('should get user reviews', async () => {
      const userId = 'test-user-id';
      const mockReviews = [createTestReview(), createTestReview()];

      MockReview.find = jest.fn().mockReturnThis();
      MockReview.countDocuments = jest.fn().mockResolvedValue(2);
      MockReview.populate = jest.fn().mockReturnThis();
      MockReview.sort = jest.fn().mockReturnThis();
      MockReview.skip = jest.fn().mockReturnThis();
      MockReview.limit = jest.fn().mockReturnThis();
      MockReview.exec = jest.fn().mockResolvedValue(mockReviews);

      const result = await userService.getUserReviews(userId);

      expect(result.data).toHaveLength(2);
      expect(MockReview.find).toHaveBeenCalledWith({ userId });
    });
  });

  describe('uploadProfileImage', () => {
    it('should upload profile image successfully', async () => {
      const userId = 'test-user-id';
      const imageUrl = 'https://example.com/image.jpg';
      const mockUser = createTestUser({ _id: userId });

      MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockUser, profileImage: imageUrl });

      const result = await userService.uploadProfileImage(userId, imageUrl);

      expect(result.success).toBe(true);
      expect(MockUser.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { profileImage: imageUrl },
        { new: true }
      );
    });

    it('should validate image URL format', async () => {
      const userId = 'test-user-id';
      const invalidUrl = 'not-a-url';

      await expect(userService.uploadProfileImage(userId, invalidUrl)).rejects.toThrow(ValidationError);
    });

    it('should handle non-existent user', async () => {
      MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await expect(
        userService.uploadProfileImage('non-existent-id', 'https://example.com/image.jpg')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserStatistics', () => {
    it('should get user statistics', async () => {
      const userId = 'test-user-id';

      // Mock service request statistics
      MockServiceRequest.countDocuments = jest.fn()
        .mockResolvedValueOnce(10) // total requests
        .mockResolvedValueOnce(7); // completed requests

      // Mock review statistics
      MockReview.aggregate = jest.fn().mockResolvedValue([
        { _id: null, averageRating: 4.5, totalReviews: 5 }
      ]);

      const result = await userService.getUserStatistics(userId);

      expect(result.totalRequests).toBe(10);
      expect(result.completedRequests).toBe(7);
      expect(result.averageRating).toBe(4.5);
      expect(result.totalReviews).toBe(5);
    });

    it('should handle user with no activity', async () => {
      const userId = 'test-user-id';

      MockServiceRequest.countDocuments = jest.fn().mockResolvedValue(0);
      MockReview.aggregate = jest.fn().mockResolvedValue([]);

      const result = await userService.getUserStatistics(userId);

      expect(result.totalRequests).toBe(0);
      expect(result.completedRequests).toBe(0);
      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
    });
  });

  describe('updateUserLocation', () => {
    it('should update user location successfully', async () => {
      const userId = 'test-user-id';
      const location = {
        type: 'Point' as const,
        coordinates: [-74.006, 40.7128] as [number, number]
      };
      const mockUser = createTestUser({ _id: userId });

      MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockUser, location });

      const result = await userService.updateUserLocation(userId, location);

      expect(result.success).toBe(true);
      expect(MockUser.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { location },
        { new: true }
      );
    });

    it('should validate location coordinates', async () => {
      const userId = 'test-user-id';
      const invalidLocation = {
        type: 'Point' as const,
        coordinates: [200, 100] as [number, number] // Invalid coordinates
      };

      await expect(userService.updateUserLocation(userId, invalidLocation)).rejects.toThrow(ValidationError);
    });
  });

  describe('getUsersByLocation', () => {
    it('should get users by location', async () => {
      const coordinates: [number, number] = [-74.006, 40.7128];
      const radius = 10; // km
      const mockUsers = [createTestUser(), createTestUser()];

      MockUser.find = jest.fn().mockReturnThis();
      MockUser.select = jest.fn().mockReturnThis();
      MockUser.exec = jest.fn().mockResolvedValue(mockUsers);

      const result = await userService.getUsersByLocation(coordinates, radius);

      expect(result).toHaveLength(2);
      expect(MockUser.find).toHaveBeenCalledWith({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        }
      });
    });

    it('should validate coordinates', async () => {
      const invalidCoordinates: [number, number] = [200, 100];
      const radius = 10;

      await expect(userService.getUsersByLocation(invalidCoordinates, radius)).rejects.toThrow(ValidationError);
    });

    it('should validate radius', async () => {
      const coordinates: [number, number] = [-74.006, 40.7128];
      const invalidRadius = -5;

      await expect(userService.getUsersByLocation(coordinates, invalidRadius)).rejects.toThrow(ValidationError);
    });
  });

  describe('Admin Functions', () => {
    describe('updateUserStatus', () => {
      it('should update user status successfully', async () => {
        const userId = 'test-user-id';
        const status = 'suspended';
        const mockUser = createTestUser({ _id: userId });

        MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockUser, status });

        const result = await userService.updateUserStatus(userId, status);

        expect(result.success).toBe(true);
        expect(MockUser.findByIdAndUpdate).toHaveBeenCalledWith(
          userId,
          { status },
          { new: true }
        );
      });

      it('should validate status values', async () => {
        const userId = 'test-user-id';
        const invalidStatus = 'invalid-status';

        await expect(userService.updateUserStatus(userId, invalidStatus)).rejects.toThrow(ValidationError);
      });
    });

    describe('getAllUsers', () => {
      it('should get all users with admin privileges', async () => {
        const filters = { page: 1, limit: 10 };
        const mockUsers = [createTestUser(), createTestUser()];

        MockUser.find = jest.fn().mockReturnThis();
        MockUser.countDocuments = jest.fn().mockResolvedValue(2);
        MockUser.select = jest.fn().mockReturnThis();
        MockUser.sort = jest.fn().mockReturnThis();
        MockUser.skip = jest.fn().mockReturnThis();
        MockUser.limit = jest.fn().mockReturnThis();
        MockUser.exec = jest.fn().mockResolvedValue(mockUsers);

        const result = await userService.getAllUsers(filters);

        expect(result.data).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
      });
    });

    describe('deleteUser', () => {
      it('should delete user as admin', async () => {
        const userId = 'test-user-id';
        const mockUser = createTestUser({ _id: userId });

        MockUser.findByIdAndDelete = jest.fn().mockResolvedValue(mockUser);

        await userService.deleteUser(userId);

        expect(MockUser.findByIdAndDelete).toHaveBeenCalledWith(userId);
      });

      it('should prevent deletion of admin users', async () => {
        const userId = 'admin-user-id';
        const mockAdminUser = createTestUser({ _id: userId, role: 'admin' });

        MockUser.findById = jest.fn().mockResolvedValue(mockAdminUser);

        await expect(userService.deleteUser(userId)).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      MockUser.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      await expect(userService.getUserById('test-id')).rejects.toThrow('Database connection failed');
    });

    it('should validate input parameters', async () => {
      await expect(userService.getUserById(null)).rejects.toThrow(ValidationError);
      await expect(userService.updateUserProfile('', {})).rejects.toThrow(ValidationError);
      await expect(userService.searchUsers(null)).rejects.toThrow(ValidationError);
    });

    it('should handle concurrent operations', async () => {
      const userId = 'test-user-id';
      const updateData = { name: 'Updated Name' };

      // Simulate concurrent updates
      MockUser.findByIdAndUpdate = jest.fn()
        .mockResolvedValueOnce(null) // First update fails
        .mockResolvedValueOnce(createTestUser(updateData)); // Second update succeeds

      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(NotFoundError);
      
      const result = await userService.updateUserProfile(userId, updateData);
      expect(result.success).toBe(true);
    });
  });
});
