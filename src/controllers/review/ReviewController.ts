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
import { serviceContainer } from '../../container';
import { AuthRequest } from '../../types';
import { AuthorizationError } from '../../middleware/errorHandler';
import { Auth, RateLimit, AsyncHandler } from '../../decorators/middleware';
import { IReviewService } from '../../interfaces/services';

/**
 * Review Controller using decorators
 */
@Injectable()
@Controller('/api/reviews')
export class ReviewController {
  private reviewService: IReviewService;

  constructor() {
    this.reviewService = serviceContainer.getReviewService();
  }

  /**
   * Create a new review
   */
  @Post('/')
  @Auth
  @RateLimit({ windowMs: 60000, max: 10 })
  @AsyncHandler
  async createReview(@Req() req: AuthRequest, @Res() res: Response, @Body() body: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.reviewService.createReview(req.user.id, body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create review'
      });
    }
  }

  /**
   * Get reviews for a provider
   */
  @Get('/provider/:providerId')
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getProviderReviews(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any, @Query() query: any): Promise<void> {
    try {
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      
      const result = await this.reviewService.getProviderReviews(params.providerId, page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get provider reviews'
      });
    }
  }

  /**
   * Get reviews by a user
   */
  @Get('/user/:userId')
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getUserReviews(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any, @Query() query: any): Promise<void> {
    try {
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      
      const result = await this.reviewService.getUserReviews(params.userId, page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user reviews'
      });
    }
  }

  /**
   * Get review by ID
   */
  @Get('/:reviewId')
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getReviewById(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      const result = await this.reviewService.getReviewById(params.reviewId);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get review'
      });
    }
  }

  /**
   * Update review
   */
  @Put('/:reviewId')
  @Auth
  @RateLimit({ windowMs: 60000, max: 20 })
  @AsyncHandler
  async updateReview(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any, @Body() body: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.reviewService.updateReview(params.reviewId, req.user.id, body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update review'
      });
    }
  }

  /**
   * Delete review
   */
  @Delete('/:reviewId')
  @Auth
  @RateLimit({ windowMs: 60000, max: 10 })
  @AsyncHandler
  async deleteReview(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.reviewService.deleteReview(params.reviewId, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete review'
      });
    }
  }

  /**
   * Get review statistics for a provider
   */
  @Get('/provider/:providerId/stats')
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getProviderReviewStats(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      const result = await this.reviewService.getProviderReviewStats(params.providerId);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get review statistics'
      });
    }
  }

  /**
   * Report a review
   */
  @Post('/:reviewId/report')
  @Auth
  @RateLimit({ windowMs: 60000, max: 5 })
  @AsyncHandler
  async reportReview(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any, @Body() body: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.reviewService.reportReview(params.reviewId, req.user.id, body.reason);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to report review'
      });
    }
  }

  /**
   * Get all reviews with pagination (admin only)
   */
  @Get('/')
  @Auth
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getAllReviews(@Req() req: AuthRequest, @Res() res: Response, @Query() query: any): Promise<void> {
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
      
      const result = await this.reviewService.getAllReviews(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get reviews'
      });
    }
  }
}
