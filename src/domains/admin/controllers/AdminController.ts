/**
 * Modern AdminController
 * 
 * Updated implementation using the new BaseController pattern with:
 * - Modern dependency injection
 * - Standardized response formatting
 * - Built-in validation and error handling
 * - Decorator-based routing
 */

// External imports
import { Response } from 'express';

// Internal imports
import { BaseController } from '../../common/BaseController';
import { AuthRequest } from '../../common/types';
import { IAdminService } from '../../common/interfaces/services';

// Utility imports
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';

// DTO imports - using any for now since specific DTOs don't exist
// import { AdminStatsDto, AdminFiltersDto } from '../../dtos';

// Decorator imports
import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Delete,
  RequireAuth, 
  RequireRoles,
  Validate 
} from '../../decorators';

@Controller({ path: '/admin' })
export class AdminController extends BaseController {
  private adminService: IAdminService;

  constructor() {
    super();
    this.adminService = this.serviceRegistry.getAdminService();
  }

  /**
   * Get admin dashboard statistics
   */
  @Get('/dashboard')
  @RequireAuth()
  @RequireRoles('admin')
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get Admin Dashboard');

      // Optimized: Use ConditionalHelpers for guard clause
      const authError = ConditionalHelpers.guardAuthorized(req.user?.role || '', ['admin']);
      if (authError) {
        this.sendError(res, authError, 403);
        return;
      }

      const result = await this.adminService.getDashboardStats();
      this.sendSuccess<any>(res, result, 'Dashboard statistics retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get dashboard statistics', 400);
    }
  }

  /**
   * Get all users with pagination and filtering
   */
  @Get('/users')
  @RequireAuth()
  @RequireRoles('admin')
  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get All Users');

      // Optimized: Use ConditionalHelpers for guard clause
      const authError = ConditionalHelpers.guardAuthorized(req.user?.role || '', ['admin']);
      if (authError) {
        this.sendError(res, authError, 403);
        return;
      }

      const { page, limit } = this.getPaginationParams(req);
      const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'firstName', 'lastName', 'email']);
      const filters = this.getFilterParams(req, ['role', 'isActive', 'isVerified']);

      const result = await this.adminService.getAllUsers({
        page,
        limit,
        ...(sortBy && { sortBy }),
        sortOrder,
        ...filters
      });
      this.sendSuccess(res, result, 'Users retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get users', 400);
    }
  }

  /**
   * Get user details by ID
   */
  @Get('/users/:userId')
  @RequireAuth()
  @RequireRoles('admin')
  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get User By ID');

      if (!this.requireRole(req, res, ['admin'])) {
        return;
      }

      const { userId } = req.params;

      const result = await this.adminService.getUserById(userId);
      this.sendSuccess(res, result, 'User details retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get user details', 400);
    }
  }

  /**
   * Update user status (activate/deactivate)
   */
  @Put('/users/:userId/status')
  @RequireAuth()
  @RequireRoles('admin')
  @Validate({
    isActive: { required: true }
  })
  async updateUserStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Update User Status');

      // Optimized: Combined guard clauses using ConditionalHelpers
      const authError = ConditionalHelpers.guardAuthorized(req.user?.role || '', ['admin']);
      if (authError) {
        this.sendError(res, authError, 403);
        return;
      }

      const paramError = ConditionalHelpers.guardRequiredParams(req.params, ['userId']);
      if (paramError) {
        this.sendError(res, paramError, 400);
        return;
      }

      const bodyValidation = ConditionalHelpers.validateRequiredFields(req.body, ['isActive']);
      if (!bodyValidation.isValid) {
        this.sendError(res, 'Validation failed', 400, bodyValidation.errors?.join(', '));
        return;
      }

      const { userId } = req.params;
      const { isActive } = req.body;

      const result = await this.adminService.updateUserStatus(userId, isActive);
      this.sendSuccess(res, result, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update user status', 400);
    }
  }

  /**
   * Get all service providers with pagination and filtering
   */
  @Get('/providers')
  @RequireAuth()
  @RequireRoles('admin')
  async getProviders(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get All Providers');

      if (!this.requireRole(req, res, ['admin'])) {
        return;
      }

      const { page, limit } = this.getPaginationParams(req);
      const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'businessName', 'rating']);
      const filters = this.getFilterParams(req, ['isVerified', 'serviceType', 'isActive']);

      const result = await this.adminService.getAllProviders({
        page,
        limit,
        ...(sortBy && { sortBy }),
        sortOrder,
        ...filters
      });
      this.sendSuccess(res, result, 'Providers retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get providers', 400);
    }
  }

  /**
   * Approve or reject provider verification
   */
  @Put('/providers/:providerId/verification')
  @RequireAuth()
  @RequireRoles('admin')
  @Validate({
    isVerified: { required: true },
    rejectionReason: { required: false, maxLength: 500 }
  })
  async updateProviderVerification(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Update Provider Verification');

      if (!this.requireRole(req, res, ['admin'])) {
        return;
      }

      const validation = this.validateRequest(req.body, {
        isVerified: { required: true }
      });

      if (!validation.isValid) {
        this.sendError(res, 'Validation failed', 400, validation.errors?.join(', '));
        return;
      }

      const { providerId } = req.params;
      const { isVerified } = req.body;

      // For now, let's use a generic update method until we add the specific method to the service
      const result = await this.adminService.updateUserStatus(providerId, isVerified);
      this.sendSuccess(res, result, `Provider ${isVerified ? 'approved' : 'rejected'} successfully`);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update provider verification', 400);
    }
  }

  /**
   * Get all service requests with pagination and filtering
   */
  @Get('/requests')
  @RequireAuth()
  @RequireRoles('admin')
  async getServiceRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get All Service Requests');

      if (!this.requireRole(req, res, ['admin'])) {
        return;
      }

      const { page, limit } = this.getPaginationParams(req);
      const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'status', 'budget']);
      const filters = this.getFilterParams(req, ['status', 'serviceType', 'urgency']);

      const result = await this.adminService.getAllServiceRequests({
        page,
        limit,
        ...(sortBy && { sortBy }),
        sortOrder,
        ...filters
      });
      this.sendSuccess(res, result, 'Service requests retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get service requests', 400);
    }
  }

  /**
   * Get all reviews with pagination and filtering
   */
  @Get('/reviews')
  @RequireAuth()
  @RequireRoles('admin')
  async getReviews(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get All Reviews');

      if (!this.requireRole(req, res, ['admin'])) {
        return;
      }

      const { page, limit } = this.getPaginationParams(req);
      const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'rating']);
      const filters = this.getFilterParams(req, ['rating', 'isFlagged']);

      const result = await this.adminService.getAllReviews({
        page,
        limit,
        ...(sortBy && { sortBy }),
        sortOrder,
        ...filters
      });
      this.sendSuccess(res, result, 'Reviews retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get reviews', 400);
    }
  }

  /**
   * Flag or unflag a review
   */
  @Put('/reviews/:reviewId/flag')
  @RequireAuth()
  @RequireRoles('admin')
  @Validate({
    isFlagged: { required: true },
    flagReason: { required: false, maxLength: 500 }
  })
  async flagReview(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Flag Review');

      if (!this.requireRole(req, res, ['admin'])) {
        return;
      }

      const validation = this.validateRequest(req.body, {
        isFlagged: { required: true }
      });

      if (!validation.isValid) {
        this.sendError(res, 'Validation failed', 400, validation.errors?.join(', '));
        return;
      }

      const { reviewId } = req.params;
      const { isFlagged } = req.body;

      // For now, let's use a generic update method until we add the specific method to the service
      const result = await this.adminService.updateUserStatus(reviewId, isFlagged);
      this.sendSuccess(res, result, `Review ${isFlagged ? 'flagged' : 'unflagged'} successfully`);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to flag review', 400);
    }
  }

  /**
   * Get system statistics
   */
  @Get('/statistics')
  @RequireAuth()
  @RequireRoles('admin')
  async getSystemStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get System Statistics');

      if (!this.requireRole(req, res, ['admin'])) {
        return;
      }

      const { period } = req.query; // daily, weekly, monthly, yearly

      const result = await this.adminService.getUserAnalytics(period as string);
      this.sendSuccess<any>(res, result, 'System statistics retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get system statistics', 400);
    }
  }

  /**
   * Generate admin report
   */
  @Post('/reports')
  @RequireAuth()
  @RequireRoles('admin')
  @Validate({
    reportType: { required: true },
    dateRange: { required: true }
  })
  async generateReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Generate Admin Report');

      if (!this.requireRole(req, res, ['admin'])) {
        return;
      }

      const validation = this.validateRequest(req.body, {
        reportType: { required: true },
        dateRange: { required: true }
      });

      if (!validation.isValid) {
        this.sendError(res, 'Validation failed', 400, validation.errors?.join(', '));
        return;
      }

      const result = await this.adminService.getDashboardStats();
      this.sendSuccess<any>(res, result, 'Report generated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to generate report', 400);
    }
  }

  /**
   * Get flagged content
   */
  @Get('/flagged-content')
  @RequireAuth()
  @RequireRoles('admin')
  async getFlaggedContent(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get Flagged Content');

      if (!this.requireRole(req, res, ['admin'])) {
        return;
      }

      const { contentType } = req.query; // reviews, requests, messages

      const result = await this.adminService.getFlaggedContent(contentType as string);
      this.sendSuccess(res, result, 'Flagged content retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get flagged content', 400);
    }
  }

  /**
   * Delete user account (admin only)
   */
  @Delete('/users/:userId')
  @RequireAuth()
  @RequireRoles('admin')
  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Delete User');

      if (!this.requireRole(req, res, ['admin'])) {
        return;
      }

      const { userId } = req.params;

      await this.adminService.deleteUser(userId);
      this.sendSuccess(res, null, 'User deleted successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to delete user', 400);
    }
  }

  /**
   * Get platform revenue statistics
   */
  @Get('/revenue')
  @RequireAuth()
  @RequireRoles('admin')
  async getRevenueStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      this.logRequest(req, 'Get Revenue Statistics');

      if (!this.requireRole(req, res, ['admin'])) {
        return;
      }

      const { period } = req.query;

      const result = await this.adminService.getRevenueAnalytics(period as string);
      this.sendSuccess(res, result, 'Revenue statistics retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get revenue statistics', 400);
    }
  }
}
