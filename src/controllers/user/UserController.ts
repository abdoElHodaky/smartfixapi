import { Response } from 'express';
import { serviceContainer } from '../../container/ServiceContainer';
import { AuthRequest } from '../../types';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler';
import { IUserService } from '../../interfaces/services';

export class UserController {
  private userService: IUserService;

  constructor() {
    this.userService = serviceContainer.getUserService();
  }

  /**
   * Get user profile
   */
  getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await this.userService.getUserProfile(req.user.id);
    res.status(200).json(result);
  });

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await this.userService.updateUserProfile(req.user.id, req.body);
    res.status(200).json(result);
  });

  /**
   * Upload profile image
   */
  uploadProfileImage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!req.file) {
      throw new ValidationError('No image file provided');
    }

    const result = await this.userService.uploadProfileImage(req.user.id, req.file);
    res.status(200).json(result);
  });

  /**
   * Get user's service requests
   */
  getServiceRequests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const result = await this.userService.getUserServiceRequests(req.user.id, { page, limit, status });
    res.status(200).json(result);
  });

  /**
   * Get user's reviews (reviews they've written)
   */
  getMyReviews = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await this.userService.getUserReviews(req.user.id, { page, limit });
    res.status(200).json(result);
  });

  /**
   * Get user dashboard data
   */
  getDashboard = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await this.userService.getUserDashboard(req.user.id);
    res.status(200).json(result);
  });

  /**
   * Update user location
   */
  updateLocation = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await this.userService.updateUserLocation(req.user.id, req.body);
    res.status(200).json(result);
  });

  /**
   * Delete user account
   */
  deleteAccount = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await this.userService.deleteUserAccount(req.user.id);
    res.status(200).json(result);
  });

  /**
   * Get user by ID (for admin or public profile view)
   */
  getUserById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.params;

    const result = await this.userService.getUserById(userId);
    res.status(200).json(result);
  });

  /**
   * Search users (for admin purposes)
   */
  searchUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { q, role, isActive, page = 1, limit = 10 } = req.query;

    const result = await this.userService.searchUsers({
      q: q as string,
      role: role as string,
      isActive: isActive as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
    
    res.status(200).json(result);
  });
}
