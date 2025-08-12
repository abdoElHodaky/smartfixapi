import 'reflect-metadata';
import { Response } from 'express';
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
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
import { IProviderService } from '../../interfaces/services';

/**
 * Provider Controller using decorators
 * Handles service provider operations, profiles, and service management
 */
@Injectable()
@Controller('/api/providers')
export class ProviderController {
  private providerService: IProviderService;

  constructor() {
    this.providerService = serviceContainer.getProviderService();
  }

  /**
   * Get provider profile
   * GET /api/providers/profile
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

      const result = await this.providerService.getProviderProfile(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve provider profile'
      });
    }
  }

  /**
   * Update provider profile
   * PUT /api/providers/profile
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

      const result = await this.providerService.updateProviderProfile(req.user.id, body);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update provider profile'
      });
    }
  }

  /**
   * Get provider's service requests
   * GET /api/providers/service-requests
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

      const result = await this.providerService.getProviderServiceRequests(req.user.id, filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve service requests'
      });
    }
  }

  /**
   * Get available service requests for provider
   * GET /api/providers/available-requests
   */
  @Get('/available-requests')
  @Status(200)
  async getAvailableRequests(
    @Req() req: AuthRequest,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('service') service: string,
    @Query('location') location: string,
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
        service: service || undefined,
        location: location || undefined
      };

      const result = await this.providerService.getAvailableServiceRequests(req.user.id, filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve available requests'
      });
    }
  }

  /**
   * Submit proposal for service request
   * POST /api/providers/proposals
   */
  @Post('/proposals')
  @Status(201)
  async submitProposal(@Req() req: AuthRequest, @Body() body: any, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.providerService.submitProposal(req.user.id, body.requestId, body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit proposal'
      });
    }
  }

  /**
   * Get provider dashboard
   * GET /api/providers/dashboard
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

      const result = await this.providerService.getProviderDashboard(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve dashboard data'
      });
    }
  }

  /**
   * Update provider availability
   * PUT /api/providers/availability
   */
  @Put('/availability')
  @Status(200)
  async updateAvailability(@Req() req: AuthRequest, @Body() body: any, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.providerService.updateProviderAvailability(req.user.id, body);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update availability'
      });
    }
  }

  /**
   * Add portfolio item
   * POST /api/providers/portfolio
   */
  @Post('/portfolio')
  @Status(201)
  async addPortfolioItem(@Req() req: AuthRequest, @Body() body: any, @Res() res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.providerService.addPortfolioItem(req.user.id, body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add portfolio item'
      });
    }
  }

  /**
   * Get provider by ID (public endpoint)
   * GET /api/providers/:providerId
   */
  @Get('/:providerId')
  @Status(200)
  async getProviderById(@Params('providerId') providerId: string, @Res() res: Response): Promise<void> {
    try {
      const result = await this.providerService.getProviderById(providerId);
      res.json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Provider not found'
      });
    }
  }

  /**
   * Search providers
   * GET /api/providers/search
   */
  @Get('/search')
  @Status(200)
  async searchProviders(
    @Query('service') service: string,
    @Query('location') location: string,
    @Query('rating') rating: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      const filters: any = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      };

      if (service) {
        filters.services = [service];
      }
      if (location) {
        // Assuming location is in format "lat,lng"
        const coords = location.split(',').map(Number);
        if (coords.length === 2) {
          filters.location = coords as [number, number];
        }
      }
      if (rating) {
        filters.minRating = parseFloat(rating);
      }

      const result = await this.providerService.searchProviders(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search providers'
      });
    }
  }
}
