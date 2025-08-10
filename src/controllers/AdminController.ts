import { Request, Response } from 'express';
import { serviceRegistry } from '../container';
import { IAdminService } from '../interfaces/services';
import { AdminFiltersDto } from '../dtos';

export class AdminController {
  private adminService: IAdminService;

  constructor() {
    this.adminService = serviceRegistry.getAdminService();
  }

  /**
   * Get all users (admin view)
   */
  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: AdminFiltersDto = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        role: req.query.role as any,
        status: req.query.status as any,
        isEmailVerified: req.query.isEmailVerified === 'true' ? true : req.query.isEmailVerified === 'false' ? false : undefined,
        search: req.query.search as string,
        registrationDateFrom: req.query.registrationDateFrom ? new Date(req.query.registrationDateFrom as string) : undefined,
        registrationDateTo: req.query.registrationDateTo ? new Date(req.query.registrationDateTo as string) : undefined,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
      };

      const result = await this.adminService.getAllUsers(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get user by ID (admin view)
   */
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = await this.adminService.getUserById(userId);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Update user status
   */
  updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      const result = await this.adminService.updateUserStatus(userId, status);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Delete user
   */
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const result = await this.adminService.deleteUser(userId);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get all providers (admin view)
   */
  getAllProviders = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: AdminFiltersDto = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        isVerified: req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined,
        status: req.query.status as any,
        category: req.query.category as string,
        rating: req.query.rating ? parseFloat(req.query.rating as string) : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
      };

      const result = await this.adminService.getAllProviders(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get provider by ID (admin view)
   */
  getProviderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId } = req.params;
      const provider = await this.adminService.getProviderById(providerId);
      res.json({ success: true, data: provider });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Verify provider
   */
  verifyProvider = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId } = req.params;
      const result = await this.adminService.verifyProvider(providerId);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Update provider status
   */
  updateProviderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId } = req.params;
      const { status } = req.body;
      const result = await this.adminService.updateProviderStatus(providerId, status);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Delete provider
   */
  deleteProvider = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId } = req.params;
      const result = await this.adminService.deleteProvider(providerId);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get all service requests (admin view)
   */
  getAllServiceRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: AdminFiltersDto = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        requestStatus: req.query.requestStatus as any,
        urgency: req.query.urgency as any,
        budget: req.query.budget ? parseFloat(req.query.budget as string) : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
      };

      const result = await this.adminService.getAllServiceRequests(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get service request by ID (admin view)
   */
  getServiceRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestId } = req.params;
      const serviceRequest = await this.adminService.getServiceRequestById(requestId);
      res.json({ success: true, data: serviceRequest });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Update service request status
   */
  updateServiceRequestStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestId } = req.params;
      const { status } = req.body;
      const result = await this.adminService.updateServiceRequestStatus(requestId, status);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get all reviews (admin view)
   */
  getAllReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: AdminFiltersDto = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        reviewRating: req.query.reviewRating ? parseInt(req.query.reviewRating as string) : undefined,
        isFlagged: req.query.isFlagged === 'true' ? true : req.query.isFlagged === 'false' ? false : undefined,
        isModerated: req.query.isModerated === 'true' ? true : req.query.isModerated === 'false' ? false : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
      };

      const result = await this.adminService.getAllReviews(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get review by ID (admin view)
   */
  getReviewById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reviewId } = req.params;
      const review = await this.adminService.getReviewById(reviewId);
      res.json({ success: true, data: review });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Moderate review
   */
  moderateReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reviewId } = req.params;
      const { action, reason } = req.body;
      const result = await this.adminService.moderateReview(reviewId, action, reason);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get dashboard statistics
   */
  getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get user analytics
   */
  getUserAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period } = req.query;
      const analytics = await this.adminService.getUserAnalytics(period as string || 'month');
      res.json({ success: true, data: analytics });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get provider analytics
   */
  getProviderAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period } = req.query;
      const analytics = await this.adminService.getProviderAnalytics(period as string || 'month');
      res.json({ success: true, data: analytics });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get revenue analytics
   */
  getRevenueAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period } = req.query;
      const analytics = await this.adminService.getRevenueAnalytics(period as string || 'month');
      res.json({ success: true, data: analytics });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get system health
   */
  getSystemHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.adminService.getSystemHealth();
      res.json({ success: true, data: health });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get audit logs
   */
  getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: AdminFiltersDto = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        createdFrom: req.query.createdFrom ? new Date(req.query.createdFrom as string) : undefined,
        createdTo: req.query.createdTo ? new Date(req.query.createdTo as string) : undefined,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
      };

      const result = await this.adminService.getAuditLogs(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get flagged content
   */
  getFlaggedContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      const result = await this.adminService.getFlaggedContent(type);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };

  /**
   * Moderate content
   */
  moderateContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { contentId, type } = req.params;
      const { action } = req.body;
      const result = await this.adminService.moderateContent(contentId, type, action);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  };
}
