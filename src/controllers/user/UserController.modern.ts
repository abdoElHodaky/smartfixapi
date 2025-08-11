/**
 * Modern UserController
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
import { IUserService } from '../../interfaces/services';

// DTO imports
import { 
  UserProfileDto,
  UserUpdateDto,
  UserProfileResponseDto,
  PaginationDto
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

@Controller({ path: '/users' })
export class UserController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = this.serviceRegistry.getUserService();
  }

  /**
   * Get user profile
   */
  @Get('/profile')
  @RequireAuth()
  getProfile = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get User Profile');

    if (!this.requireAuth(req, res)) {
      return;
    }

    try {
      const result = await this.userService.getUserProfile(req.user!.id);
      this.sendSuccess<UserProfileResponseDto>(res, result, 'Profile retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get profile', 400);
    }
  });

  /**
   * Update user profile
   */
  @Put('/profile')
  @RequireAuth()
  @Validate({
    firstName: { minLength: 2, maxLength: 50 },
    lastName: { minLength: 2, maxLength: 50 },
    phone: { minLength: 10 }
  })
  updateProfile = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Update User Profile');

    if (!this.requireAuth(req, res)) {
      return;
    }

    // Validate request data
    const validation = this.validateRequest(req.body, {
      firstName: { minLength: 2, maxLength: 50 },
      lastName: { minLength: 2, maxLength: 50 },
      phone: { minLength: 10 }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      const result = await this.userService.updateUserProfile(req.user!.id, req.body as UserUpdateDto);
      this.sendSuccess<UserProfileResponseDto>(res, result, 'Profile updated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update profile', 400);
    }
  });

  /**
   * Upload profile image
   */
  @Post('/profile/image')
  @RequireAuth()
  uploadProfileImage = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Upload Profile Image');

    if (!this.requireAuth(req, res)) {
      return;
    }

    if (!req.file) {
      this.sendError(res, 'No image file provided', 400);
      return;
    }

    try {
      const result = await this.userService.uploadProfileImage(req.user!.id, req.file);
      this.sendSuccess(res, result, 'Profile image uploaded successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to upload image', 400);
    }
  });

  /**
   * Delete profile image
   */
  @Delete('/profile/image')
  @RequireAuth()
  deleteProfileImage = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Delete Profile Image');

    if (!this.requireAuth(req, res)) {
      return;
    }

    try {
      await this.userService.deleteProfileImage(req.user!.id);
      this.sendSuccess(res, null, 'Profile image deleted successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to delete image', 400);
    }
  });

  /**
   * Get user statistics
   */
  @Get('/statistics')
  @RequireAuth()
  getUserStatistics = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get User Statistics');

    if (!this.requireAuth(req, res)) {
      return;
    }

    try {
      const result = await this.userService.getUserStatistics(req.user!.id);
      this.sendSuccess(res, result, 'Statistics retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get statistics', 400);
    }
  });

  /**
   * Get user service requests
   */
  @Get('/requests')
  @RequireAuth()
  getUserRequests = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get User Requests');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'status', 'serviceType']);
    const filters = this.getFilterParams(req, ['status', 'serviceType']);

    try {
      const result = await this.userService.getUserRequests(req.user!.id, {
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        ...filters
      });
      this.sendSuccess(res, result, 'Requests retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get requests', 400);
    }
  });

  /**
   * Get user reviews
   */
  @Get('/reviews')
  @RequireAuth()
  getUserReviews = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get User Reviews');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'rating']);

    try {
      const result = await this.userService.getUserReviews(req.user!.id, {
        page,
        limit,
        offset,
        sortBy,
        sortOrder
      });
      this.sendSuccess(res, result, 'Reviews retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get reviews', 400);
    }
  });

  /**
   * Change password
   */
  @Put('/password')
  @RequireAuth()
  @Validate({
    currentPassword: { required: true },
    newPassword: { required: true, minLength: 6 }
  })
  changePassword = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Change Password');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      currentPassword: { required: true },
      newPassword: { required: true, minLength: 6 }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      await this.userService.changePassword(
        req.user!.id, 
        req.body.currentPassword, 
        req.body.newPassword
      );
      this.sendSuccess(res, null, 'Password changed successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to change password', 400);
    }
  });

  /**
   * Deactivate user account
   */
  @Delete('/account')
  @RequireAuth()
  @Validate({
    password: { required: true }
  })
  deactivateAccount = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Deactivate Account');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      password: { required: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      await this.userService.deactivateAccount(req.user!.id, req.body.password);
      this.sendSuccess(res, null, 'Account deactivated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to deactivate account', 400);
    }
  });

  /**
   * Get user notifications
   */
  @Get('/notifications')
  @RequireAuth()
  getNotifications = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Notifications');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { page, limit, offset } = this.getPaginationParams(req);
    const filters = this.getFilterParams(req, ['read', 'type']);

    try {
      const result = await this.userService.getNotifications(req.user!.id, {
        page,
        limit,
        offset,
        ...filters
      });
      this.sendSuccess(res, result, 'Notifications retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get notifications', 400);
    }
  });

  /**
   * Mark notification as read
   */
  @Put('/notifications/:notificationId/read')
  @RequireAuth()
  markNotificationRead = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Mark Notification Read');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { notificationId } = req.params;

    if (!notificationId) {
      this.sendError(res, 'Notification ID is required', 400);
      return;
    }

    try {
      await this.userService.markNotificationRead(req.user!.id, notificationId);
      this.sendSuccess(res, null, 'Notification marked as read');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to mark notification as read', 400);
    }
  });

  // Admin-only endpoints

  /**
   * Get all users (Admin only)
   */
  @Get('/')
  @RequireRoles('admin')
  getAllUsers = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get All Users (Admin)');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'firstName', 'lastName', 'email']);
    const filters = this.getFilterParams(req, ['role', 'isActive', 'isEmailVerified']);

    try {
      const result = await this.userService.getAllUsers({
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        ...filters
      });
      this.sendSuccess(res, result, 'Users retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get users', 400);
    }
  });

  /**
   * Get user by ID (Admin only)
   */
  @Get('/:userId')
  @RequireRoles('admin')
  getUserById = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get User By ID (Admin)');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const { userId } = req.params;

    if (!userId) {
      this.sendError(res, 'User ID is required', 400);
      return;
    }

    try {
      const result = await this.userService.getUserById(userId);
      this.sendSuccess(res, result, 'User retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get user', 400);
    }
  });

  /**
   * Update user status (Admin only)
   */
  @Put('/:userId/status')
  @RequireRoles('admin')
  @Validate({
    isActive: { required: true }
  })
  updateUserStatus = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Update User Status (Admin)');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const { userId } = req.params;
    const validation = this.validateRequest(req.body, {
      isActive: { required: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      const result = await this.userService.updateUserStatus(userId, req.body.isActive);
      this.sendSuccess(res, result, 'User status updated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update user status', 400);
    }
  });
}
