import { Response } from 'express';
import { serviceContainer } from '../../container';
import { AuthRequest } from '../../types';
import { asyncHandler, AuthorizationError } from '../../middleware/errorHandler';
import { IProviderService } from '../../interfaces/services';

export class ProviderController {
  private providerService: IProviderService;

  constructor() {
    this.providerService = serviceContainer.getProviderService();
  }

  /**
   * Get provider profile
   */
  getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await this.providerService.getProviderProfile(req.user.id);
    res.status(200).json(result);
  });

  /**
   * Update provider profile
   */
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const result = await this.providerService.updateProviderProfile(req.user.id, req.body);
    res.status(200).json(result);
  });

  /**
   * Get provider's service requests
   */
  getServiceRequests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const result = await this.providerService.getProviderServiceRequests(req.user.id, { page, limit, status });
    res.status(200).json(result);
  });

  /**
   * Get available service requests (for providers to browse)
   */
  getAvailableRequests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;

    const result = await this.providerService.getAvailableRequests(req.user.id, { page, limit, category });
    res.status(200).json(result);
  });

  /**
   * Submit proposal for a service request
   */
  submitProposal = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const { requestId } = req.params;
    const proposalData = req.body;

    const result = await this.providerService.submitProposal(req.user.id, requestId, proposalData);
    res.status(201).json(result);
  });

  /**
   * Get provider dashboard data
   */
  getDashboard = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const result = await this.providerService.getProviderDashboard(req.user.id);
    res.status(200).json(result);
  });

  /**
   * Update availability status
   */
  updateAvailability = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const result = await this.providerService.updateProviderAvailability(req.user.id, req.body);
    res.status(200).json(result);
  });

  /**
   * Add portfolio item
   */
  addPortfolioItem = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const result = await this.providerService.addPortfolioItem(req.user.id, req.body);
    res.status(201).json(result);
  });

  /**
   * Get provider by ID (public view)
   */
  getProviderById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { providerId } = req.params;

    const result = await this.providerService.getProviderById(providerId);
    res.status(200).json(result);
  });

  /**
   * Search providers
   */
  searchProviders = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const searchParams: any = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: (req.query.sort as string) || 'rating'
    };

    if (req.query.services) {
      searchParams.services = (req.query.services as string).split(',');
    }
    if (req.query.location) {
      const coords = (req.query.location as string).split(',').map(Number);
      if (coords.length === 2) {
        searchParams.location = coords as [number, number];
      }
    }
    if (req.query.radius) {
      searchParams.radius = parseInt(req.query.radius as string) || 10;
    }
    if (req.query.minRating) {
      searchParams.minRating = parseFloat(req.query.minRating as string);
    }
    if (req.query.isVerified) {
      searchParams.isVerified = req.query.isVerified === 'true';
    }

    const result = await this.providerService.searchProviders(searchParams);
    res.status(200).json(result);
  });
}
