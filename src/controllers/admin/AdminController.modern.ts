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
import { Request, Response } from 'express';

// Internal imports
import { BaseController } from '../BaseController';
import { AuthRequest } from '../../types';
import { IAdminService } from '../../interfaces/services';

// Utility imports
import { ConditionalHelpers } from '../../utils/conditions/ConditionalHelpers';

// DTO imports
import { 
  AdminDashboardDto,
  UserManagementDto,
  ProviderApprovalDto,
  SystemStatsDto,
  AdminReportDto
} from '../../dtos';

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
  getDashboard = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Admin Dashboard');

    // Optimized: Use ConditionalHelpers for guard clause
    const authError = ConditionalHelpers.guardAuthorized(req.user?.role || '', ['admin']);
    if (authError) {
      this.sendError(res, authError, 403);
      return;
    }

    try {
      const result = await this.adminService.getDashboardStats();
      this.sendSuccess<AdminDashboardDto>(res, result, 'Dashboard statistics retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get dashboard statistics', 400);
    }
  });

  /**
   * Get all users with pagination and filtering
   */
  @Get('/users')
  @RequireAuth()
  @RequireRoles('admin')
  getUsers = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get All Users');

    // Optimized: Use ConditionalHelpers for guard clause
    const authError = ConditionalHelpers.guardAuthorized(req.user?.role || '', ['admin']);
    if (authError) {
      this.sendError(res, authError, 403);
      return;
    }

    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'firstName', 'lastName', 'email']);
    const filters = this.getFilterParams(req, ['role', 'isActive', 'isVerified']);

    try {
      const result = await this.adminService.getAllUsers({
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        filters
      });
      this.sendSuccess(res, result, 'Users retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get users', 400);
    }
  });

  /**
   * Get user details by ID
   */
  @Get('/users/:userId')
  @RequireAuth()
  @RequireRoles('admin')
  getUserById = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get User By ID');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const { userId } = req.params;

    try {
      const result = await this.adminService.getUserById(userId);
      this.sendSuccess(res, result, 'User details retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get user details', 400);
    }
  });

  /**
   * Update user status (activate/deactivate)
   */
  @Put('/users/:userId/status')
  @RequireAuth()
  @RequireRoles('admin')
  @Validate({
    isActive: { required: true }
  })
  updateUserStatus = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
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
      this.sendError(res, 'Validation failed', 400, bodyValidation.errors);
      return;
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    try {
      const result = await this.adminService.updateUserStatus(userId, isActive);
      this.sendSuccess(res, result, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update user status', 400);
    }
  });

  /**
   * Get all service providers with pagination and filtering
   */
  @Get('/providers')
  @RequireAuth()
  @RequireRoles('admin')
  getProviders = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get All Providers');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'businessName', 'rating']);
    const filters = this.getFilterParams(req, ['isVerified', 'serviceType', 'isActive']);

    try {
      const result = await this.adminService.getAllProviders({
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        filters
      });
      this.sendSuccess(res, result, 'Providers retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get providers', 400);
    }
  });

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
  updateProviderVerification = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Update Provider Verification');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      isVerified: { required: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    const { providerId } = req.params;
    const { isVerified, rejectionReason } = req.body;

    try {
      const result = await this.adminService.updateProviderVerification(providerId, {
        isVerified,
        rejectionReason,
        reviewedBy: req.user!.id,
        reviewedAt: new Date()
      });
      this.sendSuccess(res, result, `Provider ${isVerified ? 'approved' : 'rejected'} successfully`);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update provider verification', 400);
    }
  });

  /**
   * Get all service requests with pagination and filtering
   */
  @Get('/requests')
  @RequireAuth()
  @RequireRoles('admin')
  getServiceRequests = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get All Service Requests');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'status', 'budget']);
    const filters = this.getFilterParams(req, ['status', 'serviceType', 'urgency']);

    try {
      const result = await this.adminService.getAllServiceRequests({
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        filters
      });
      this.sendSuccess(res, result, 'Service requests retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get service requests', 400);
    }
  });

  /**
   * Get all reviews with pagination and filtering
   */
  @Get('/reviews')
  @RequireAuth()
  @RequireRoles('admin')
  getReviews = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get All Reviews');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'rating']);
    const filters = this.getFilterParams(req, ['rating', 'isFlagged']);

    try {
      const result = await this.adminService.getAllReviews({
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        filters
      });
      this.sendSuccess(res, result, 'Reviews retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get reviews', 400);
    }
  });

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
  flagReview = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Flag Review');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      isFlagged: { required: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    const { reviewId } = req.params;
    const { isFlagged, flagReason } = req.body;

    try {
      const result = await this.adminService.flagReview(reviewId, {
        isFlagged,
        flagReason,
        flaggedBy: req.user!.id,
        flaggedAt: new Date()
      });
      this.sendSuccess(res, result, `Review ${isFlagged ? 'flagged' : 'unflagged'} successfully`);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to flag review', 400);
    }
  });

  /**
   * Get system statistics
   */
  @Get('/statistics')
  @RequireAuth()
  @RequireRoles('admin')
  getSystemStatistics = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get System Statistics');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const { period } = req.query; // daily, weekly, monthly, yearly

    try {
      const result = await this.adminService.getSystemStatistics(period as string);
      this.sendSuccess<SystemStatsDto>(res, result, 'System statistics retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get system statistics', 400);
    }
  });

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
  generateReport = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Generate Admin Report');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      reportType: { required: true },
      dateRange: { required: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      const result = await this.adminService.generateReport(req.body);
      this.sendSuccess<AdminReportDto>(res, result, 'Report generated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to generate report', 400);
    }
  });

  /**
   * Get flagged content
   */
  @Get('/flagged-content')
  @RequireAuth()
  @RequireRoles('admin')
  getFlaggedContent = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Flagged Content');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const { page, limit, offset } = this.getPaginationParams(req);
    const { contentType } = req.query; // reviews, requests, messages

    try {
      const result = await this.adminService.getFlaggedContent({
        page,
        limit,
        offset,
        contentType: contentType as string
      });
      this.sendSuccess(res, result, 'Flagged content retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get flagged content', 400);
    }
  });

  /**
   * Delete user account (admin only)
   */
  @Delete('/users/:userId')
  @RequireAuth()
  @RequireRoles('admin')
  deleteUser = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Delete User');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const { userId } = req.params;

    try {
      await this.adminService.deleteUser(userId, req.user!.id);
      this.sendSuccess(res, null, 'User deleted successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to delete user', 400);
    }
  });

  /**
   * Get platform revenue statistics
   */
  @Get('/revenue')
  @RequireAuth()
  @RequireRoles('admin')
  getRevenueStatistics = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Revenue Statistics');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const { period, startDate, endDate } = req.query;

    try {
      const result = await this.adminService.getRevenueStatistics({
        period: period as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      this.sendSuccess(res, result, 'Revenue statistics retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get revenue statistics', 400);
    }
  });
}
