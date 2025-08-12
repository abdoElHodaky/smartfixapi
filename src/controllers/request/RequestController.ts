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
import { IServiceRequestService } from '../../interfaces/services';

/**
 * Service Request Controller using decorators
 */
@Injectable()
@Controller('/api/requests')
export class RequestController {
  private serviceRequestService: IServiceRequestService;

  constructor() {
    this.serviceRequestService = serviceContainer.getServiceRequestService();
  }

  /**
   * Create a new service request
   */
  @Post('/')
  @Auth
  @RateLimit({ windowMs: 60000, max: 10 })
  @AsyncHandler
  async createRequest(@Req() req: AuthRequest, @Res() res: Response, @Body() body: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.serviceRequestService.createServiceRequest(req.user.id, body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create request'
      });
    }
  }

  /**
   * Get user's service requests
   */
  @Get('/my-requests')
  @Auth
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getMyRequests(@Req() req: AuthRequest, @Res() res: Response, @Query() query: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      
      const result = await this.serviceRequestService.getUserServiceRequests(req.user.id, page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get requests'
      });
    }
  }

  /**
   * Get service request by ID
   */
  @Get('/:requestId')
  @Auth
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async getRequestById(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.serviceRequestService.getServiceRequestById(params.requestId);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get request'
      });
    }
  }

  /**
   * Update service request
   */
  @Put('/:requestId')
  @Auth
  @RateLimit({ windowMs: 60000, max: 50 })
  @AsyncHandler
  async updateRequest(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any, @Body() body: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.serviceRequestService.updateServiceRequest(params.requestId, req.user.id, body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update request'
      });
    }
  }

  /**
   * Delete service request
   */
  @Delete('/:requestId')
  @Auth
  @RateLimit({ windowMs: 60000, max: 20 })
  @AsyncHandler
  async deleteRequest(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.serviceRequestService.deleteServiceRequest(params.requestId, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete request'
      });
    }
  }

  /**
   * Search service requests
   */
  @Get('/')
  @RateLimit({ windowMs: 60000, max: 100 })
  @AsyncHandler
  async searchRequests(@Req() req: AuthRequest, @Res() res: Response, @Query() query: any): Promise<void> {
    try {
      const searchParams: any = {
        status: query.status as string,
        category: query.category as string,
        minBudget: query.minBudget ? parseFloat(query.minBudget as string) : undefined,
        maxBudget: query.maxBudget ? parseFloat(query.maxBudget as string) : undefined,
        page: parseInt(query.page as string) || 1,
        limit: parseInt(query.limit as string) || 10,
        search: query.search as string
      };

      // Handle location-based search
      if (query.location) {
        const coords = (query.location as string).split(',').map(coord => parseFloat(coord.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          searchParams.location = {
            coordinates: coords,
            radius: parseInt(query.radius as string) || 10
          };
        }
      }

      const result = await this.serviceRequestService.searchServiceRequests(searchParams);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search requests'
      });
    }
  }

  /**
   * Submit proposal for a service request
   */
  @Post('/:requestId/proposals')
  @Auth
  @RateLimit({ windowMs: 60000, max: 20 })
  @AsyncHandler
  async submitProposal(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any, @Body() body: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { requestId } = params;
      const result = await this.serviceRequestService.submitProposal(requestId, req.user.id, body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit proposal'
      });
    }
  }

  /**
   * Accept a proposal
   */
  @Put('/:requestId/proposals/:proposalId/accept')
  @Auth
  @RateLimit({ windowMs: 60000, max: 20 })
  @AsyncHandler
  async acceptProposal(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { requestId, proposalId } = params;
      const result = await this.serviceRequestService.acceptProposal(requestId, proposalId, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to accept proposal'
      });
    }
  }

  /**
   * Mark request as completed
   */
  @Put('/:requestId/complete')
  @Auth
  @RateLimit({ windowMs: 60000, max: 20 })
  @AsyncHandler
  async completeRequest(@Req() req: AuthRequest, @Res() res: Response, @Params() params: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { requestId } = params;
      const result = await this.serviceRequestService.completeServiceRequest(requestId, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to complete request'
      });
    }
  }
}
