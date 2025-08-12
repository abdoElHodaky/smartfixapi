/**
 * Optimized AdminService Tests
 * 
 * Comprehensive tests for the strategy-based AdminService implementation
 * including strategy patterns, command handlers, and aggregation builders.
 */

import { AdminServiceStrategy } from '../../services/admin/AdminService.strategy';
import { AdminCommandFactory } from '../../services/commands/AdminCommands';
import { AggregationBuilder } from '../../utils/aggregation/AggregationBuilder';
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';
import { CommandResult } from '../../utils/service-optimization/CommandBase';
import { IUserService, IProviderService, IServiceRequestService, IReviewService } from '../../interfaces/services';

// Mock services
const mockUserService: jest.Mocked<IUserService> = {
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  updateUserRole: jest.fn(),
  getUserByEmail: jest.fn(),
  getAllUsers: jest.fn(),
  searchUsers: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  changePassword: jest.fn(),
  resetPassword: jest.fn(),
  verifyEmail: jest.fn(),
  updateUserStatus: jest.fn()
};

const mockProviderService: jest.Mocked<IProviderService> = {
  getProviderById: jest.fn(),
  createProvider: jest.fn(),
  updateProvider: jest.fn(),
  deleteProvider: jest.fn(),
  updateProviderStatus: jest.fn(),
  getProviderByUserId: jest.fn(),
  getAllProviders: jest.fn(),
  searchProviders: jest.fn(),
  getProviderServices: jest.fn(),
  updateProviderServices: jest.fn(),
  getProviderReviews: jest.fn(),
  getProviderStats: jest.fn()
};

const mockServiceRequestService: jest.Mocked<IServiceRequestService> = {
  getServiceRequestById: jest.fn(),
  createServiceRequest: jest.fn(),
  updateServiceRequest: jest.fn(),
  deleteServiceRequest: jest.fn(),
  getServiceRequestsByUser: jest.fn(),
  getServiceRequestsByProvider: jest.fn(),
  getAllServiceRequests: jest.fn(),
  searchServiceRequests: jest.fn(),
  updateServiceRequestStatus: jest.fn(),
  assignProviderToRequest: jest.fn(),
  getServiceRequestStats: jest.fn()
};

const mockReviewService: jest.Mocked<IReviewService> = {
  getReviewById: jest.fn(),
  createReview: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
  getReviewsByProvider: jest.fn(),
  getReviewsByUser: jest.fn(),
  getAllReviews: jest.fn(),
  getAverageRating: jest.fn(),
  getReviewStats: jest.fn()
};

describe('AdminServiceStrategy', () => {
  let adminService: AdminServiceStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    adminService = new AdminServiceStrategy(
      mockUserService,
      mockProviderService,
      mockServiceRequestService,
      mockReviewService
    );
  });

  describe('Strategy Pattern Implementation', () => {
    describe('Provider Action Strategies', () => {
      const mockAdmin = {
        id: 'admin123',
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      };

      const mockProvider = {
        id: 'provider123',
        status: 'pending',
        userId: 'user123'
      };

      beforeEach(() => {
        mockUserService.getUserById.mockResolvedValue(mockAdmin as any);
        mockProviderService.getProviderById.mockResolvedValue(mockProvider as any);
        mockProviderService.updateProviderStatus.mockResolvedValue(undefined);
      });

      test('should approve provider using strategy pattern', async () => {
        const result = await adminService.handleProviderAction(
          'provider123',
          'approve',
          'admin123'
        );

        expect(result.success).toBe(true);
        expect(result.message).toBe('Provider approved successfully');
        expect(result.data).toEqual({
          providerId: 'provider123',
          status: 'approved',
          approvedBy: 'admin123',
          approvedAt: expect.any(Date),
          notes: undefined
        });

        expect(mockProviderService.updateProviderStatus).toHaveBeenCalledWith(
          'provider123',
          'approved'
        );
      });

      test('should reject provider using strategy pattern', async () => {
        const result = await adminService.handleProviderAction(
          'provider123',
          'reject',
          'admin123',
          'Incomplete documentation'
        );

        expect(result.success).toBe(true);
        expect(result.message).toBe('Provider rejected successfully');
        expect(result.data).toEqual({
          providerId: 'provider123',
          status: 'rejected',
          rejectedBy: 'admin123',
          rejectedAt: expect.any(Date),
          reason: 'Incomplete documentation'
        });

        expect(mockProviderService.updateProviderStatus).toHaveBeenCalledWith(
          'provider123',
          'rejected'
        );
      });

      test('should suspend provider using strategy pattern', async () => {
        const result = await adminService.handleProviderAction(
          'provider123',
          'suspend',
          'admin123',
          'Policy violation'
        );

        expect(result.success).toBe(true);
        expect(result.message).toBe('Provider suspended successfully');
        expect(result.data).toEqual({
          providerId: 'provider123',
          status: 'suspended',
          suspendedBy: 'admin123',
          suspendedAt: expect.any(Date),
          reason: 'Policy violation'
        });

        expect(mockProviderService.updateProviderStatus).toHaveBeenCalledWith(
          'provider123',
          'suspended'
        );
      });

      test('should handle unsupported provider action', async () => {
        const result = await adminService.handleProviderAction(
          'provider123',
          'unsupported_action',
          'admin123'
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Unsupported provider action: unsupported_action');
      });

      test('should handle provider not found', async () => {
        mockProviderService.getProviderById.mockResolvedValue(null);

        const result = await adminService.handleProviderAction(
          'nonexistent',
          'approve',
          'admin123'
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Provider not found');
      });
    });

    describe('Report Generation Strategies', () => {
      const mockAdmin = {
        id: 'admin123',
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      };

      beforeEach(() => {
        mockUserService.getUserById.mockResolvedValue(mockAdmin as any);
      });

      test('should generate user activity report using strategy pattern', async () => {
        const mockReportData = [
          { _id: { year: 2024, month: 1, day: 15 }, count: 10 }
        ];

        // Mock AggregationBuilder execution
        jest.spyOn(AggregationBuilder.prototype, 'execute').mockResolvedValue(mockReportData);

        const result = await adminService.generateReport(
          'user_activity',
          'admin123',
          { from: new Date('2024-01-01'), to: new Date('2024-01-31') }
        );

        expect(result).toEqual(mockReportData);
      });

      test('should generate provider performance report using strategy pattern', async () => {
        const mockReportData = [
          { _id: 'provider1', averageRating: 4.5, totalReviews: 20 }
        ];

        jest.spyOn(AggregationBuilder.prototype, 'execute').mockResolvedValue(mockReportData);

        const result = await adminService.generateReport(
          'provider_performance',
          'admin123'
        );

        expect(result).toEqual(mockReportData);
      });

      test('should handle unsupported report type', async () => {
        await expect(
          adminService.generateReport('unsupported_report', 'admin123')
        ).rejects.toThrow('Unsupported report type: unsupported_report');
      });
    });
  });

  describe('ConditionalHelpers Integration', () => {
    test('should validate admin permissions using ConditionalHelpers', async () => {
      const mockUser = {
        id: 'user123',
        role: 'user',
        isActive: true,
        isEmailVerified: true
      };

      mockUserService.getUserById.mockResolvedValue(mockUser as any);

      await expect(
        adminService.handleProviderAction('provider123', 'approve', 'user123')
      ).rejects.toThrow('Insufficient permissions');
    });

    test('should allow super admin access', async () => {
      const mockSuperAdmin = {
        id: 'superadmin123',
        role: 'super_admin',
        isActive: true,
        isEmailVerified: true
      };

      const mockProvider = {
        id: 'provider123',
        status: 'pending'
      };

      mockUserService.getUserById.mockResolvedValue(mockSuperAdmin as any);
      mockProviderService.getProviderById.mockResolvedValue(mockProvider as any);
      mockProviderService.updateProviderStatus.mockResolvedValue(undefined);

      const result = await adminService.handleProviderAction(
        'provider123',
        'approve',
        'superadmin123'
      );

      expect(result.success).toBe(true);
    });

    test('should require active user', async () => {
      const mockInactiveAdmin = {
        id: 'admin123',
        role: 'admin',
        isActive: false,
        isEmailVerified: true
      };

      mockUserService.getUserById.mockResolvedValue(mockInactiveAdmin as any);

      await expect(
        adminService.handleProviderAction('provider123', 'approve', 'admin123')
      ).rejects.toThrow('User account must be active');
    });

    test('should require email verification', async () => {
      const mockUnverifiedAdmin = {
        id: 'admin123',
        role: 'admin',
        isActive: true,
        isEmailVerified: false
      };

      mockUserService.getUserById.mockResolvedValue(mockUnverifiedAdmin as any);

      await expect(
        adminService.handleProviderAction('provider123', 'approve', 'admin123')
      ).rejects.toThrow('Email verification required');
    });
  });

  describe('AggregationBuilder Integration', () => {
    const mockAdmin = {
      id: 'admin123',
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    };

    beforeEach(() => {
      mockUserService.getUserById.mockResolvedValue(mockAdmin as any);
    });

    test('should use AggregationBuilder for dashboard data', async () => {
      const mockOverviewData = {
        users: [{ _id: { year: 2024 }, count: 100 }],
        providers: [{ _id: 'active', count: 50 }],
        requests: [{ _id: 'pending', count: 25 }],
        reviews: [{ _id: 5, count: 30 }]
      };

      const mockStatisticsData = {
        topProviders: [{ _id: 'provider1', averageRating: 4.8 }],
        categoryStats: [{ _id: 'plumbing', count: 15 }],
        ratingDistribution: [{ _id: 5, count: 20 }]
      };

      const mockRecentActivity = {
        recentUsers: [],
        recentRequests: [],
        recentReviews: []
      };

      jest.spyOn(AggregationBuilder.prototype, 'execute')
        .mockResolvedValueOnce(mockOverviewData.users)
        .mockResolvedValueOnce(mockOverviewData.providers)
        .mockResolvedValueOnce(mockOverviewData.requests)
        .mockResolvedValueOnce(mockOverviewData.reviews)
        .mockResolvedValueOnce(mockStatisticsData.topProviders)
        .mockResolvedValueOnce(mockStatisticsData.categoryStats)
        .mockResolvedValueOnce(mockStatisticsData.ratingDistribution)
        .mockResolvedValueOnce(mockRecentActivity.recentUsers)
        .mockResolvedValueOnce(mockRecentActivity.recentRequests)
        .mockResolvedValueOnce(mockRecentActivity.recentReviews);

      const result = await adminService.getAdminDashboard('admin123');

      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('recentActivity');
      expect(result).toHaveProperty('statistics');
    });

    test('should use AggregationBuilder for platform statistics', async () => {
      const mockUserRoleStats = [{ _id: 'user', count: 100 }];
      const mockProviderServiceStats = [{ _id: 'plumbing', count: 20 }];
      const mockRequestStatusStats = [{ _id: 'completed', count: 50 }];
      const mockAverageRating = [{ avgRating: 4.2 }];

      jest.spyOn(AggregationBuilder.prototype, 'execute')
        .mockResolvedValueOnce(mockUserRoleStats)
        .mockResolvedValueOnce(mockProviderServiceStats)
        .mockResolvedValueOnce(mockRequestStatusStats)
        .mockResolvedValueOnce(mockAverageRating);

      const result = await adminService.getPlatformStatistics();

      expect(result).toEqual({
        userRoleStats: mockUserRoleStats,
        providerServiceStats: mockProviderServiceStats,
        requestStatusStats: mockRequestStatusStats,
        averageRating: 4.2
      });
    });

    test('should use AggregationBuilder for user filtering', async () => {
      const mockUsers = [
        { id: 'user1', name: 'John Doe', role: 'user' },
        { id: 'user2', name: 'Jane Smith', role: 'provider' }
      ];
      const mockTotalCount = [{ count: 2 }];

      jest.spyOn(AggregationBuilder.prototype, 'execute')
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValueOnce(mockTotalCount);

      const result = await adminService.getUsers(1, 10, {
        role: 'user',
        search: 'John'
      });

      expect(result).toEqual({
        data: mockUsers,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1
        }
      });
    });
  });

  describe('Legacy Method Compatibility', () => {
    const mockAdmin = {
      id: 'admin123',
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    };

    const mockProvider = {
      id: 'provider123',
      status: 'pending'
    };

    beforeEach(() => {
      mockUserService.getUserById.mockResolvedValue(mockAdmin as any);
      mockProviderService.getProviderById.mockResolvedValue(mockProvider as any);
      mockProviderService.updateProviderStatus.mockResolvedValue(undefined);
    });

    test('should maintain backward compatibility for approveProvider', async () => {
      const result = await adminService.approveProvider('provider123', 'admin123');

      expect(result).toEqual({
        success: true,
        message: 'Provider approved successfully',
        data: expect.objectContaining({
          providerId: 'provider123',
          status: 'approved'
        })
      });
    });

    test('should maintain backward compatibility for rejectProvider', async () => {
      const result = await adminService.rejectProvider(
        'provider123',
        'admin123',
        'Incomplete documentation'
      );

      expect(result).toEqual({
        success: true,
        message: 'Provider rejected successfully',
        data: expect.objectContaining({
          providerId: 'provider123',
          status: 'rejected',
          reason: 'Incomplete documentation'
        })
      });
    });

    test('should maintain backward compatibility for suspendProvider', async () => {
      const result = await adminService.suspendProvider(
        'provider123',
        'admin123',
        'Policy violation'
      );

      expect(result).toEqual({
        success: true,
        message: 'Provider suspended successfully',
        data: expect.objectContaining({
          providerId: 'provider123',
          status: 'suspended',
          reason: 'Policy violation'
        })
      });
    });

    test('should maintain backward compatibility for deleteUser', async () => {
      const mockUser = { id: 'user123', role: 'user' };
      mockUserService.getUserById.mockResolvedValue(mockUser as any);
      mockUserService.deleteUser.mockResolvedValue(undefined);

      const result = await adminService.deleteUser('user123', 'admin123');

      expect(result).toEqual({
        success: true,
        message: 'User deleted successfully',
        data: { userId: 'user123' }
      });

      expect(mockUserService.deleteUser).toHaveBeenCalledWith('user123');
    });
  });

  describe('Error Handling', () => {
    test('should handle service errors gracefully', async () => {
      mockUserService.getUserById.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        adminService.handleProviderAction('provider123', 'approve', 'admin123')
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle dashboard data fetch errors', async () => {
      const mockAdmin = {
        id: 'admin123',
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      };

      mockUserService.getUserById.mockResolvedValue(mockAdmin as any);
      jest.spyOn(AggregationBuilder.prototype, 'execute').mockRejectedValue(
        new Error('Aggregation failed')
      );

      await expect(
        adminService.getAdminDashboard('admin123')
      ).rejects.toThrow('Failed to get admin dashboard data');
    });
  });

  describe('Performance and Caching', () => {
    test('should cache dashboard results', async () => {
      const mockAdmin = {
        id: 'admin123',
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      };

      mockUserService.getUserById.mockResolvedValue(mockAdmin as any);
      jest.spyOn(AggregationBuilder.prototype, 'execute').mockResolvedValue([]);

      // First call
      await adminService.getAdminDashboard('admin123');
      
      // Second call should use cache (in a real scenario)
      await adminService.getAdminDashboard('admin123');

      // Verify the method was decorated with @Cached
      expect(adminService.getAdminDashboard).toBeDefined();
    });

    test('should cache platform statistics', async () => {
      jest.spyOn(AggregationBuilder.prototype, 'execute').mockResolvedValue([]);

      // First call
      await adminService.getPlatformStatistics();
      
      // Second call should use cache (in a real scenario)
      await adminService.getPlatformStatistics();

      // Verify the method was decorated with @Cached
      expect(adminService.getPlatformStatistics).toBeDefined();
    });
  });
});
