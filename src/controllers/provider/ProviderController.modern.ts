/**
 * Modern ProviderController
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
import { IProviderService } from '../../interfaces/services';

// DTO imports
import { 
  ProviderProfileDto,
  ProviderUpdateDto,
  ServiceOfferingDto,
  ProviderSearchDto,
  ProviderProfileResponseDto
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

@Controller({ path: '/providers' })
export class ProviderController extends BaseController {
  private providerService: IProviderService;

  constructor() {
    super();
    this.providerService = this.serviceRegistry.getProviderService();
  }

  /**
   * Get provider profile
   */
  @Get('/profile')
  @RequireAuth()
  @RequireRoles('provider')
  getProfile = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Provider Profile');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    try {
      const result = await this.providerService.getProviderProfile(req.user!.id);
      this.sendSuccess<ProviderProfileResponseDto>(res, result, 'Provider profile retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get provider profile', 400);
    }
  });

  /**
   * Update provider profile
   */
  @Put('/profile')
  @RequireAuth()
  @RequireRoles('provider')
  @Validate({
    businessName: { minLength: 2, maxLength: 100 },
    description: { minLength: 10, maxLength: 1000 },
    serviceType: { required: false }
  })
  updateProfile = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Update Provider Profile');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      businessName: { minLength: 2, maxLength: 100 },
      description: { minLength: 10, maxLength: 1000 }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      const result = await this.providerService.updateProviderProfile(req.user!.id, req.body as ProviderUpdateDto);
      this.sendSuccess<ProviderProfileResponseDto>(res, result, 'Provider profile updated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update provider profile', 400);
    }
  });

  /**
   * Get provider statistics
   */
  @Get('/statistics')
  @RequireAuth()
  @RequireRoles('provider')
  getStatistics = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Provider Statistics');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    try {
      const result = await this.providerService.getProviderStatistics(req.user!.id);
      this.sendSuccess(res, result, 'Provider statistics retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get provider statistics', 400);
    }
  });

  /**
   * Get provider service requests
   */
  @Get('/requests')
  @RequireAuth()
  @RequireRoles('provider')
  getServiceRequests = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Provider Service Requests');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'status', 'serviceType']);
    const filters = this.getFilterParams(req, ['status', 'serviceType', 'urgent']);

    try {
      const result = await this.providerService.getServiceRequests(req.user!.id, {
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        ...filters
      });
      this.sendSuccess(res, result, 'Service requests retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get service requests', 400);
    }
  });

  /**
   * Accept service request
   */
  @Post('/requests/:requestId/accept')
  @RequireAuth()
  @RequireRoles('provider')
  acceptServiceRequest = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Accept Service Request');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const { requestId } = req.params;

    if (!requestId) {
      this.sendError(res, 'Request ID is required', 400);
      return;
    }

    try {
      const result = await this.providerService.acceptServiceRequest(req.user!.id, requestId);
      this.sendSuccess(res, result, 'Service request accepted successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to accept service request', 400);
    }
  });

  /**
   * Decline service request
   */
  @Post('/requests/:requestId/decline')
  @RequireAuth()
  @RequireRoles('provider')
  @Validate({
    reason: { required: true, minLength: 10 }
  })
  declineServiceRequest = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Decline Service Request');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const { requestId } = req.params;
    const validation = this.validateRequest(req.body, {
      reason: { required: true, minLength: 10 }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      const result = await this.providerService.declineServiceRequest(req.user!.id, requestId, req.body.reason);
      this.sendSuccess(res, result, 'Service request declined successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to decline service request', 400);
    }
  });

  /**
   * Complete service request
   */
  @Post('/requests/:requestId/complete')
  @RequireAuth()
  @RequireRoles('provider')
  @Validate({
    completionNotes: { minLength: 10 }
  })
  completeServiceRequest = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Complete Service Request');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const { requestId } = req.params;

    try {
      const result = await this.providerService.completeServiceRequest(
        req.user!.id, 
        requestId, 
        req.body.completionNotes
      );
      this.sendSuccess(res, result, 'Service request completed successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to complete service request', 400);
    }
  });

  /**
   * Get provider reviews
   */
  @Get('/reviews')
  @RequireAuth()
  @RequireRoles('provider')
  getReviews = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Provider Reviews');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'rating']);

    try {
      const result = await this.providerService.getProviderReviews(req.user!.id, {
        page,
        limit,
        offset,
        sortBy,
        sortOrder
      });
      this.sendSuccess(res, result, 'Provider reviews retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get provider reviews', 400);
    }
  });

  /**
   * Add service offering
   */
  @Post('/services')
  @RequireAuth()
  @RequireRoles('provider')
  @Validate({
    serviceType: { required: true },
    title: { required: true, minLength: 5, maxLength: 100 },
    description: { required: true, minLength: 20, maxLength: 1000 },
    price: { required: true }
  })
  addServiceOffering = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Add Service Offering');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      serviceType: { required: true },
      title: { required: true, minLength: 5, maxLength: 100 },
      description: { required: true, minLength: 20, maxLength: 1000 },
      price: { required: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      const result = await this.providerService.addServiceOffering(req.user!.id, req.body as ServiceOfferingDto);
      this.sendSuccess(res, result, 'Service offering added successfully', 201);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to add service offering', 400);
    }
  });

  /**
   * Update service offering
   */
  @Put('/services/:serviceId')
  @RequireAuth()
  @RequireRoles('provider')
  @Validate({
    title: { minLength: 5, maxLength: 100 },
    description: { minLength: 20, maxLength: 1000 }
  })
  updateServiceOffering = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Update Service Offering');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const { serviceId } = req.params;

    if (!serviceId) {
      this.sendError(res, 'Service ID is required', 400);
      return;
    }

    try {
      const result = await this.providerService.updateServiceOffering(
        req.user!.id, 
        serviceId, 
        req.body as Partial<ServiceOfferingDto>
      );
      this.sendSuccess(res, result, 'Service offering updated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update service offering', 400);
    }
  });

  /**
   * Delete service offering
   */
  @Delete('/services/:serviceId')
  @RequireAuth()
  @RequireRoles('provider')
  deleteServiceOffering = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Delete Service Offering');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const { serviceId } = req.params;

    if (!serviceId) {
      this.sendError(res, 'Service ID is required', 400);
      return;
    }

    try {
      await this.providerService.deleteServiceOffering(req.user!.id, serviceId);
      this.sendSuccess(res, null, 'Service offering deleted successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to delete service offering', 400);
    }
  });

  /**
   * Get service offerings
   */
  @Get('/services')
  @RequireAuth()
  @RequireRoles('provider')
  getServiceOfferings = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Service Offerings');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    try {
      const result = await this.providerService.getServiceOfferings(req.user!.id);
      this.sendSuccess(res, result, 'Service offerings retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get service offerings', 400);
    }
  });

  /**
   * Update availability
   */
  @Put('/availability')
  @RequireAuth()
  @RequireRoles('provider')
  @Validate({
    isAvailable: { required: true }
  })
  updateAvailability = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Update Availability');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const validation = this.validateRequest(req.body, {
      isAvailable: { required: true }
    });

    if (!validation.isValid) {
      this.sendError(res, 'Validation failed', 400, validation.errors);
      return;
    }

    try {
      const result = await this.providerService.updateAvailability(req.user!.id, req.body.isAvailable);
      this.sendSuccess(res, result, 'Availability updated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update availability', 400);
    }
  });

  // Public endpoints for searching providers

  /**
   * Search providers
   */
  @Get('/search')
  searchProviders = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logRequest(req, 'Search Providers');

    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['rating', 'distance', 'createdAt']);
    const filters = this.getFilterParams(req, ['serviceType', 'location', 'rating', 'isAvailable']);

    try {
      const result = await this.providerService.searchProviders({
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        ...filters
      } as ProviderSearchDto);
      this.sendSuccess(res, result, 'Providers retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to search providers', 400);
    }
  });

  /**
   * Get provider by ID (public)
   */
  @Get('/:providerId')
  getProviderById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Provider By ID');

    const { providerId } = req.params;

    if (!providerId) {
      this.sendError(res, 'Provider ID is required', 400);
      return;
    }

    try {
      const result = await this.providerService.getProviderById(providerId);
      this.sendSuccess(res, result, 'Provider retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get provider', 400);
    }
  });

  /**
   * Get provider reviews (public)
   */
  @Get('/:providerId/reviews')
  getProviderReviews = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Provider Reviews (Public)');

    const { providerId } = req.params;
    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req, ['createdAt', 'rating']);

    if (!providerId) {
      this.sendError(res, 'Provider ID is required', 400);
      return;
    }

    try {
      const result = await this.providerService.getProviderReviews(providerId, {
        page,
        limit,
        offset,
        sortBy,
        sortOrder
      });
      this.sendSuccess(res, result, 'Provider reviews retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get provider reviews', 400);
    }
  });
}
