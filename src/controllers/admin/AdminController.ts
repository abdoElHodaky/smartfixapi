import 'reflect-metadata';
import { Response } from 'express';
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Body, 
  Req, 
  Res,
  Params,
  Query,
  Status
} from '@decorators/express';
import { Injectable } from '@decorators/di';
import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { serviceRegistry } from '../../container';
import { AuthRequest } from '../../types';
import { NotFoundError, AuthorizationError } from '../../middleware/errorHandler';
import { Auth, AdminOnly, RateLimit, AsyncHandler } from '../../decorators/middleware';
import { IAdminService } from '../../interfaces/services';

/**
 * Admin Controller using decorators
 */
@Injectable()
@Controller('/api/admin')
export class AdminController {
  private adminService: IAdminService;

  constructor() {
    this.adminService = serviceRegistry.getService('admin') as IAdminService;
  }

  /**
   * Get admin dashboard statistics
   */
  @Get('/dashboard')
  @Auth
  @AdminOnly
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getDashboard(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const [
        totalUsers,
        totalProviders,
        totalRequests,
        totalReviews,
        pendingRequests,
        activeRequests
      ] = await Promise.all([
        User.countDocuments({ status: 'active' }),
        ServiceProvider.countDocuments({ status: 'active' }),
        ServiceRequest.countDocuments(),
        Review.countDocuments(),
        ServiceRequest.countDocuments({ status: 'pending' }),
        ServiceRequest.countDocuments({ status: 'active' })
      ]);

      const stats = {
        totalUsers,
        totalProviders,
        totalRequests,
        totalReviews,
        pendingRequests,
        activeRequests,
        completedRequests: totalRequests - pendingRequests - activeRequests
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get dashboard stats'
      });
    }
  }

  /**
   * Get all users with pagination
   */
  @Get('/users')
  @Auth
  @AdminOnly
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getUsers(@Req() req: AuthRequest, @Res() res: Response, @Query() query: any): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      const users = await User.find()
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments();

      res.json({
        success: true,
        data: users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get users'
      });
    }
  }

  /**
   * Get user by ID
   */
  @Get('/users/:userId')
  @Auth
  @AdminOnly
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getUserById(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const user = await User.findById(params.userId).select('-password');
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user'
      });
    }
  }

  /**
   * Update user status
   */
  @Put('/users/:userId/status')
  @Auth
  @AdminOnly
  @RateLimit({ windowMs: 60000, max: 50 })
  @AsyncHandler
  async updateUserStatus(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any, @Body() body: any): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const { status } = body;
      
      if (!['active', 'inactive', 'suspended'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be active, inactive, or suspended'
        });
        return;
      }

      const user = await User.findByIdAndUpdate(
        params.userId,
        { status, updatedAt: new Date() },
        { new: true }
      ).select('-password');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'User status updated successfully',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user status'
      });
    }
  }

  /**
   * Delete user
   */
  @Delete('/users/:userId')
  @Auth
  @AdminOnly
  @RateLimit({ windowMs: 60000, max: 20 })
  @AsyncHandler
  async deleteUser(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const user = await User.findByIdAndDelete(params.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete user'
      });
    }
  }

  /**
   * Get all service providers
   */
  @Get('/providers')
  @Auth
  @AdminOnly
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getProviders(@Req() req: AuthRequest, @Res() res: Response, @Query() query: any): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      const providers = await ServiceProvider.find()
        .populate('userId', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await ServiceProvider.countDocuments();

      res.json({
        success: true,
        data: providers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get providers'
      });
    }
  }

  /**
   * Get all service requests
   */
  @Get('/requests')
  @Auth
  @AdminOnly
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getRequests(@Req() req: AuthRequest, @Res() res: Response, @Query() query: any): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      const requests = await ServiceRequest.find()
        .populate('userId', 'name email')
        .populate('providerId', 'businessName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await ServiceRequest.countDocuments();

      res.json({
        success: true,
        data: requests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get requests'
      });
    }
  }
}

