import { Response } from 'express';
import { serviceContainer } from '../../container/ServiceContainer';
import { RequestService } from '../../services/request/RequestService';
import { AuthRequest } from '../../types';
import { asyncHandler, AuthorizationError } from '../../middleware/errorHandler';
import { IServiceRequestService } from '../../interfaces/services';

export class RequestController {
  private serviceRequestService: IServiceRequestService;
  private requestService: RequestService;

  constructor() {
    this.serviceRequestService = serviceContainer.getServiceRequestService();
    this.requestService = new RequestService(); // This service may need refactoring later
  }
  /**
   * Create a new service request
   */
  createRequest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await this.requestService.createServiceRequest(req.user.id, req.body);
    res.status(201).json(result);
  });

  /**
   * Get service request by ID
   */
  getRequestById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { requestId } = req.params;

    const result = await this.requestService.getServiceRequestById(requestId, req.user?.id, req.user?.role);
    res.status(200).json(result);
  });

  /**
   * Update service request
   */
  updateRequest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { requestId } = req.params;

    const result = await this.requestService.updateServiceRequest(requestId, req.user.id, req.body);
    res.status(200).json(result);
  });

  /**
   * Accept a proposal
   */
  acceptProposal = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { requestId, proposalId } = req.params;

    const result = await this.requestService.acceptProposal(requestId, proposalId, req.user.id);
    res.status(200).json(result);
  });

  /**
   * Start service (mark as in progress)
   */
  startService = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const { requestId } = req.params;

    const result = await this.requestService.startService(requestId, req.user.id);
    res.status(200).json(result);
  });

  /**
   * Complete service
   */
  completeService = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const { requestId } = req.params;

    const result = await this.requestService.completeService(requestId, req.user.id, req.body);
    res.status(200).json(result);
  });

  /**
   * Approve service completion (by customer)
   */
  approveCompletion = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { requestId } = req.params;

    const result = await this.requestService.approveCompletion(requestId, req.user.id);
    res.status(200).json(result);
  });

  /**
   * Cancel service request
   */
  cancelRequest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { requestId } = req.params;

    const result = await this.requestService.cancelServiceRequest(requestId, req.user.id, req.body.reason);
    res.status(200).json(result);
  });

  /**
   * Get service requests with filters
   */
  getRequests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const searchParams = {
      status: req.query.status as string,
      category: req.query.category as string,
      location: req.query.location as string,
      radius: parseInt(req.query.radius as string) || 10,
      minBudget: req.query.minBudget ? parseFloat(req.query.minBudget as string) : undefined,
      maxBudget: req.query.maxBudget ? parseFloat(req.query.maxBudget as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: req.query.sort as string || 'createdAt'
    };

    const result = await this.requestService.getServiceRequests(searchParams);
    res.status(200).json(result);
  });

  /**
   * Get service request statistics
   */
  getStatistics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await this.requestService.getServiceRequestStatistics();
    res.status(200).json(result);
  });
}
