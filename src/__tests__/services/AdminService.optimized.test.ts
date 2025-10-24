/**
 * AdminService Optimized Test Suite
 * 
 * Comprehensive test suite for the AdminService strategy implementation,
 * including strategy patterns, command handlers, and aggregation builders.
 */

import { AdminServiceStrategy } from '../../domains/admin/services/AdminServiceStrategy';
import { IUserService, IProviderService, IServiceRequestService, IReviewService } from '../../domains/common/interfaces/services';

// Mock services
const mockUserService: jest.Mocked<IUserService> = {
  createUser: jest.fn(),
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  getUsers: jest.fn(),
  verifyUser: jest.fn(),
  deactivateUser: jest.fn()
};

const mockProviderService: jest.Mocked<IProviderService> = {
  createProvider: jest.fn(),
  getProviderById: jest.fn(),
  getProviderByUserId: jest.fn(),
  updateProvider: jest.fn(),
  deleteProvider: jest.fn(),
  getProviders: jest.fn(),
  verifyProvider: jest.fn(),
  searchProviders: jest.fn()
};

const mockServiceRequestService: jest.Mocked<IServiceRequestService> = {
  createRequest: jest.fn(),
  getRequestById: jest.fn(),
  getRequestsByUserId: jest.fn(),
  getRequestsByProviderId: jest.fn(),
  updateRequest: jest.fn(),
  deleteRequest: jest.fn(),
  assignProvider: jest.fn(),
  updateRequestStatus: jest.fn(),
  searchRequests: jest.fn()
};

const mockReviewService: jest.Mocked<IReviewService> = {
  createReview: jest.fn(),
  getReviewById: jest.fn(),
  getReviewsByProviderId: jest.fn(),
  getReviewsByUserId: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
  getProviderRating: jest.fn()
};

describe('AdminService Strategy Tests', () => {
  let adminService: AdminServiceStrategy;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create new instance for each test
    adminService = new AdminServiceStrategy(
      mockUserService,
      mockProviderService,
      mockServiceRequestService,
      mockReviewService
    );
  });

  describe('Dashboard Statistics', () => {
    it('should aggregate dashboard statistics correctly', async () => {
      // Mock service responses
      mockUserService.getUsers.mockResolvedValue({
        data: Array(50).fill({}),
        pagination: { page: 1, limit: 50, total: 50, totalPages: 1, hasNext: false, hasPrev: false }
      });
      
      mockProviderService.getProviders.mockResolvedValue({
        data: Array(25).fill({}),
        pagination: { page: 1, limit: 50, total: 25, totalPages: 1, hasNext: false, hasPrev: false }
      });
      
      mockServiceRequestService.searchRequests.mockResolvedValue({
        data: Array(100).fill({}),
        pagination: { page: 1, limit: 100, total: 100, totalPages: 1, hasNext: false, hasPrev: false }
      });
      
      mockReviewService.getReviewsByProviderId.mockResolvedValue({
        data: Array(75).fill({}),
        pagination: { page: 1, limit: 100, total: 75, totalPages: 1, hasNext: false, hasPrev: false }
      });

      const stats = await adminService.getDashboardStats();

      expect(stats).toEqual({
        totalUsers: 50,
        totalProviders: 25,
        totalRequests: 100,
        totalReviews: 75,
        activeUsers: expect.any(Number),
        pendingRequests: expect.any(Number)
      });
    });
  });

  describe('User Management', () => {
    it('should get users with filters', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com', role: 'user', isActive: true, isVerified: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', email: 'user2@test.com', role: 'provider', isActive: true, isVerified: false, createdAt: new Date(), updatedAt: new Date() }
      ];

      mockUserService.getUsers.mockResolvedValue({
        data: mockUsers,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasNext: false, hasPrev: false }
      });

      const result = await adminService.getUsers({ role: 'user' });

      expect(mockUserService.getUsers).toHaveBeenCalledWith({ role: 'user' });
      expect(result.data).toEqual(mockUsers);
    });

    it('should update user status', async () => {
      mockUserService.updateUser.mockResolvedValue({
        success: true,
        message: 'User status updated successfully'
      });

      const result = await adminService.updateUserStatus('user123', false);

      expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', { isActive: false });
      expect(result.success).toBe(true);
    });
  });

  describe('Provider Verification', () => {
    it('should verify provider successfully', async () => {
      mockProviderService.verifyProvider.mockResolvedValue({
        success: true,
        message: 'Provider verified successfully'
      });

      const result = await adminService.verifyProvider('provider123');

      expect(mockProviderService.verifyProvider).toHaveBeenCalledWith('provider123');
      expect(result.success).toBe(true);
    });
  });

  describe('System Health', () => {
    it('should return system health status', async () => {
      const health = await adminService.getSystemHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('services');
    });
  });

  describe('Audit Logs', () => {
    it('should get audit logs with pagination', async () => {
      const _mockLogs = [
        { id: '1', action: 'USER_CREATED', timestamp: new Date(), userId: 'user123' },
        { id: '2', action: 'PROVIDER_VERIFIED', timestamp: new Date(), userId: 'admin456' }
      ];

      // Mock audit logs response
      const result = await adminService.getAuditLogs({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
    });
  });
});
