/**
 * Modern RequestController
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
import { IServiceRequestService } from '../../interfaces/services';

// DTO imports
import { 
  ServiceRequestDto,
  ServiceRequestUpdateDto,
  ServiceRequestResponseDto,
  ServiceRequestSearchDto,
  CreateRequestDto,
  UpdateRequestDto,
  RequestQueryDto,
  RequestLocationQueryDto,
  RequestMatchingQueryDto,
  ObjectIdParamDto,
  RequestIdParamDto,
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
  UseMiddleware 
} from '../../decorators';

// Middleware imports
import { validateBody, validateQuery, validateParams } from '../../middleware';

@Controller({ path: '/requests' })
export class RequestController extends BaseController {
  private serviceRequestService: IServiceRequestService;

  constructor() {
    super();
    this.serviceRequestService = this.serviceRegistry.getServiceRequestService();
  }

  /**
   * Create a new service request
   */
  @Post('/')
  @RequireAuth()
  @UseMiddleware(validateBody(CreateRequestDto))
  createServiceRequest = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Create Service Request');

    if (!this.requireAuth(req, res)) {
      return;
    }

    try {
      const requestData = {
        ...req.body,
        userId: req.user!.id
      } as ServiceRequestDto;

      const result = await this.serviceRequestService.createServiceRequest(requestData);
      this.sendSuccess<ServiceRequestResponseDto>(res, result, 'Service request created successfully', 201);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to create service request', 400);
    }
  });

  /**
   * Get user's service requests
   */
  @Get('/my-requests')
  @RequireAuth()
  @UseMiddleware(validateQuery(RequestQueryDto))
  getMyRequests = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get My Service Requests');

    if (!this.requireAuth(req, res)) {
      return;
    }

    try {
      const queryParams = req.query as any;
      const result = await this.serviceRequestService.getUserRequests(req.user!.id, {
        ...queryParams,
        userId: req.user!.id
      });
      this.sendSuccess(res, result, 'Service requests retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get service requests', 400);
    }
  });

  /**
   * Get service request by ID
   */
  @Get('/:requestId')
  @RequireAuth()
  @UseMiddleware(validateParams(RequestIdParamDto))
  getServiceRequest = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Service Request');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { requestId } = req.params;

    try {
      const result = await this.serviceRequestService.getServiceRequestById(requestId, req.user!.id);
      this.sendSuccess<ServiceRequestResponseDto>(res, result, 'Service request retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get service request', 400);
    }
  });

  /**
   * Update service request
   */
  @Put('/:requestId')
  @RequireAuth()
  @UseMiddleware(validateParams(RequestIdParamDto))
  @UseMiddleware(validateBody(UpdateRequestDto))
  updateServiceRequest = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Update Service Request');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { requestId } = req.params;

    try {
      const result = await this.serviceRequestService.updateServiceRequest(
        requestId, 
        req.user!.id, 
        req.body as ServiceRequestUpdateDto
      );
      this.sendSuccess<ServiceRequestResponseDto>(res, result, 'Service request updated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update service request', 400);
    }
  });

  /**
   * Cancel service request
   */
  @Delete('/:requestId')
  @RequireAuth()
  @UseMiddleware(validateParams(RequestIdParamDto))
  cancelServiceRequest = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Cancel Service Request');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { requestId } = req.params;

    try {
      await this.serviceRequestService.cancelServiceRequest(requestId, req.user!.id, req.body.reason);
      this.sendSuccess(res, null, 'Service request cancelled successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to cancel service request', 400);
    }
  });

  /**
   * Accept provider for service request
   */
  @Post('/:requestId/accept-provider/:providerId')
  @RequireAuth()
  acceptProvider = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Accept Provider for Service Request');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { requestId, providerId } = req.params;

    if (!requestId || !providerId) {
      this.sendError(res, 'Request ID and Provider ID are required', 400);
      return;
    }

    try {
      const result = await this.serviceRequestService.acceptProvider(requestId, req.user!.id, providerId);
      this.sendSuccess(res, result, 'Provider accepted successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to accept provider', 400);
    }
  });

  /**
   * Reject provider for service request
   */
  @Post('/:requestId/reject-provider/:providerId')
  @RequireAuth()
  rejectProvider = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Reject Provider for Service Request');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { requestId, providerId } = req.params;

    if (!requestId || !providerId) {
      this.sendError(res, 'Request ID and Provider ID are required', 400);
      return;
    }

    try {
      await this.serviceRequestService.rejectProvider(requestId, req.user!.id, providerId, req.body.reason);
      this.sendSuccess(res, null, 'Provider rejected successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to reject provider', 400);
    }
  });

  /**
   * Mark service request as completed
   */
  @Post('/:requestId/complete')
  @RequireAuth()
  @UseMiddleware(validateParams(RequestIdParamDto))
  completeServiceRequest = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Complete Service Request');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { requestId } = req.params;

    try {
      const result = await this.serviceRequestService.completeServiceRequest(
        requestId, 
        req.user!.id, 
        req.body.completionNotes
      );
      this.sendSuccess(res, result, 'Service request completed successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to complete service request', 400);
    }
  });

  /**
   * Get service request quotes
   */
  @Get('/:requestId/quotes')
  @RequireAuth()
  @UseMiddleware(validateParams(RequestIdParamDto))
  getServiceRequestQuotes = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Service Request Quotes');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { requestId } = req.params;

    try {
      const result = await this.serviceRequestService.getServiceRequestQuotes(requestId, req.user!.id);
      this.sendSuccess(res, result, 'Service request quotes retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get service request quotes', 400);
    }
  });

  /**
   * Accept quote for service request
   */
  @Post('/:requestId/quotes/:quoteId/accept')
  @RequireAuth()
  acceptQuote = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Accept Quote');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { requestId, quoteId } = req.params;

    if (!requestId || !quoteId) {
      this.sendError(res, 'Request ID and Quote ID are required', 400);
      return;
    }

    try {
      const result = await this.serviceRequestService.acceptQuote(requestId, quoteId, req.user!.id);
      this.sendSuccess(res, result, 'Quote accepted successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to accept quote', 400);
    }
  });

  /**
   * Reject quote for service request
   */
  @Post('/:requestId/quotes/:quoteId/reject')
  @RequireAuth()
  rejectQuote = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Reject Quote');

    if (!this.requireAuth(req, res)) {
      return;
    }

    const { requestId, quoteId } = req.params;

    if (!requestId || !quoteId) {
      this.sendError(res, 'Request ID and Quote ID are required', 400);
      return;
    }

    try {
      await this.serviceRequestService.rejectQuote(requestId, quoteId, req.user!.id, req.body.reason);
      this.sendSuccess(res, null, 'Quote rejected successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to reject quote', 400);
    }
  });

  // Provider endpoints for service requests

  /**
   * Get available service requests for providers
   */
  @Get('/available')
  @RequireAuth()
  @RequireRoles('provider')
  @UseMiddleware(validateQuery(RequestMatchingQueryDto))
  getAvailableRequests = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get Available Service Requests');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    try {
      const queryParams = req.query as any;
      const result = await this.serviceRequestService.getAvailableRequests(req.user!.id, {
        ...queryParams,
        providerId: req.user!.id
      } as ServiceRequestSearchDto);
      this.sendSuccess(res, result, 'Available service requests retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get available service requests', 400);
    }
  });

  /**
   * Submit quote for service request
   */
  @Post('/:requestId/quote')
  @RequireAuth()
  @RequireRoles('provider')
  @UseMiddleware(validateParams(RequestIdParamDto))
  submitQuote = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Submit Quote');

    if (!this.requireRole(req, res, ['provider'])) {
      return;
    }

    const { requestId } = req.params;

    try {
      const result = await this.serviceRequestService.submitQuote(requestId, req.user!.id, req.body);
      this.sendSuccess(res, result, 'Quote submitted successfully', 201);
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to submit quote', 400);
    }
  });

  // Admin endpoints

  /**
   * Get all service requests (Admin only)
   */
  @Get('/admin/all')
  @RequireAuth()
  @RequireRoles('admin')
  @UseMiddleware(validateQuery(RequestQueryDto))
  getAllServiceRequests = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Get All Service Requests (Admin)');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    try {
      const queryParams = req.query as any;
      const result = await this.serviceRequestService.getAllServiceRequests(queryParams);
      this.sendSuccess(res, result, 'All service requests retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to get all service requests', 400);
    }
  });

  /**
   * Update service request status (Admin only)
   */
  @Put('/admin/:requestId/status')
  @RequireAuth()
  @RequireRoles('admin')
  @UseMiddleware(validateParams(RequestIdParamDto))
  updateServiceRequestStatus = this.asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    this.logRequest(req, 'Update Service Request Status (Admin)');

    if (!this.requireRole(req, res, ['admin'])) {
      return;
    }

    const { requestId } = req.params;

    try {
      const result = await this.serviceRequestService.updateServiceRequestStatus(
        requestId, 
        req.body.status, 
        req.body.reason
      );
      this.sendSuccess(res, result, 'Service request status updated successfully');
    } catch (error: any) {
      this.sendError(res, error.message || 'Failed to update service request status', 400);
    }
  });
}
