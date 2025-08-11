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
import { serviceContainer } from '../../container/ServiceContainer';
import { AuthRequest } from '../../types';
import { IUserService } from '../../interfaces/services';

/**
 * User Controller using decorators
 * Handles user profile management, service requests, and account operations
 */
@Injectable()
@Controller('/api/users')
export class UserController {
  private userService: IUserService;

  constructor() {
    this.userService = serviceContainer.getUserService();
  }

  /**
   * Get user profile
   * GET /api/users/profile
   */
  @Get('/profile')
  @Status(200)
  async getProfile(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.userService.getUserProfile(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve profile'
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/users/profile
   */
  @Put('/profile')
  @Status(200)
  async updateProfile(@Req() req: AuthRequest, @Body() body: any, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.userService.updateUserProfile(req.user.id, body);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update profile'
      });
    }
  }

  /**
   * Upload profile image
   * POST /api/users/upload-image
   */
  @Post('/upload-image')
  @Status(200)
  async uploadProfileImage(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const result = await this.userService.uploadProfileImage(req.user.id, req.file);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload image'
      });
    }
  }

  /**
   * Get user's service requests
   * GET /api/users/service-requests
   */
  @Get('/service-requests')
  @Status(200)
  async getServiceRequests(
    @Req() req: AuthRequest, 
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        status: status || undefined
      };

      const result = await this.userService.getUserServiceRequests(req.user.id, filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve service requests'
      });
    }
  }

  /**
   * Get user's reviews
   * GET /api/users/reviews
   */
  @Get('/reviews')
  @Status(200)
  async getMyReviews(
    @Req() req: AuthRequest,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      };

      const result = await this.userService.getUserReviews(req.user.id, filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve reviews'
      });
    }
  }

  /**
   * Get user dashboard data
   * GET /api/users/dashboard
   */
  @Get('/dashboard')
  @Status(200)
  async getDashboard(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.userService.getUserDashboard(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve dashboard data'
      });
    }
  }

  /**
   * Update user location
   * PUT /api/users/location
   */
  @Put('/location')
  @Status(200)
  async updateLocation(@Req() req: AuthRequest, @Body() body: any, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.userService.updateUserLocation(req.user.id, body);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update location'
      });
    }
  }

  /**
   * Delete user account
   * DELETE /api/users/account
   */
  @Delete('/account')
  @Status(200)
  async deleteAccount(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.userService.deleteUserAccount(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete account'
      });
    }
  }

  /**
   * Get user by ID (public endpoint)
   * GET /api/users/:userId
   */
  @Get('/:userId')
  @Status(200)
  async getUserById(@Params('userId') userId: string, @Res() res: Response): Promise<void> {
    try {
      const result = await this.userService.getUserById(userId);
      res.json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'User not found'
      });
    }
  }

  /**
   * Search users
   * GET /api/users/search
   */
  @Get('/search')
  @Status(200)
  async searchUsers(
    @Query('query') query: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      const filters = {
        query: query || '',
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      };

      const result = await this.userService.searchUsers(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search users'
      });
    }
  }
}

