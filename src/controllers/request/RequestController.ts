import { Response } from 'express';
import { ServiceRequest } from '../../models/ServiceRequest';
import { ServiceProvider } from '../../models/ServiceProvider';
import { Chat } from '../../models/Chat';
import { ServiceRequestService } from '../../services/request/ServiceRequestService';
import { RequestService } from '../../services/request/RequestService';
import { AuthRequest } from '../../types';
import { asyncHandler, NotFoundError, ValidationError, AuthorizationError } from '../../middleware/errorHandler';

export class RequestController {
  private serviceRequestService: ServiceRequestService;
  private requestService: RequestService;

  constructor(
    serviceRequestService: ServiceRequestService = new ServiceRequestService(),
    requestService: RequestService = new RequestService()
  ) {
    this.serviceRequestService = serviceRequestService;
    this.requestService = requestService;
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

    const serviceRequestData = {
      ...req.body,
      userId: req.user.id
    };

    const serviceRequest = new ServiceRequest(serviceRequestData);
    await serviceRequest.save();

    // Populate user details for response
    await serviceRequest.populate('userId', 'firstName lastName profileImage phone');

    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      data: serviceRequest
    });
  });

  /**
   * Get service request by ID
   */
  getRequestById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { requestId } = req.params;

    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate('userId', 'firstName lastName profileImage phone')
      .populate('providerId', 'businessName rating userId')
      .populate('proposals.providerId', 'businessName rating userId');

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Check if user has permission to view this request
    if (req.user) {
      const isOwner = serviceRequest.userId._id.toString() === req.user.id;
      const isAssignedProvider = serviceRequest.providerId && 
        serviceRequest.providerId.userId.toString() === req.user.id;
      const hasProposal = serviceRequest.proposals.some(
        (p: any) => p.providerId.userId.toString() === req.user.id
      );

      if (!isOwner && !isAssignedProvider && !hasProposal && req.user.role !== 'admin') {
        throw new AuthorizationError('Access denied');
      }
    }

    res.status(200).json({
      success: true,
      message: 'Service request retrieved successfully',
      data: serviceRequest
    });
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

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Check if user owns this request
    if (serviceRequest.userId.toString() !== req.user.id) {
      throw new AuthorizationError('You can only update your own service requests');
    }

    // Only allow updates if request is still pending
    if (serviceRequest.status !== 'pending') {
      throw new ValidationError('Cannot update service request after it has been accepted');
    }

    const allowedUpdates = [
      'title', 'description', 'scheduledDate', 'scheduledTime', 
      'estimatedDuration', 'budget', 'priority', 'requirements', 'images'
    ];
    
    const updates: any = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      requestId,
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName profileImage phone');

    res.status(200).json({
      success: true,
      message: 'Service request updated successfully',
      data: updatedRequest
    });
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

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Check if user owns this request
    if (serviceRequest.userId.toString() !== req.user.id) {
      throw new AuthorizationError('You can only accept proposals for your own service requests');
    }

    if (serviceRequest.status !== 'pending') {
      throw new ValidationError('This service request is no longer available');
    }

    // Accept the proposal
    await serviceRequest.acceptProposal(proposalId);

    // Create a chat for the service request
    const participants = [serviceRequest.userId.toString()];
    const proposal = serviceRequest.proposals.id(proposalId);
    if (proposal) {
      const provider = await ServiceProvider.findById(proposal.providerId);
      if (provider) {
        participants.push(provider.userId.toString());
      }
    }

    await Chat.createChat(requestId, participants);

    // Populate the updated request
    await serviceRequest.populate([
      { path: 'userId', select: 'firstName lastName profileImage phone' },
      { path: 'providerId', select: 'businessName rating userId' },
      { path: 'proposals.providerId', select: 'businessName rating userId' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Proposal accepted successfully',
      data: serviceRequest
    });
  });

  /**
   * Start service (mark as in progress)
   */
  startService = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const { requestId } = req.params;

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Check if provider is assigned to this request
    const provider = await ServiceProvider.findOne({ userId: req.user.id });
    if (!provider || serviceRequest.providerId?.toString() !== provider._id.toString()) {
      throw new AuthorizationError('You are not assigned to this service request');
    }

    if (serviceRequest.status !== 'accepted') {
      throw new ValidationError('Service request must be accepted before starting');
    }

    serviceRequest.status = 'in_progress';
    await serviceRequest.save();

    res.status(200).json({
      success: true,
      message: 'Service started successfully',
      data: serviceRequest
    });
  });

  /**
   * Complete service
   */
  completeService = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const { requestId } = req.params;
    const { completionNotes, completionImages } = req.body;

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Check if provider is assigned to this request
    const provider = await ServiceProvider.findOne({ userId: req.user.id });
    if (!provider || serviceRequest.providerId?.toString() !== provider._id.toString()) {
      throw new AuthorizationError('You are not assigned to this service request');
    }

    if (serviceRequest.status !== 'in_progress') {
      throw new ValidationError('Service request must be in progress to complete');
    }

    // Complete the service
    await serviceRequest.completeService({
      completionNotes,
      completionImages: completionImages || [],
      customerApproval: false // Customer needs to approve
    });

    // Update provider's completed jobs count
    provider.completedJobs += 1;
    await provider.save();

    res.status(200).json({
      success: true,
      message: 'Service completed successfully. Waiting for customer approval.',
      data: serviceRequest
    });
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

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Check if user owns this request
    if (serviceRequest.userId.toString() !== req.user.id) {
      throw new AuthorizationError('You can only approve your own service requests');
    }

    if (serviceRequest.status !== 'completed') {
      throw new ValidationError('Service request is not marked as completed');
    }

    // Approve completion
    serviceRequest.completion.customerApproval = true;
    serviceRequest.payment.status = 'paid';
    serviceRequest.payment.paidAt = new Date();
    await serviceRequest.save();

    res.status(200).json({
      success: true,
      message: 'Service completion approved successfully',
      data: serviceRequest
    });
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
    const { reason } = req.body;

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Check permissions
    const isOwner = serviceRequest.userId.toString() === req.user.id;
    let isProvider = false;
    
    if (req.user.role === 'provider' && serviceRequest.providerId) {
      const provider = await ServiceProvider.findOne({ userId: req.user.id });
      isProvider = provider && serviceRequest.providerId.toString() === provider._id.toString();
    }

    if (!isOwner && !isProvider) {
      throw new AuthorizationError('You can only cancel your own service requests or assigned services');
    }

    if (serviceRequest.status === 'completed') {
      throw new ValidationError('Cannot cancel a completed service request');
    }

    // Cancel the service
    await serviceRequest.cancelService(req.user.id, reason);

    res.status(200).json({
      success: true,
      message: 'Service request cancelled successfully',
      data: serviceRequest
    });
  });

  /**
   * Get service requests with filters
   */
  getRequests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { 
      status, 
      category, 
      location, 
      radius = 10,
      minBudget,
      maxBudget,
      page = 1, 
      limit = 10,
      sort = 'createdAt'
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const filter: any = {};

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Budget filter
    if (minBudget || maxBudget) {
      filter['budget.min'] = {};
      if (minBudget) filter['budget.min'].$gte = parseFloat(minBudget as string);
      if (maxBudget) filter['budget.max'] = { $lte: parseFloat(maxBudget as string) };
    }

    let query = ServiceRequest.find(filter)
      .populate('userId', 'firstName lastName profileImage')
      .populate('providerId', 'businessName rating');

    // Location-based search
    if (location) {
      const [lat, lng] = (location as string).split(',').map(Number);
      query = query.where('location').near({
        center: [lng, lat],
        maxDistance: parseInt(radius as string) * 1000 // Convert km to meters
      });
    }

    // Sorting
    const sortOptions: any = {};
    if (sort === 'createdAt') {
      sortOptions.createdAt = -1;
    } else if (sort === 'budget') {
      sortOptions['budget.max'] = -1;
    } else if (sort === 'priority') {
      sortOptions.priority = -1;
    }

    const serviceRequests = await query
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await ServiceRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Service requests retrieved successfully',
      data: serviceRequests,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalItems: total,
        hasNext: parseInt(page as string) * parseInt(limit as string) < total,
        hasPrev: parseInt(page as string) > 1
      }
    });
  });

  /**
   * Get service request statistics
   */
  getStatistics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const [
      totalRequests,
      pendingRequests,
      activeRequests,
      completedRequests,
      cancelledRequests,
      averageBudget
    ] = await Promise.all([
      ServiceRequest.countDocuments(),
      ServiceRequest.countDocuments({ status: 'pending' }),
      ServiceRequest.countDocuments({ status: { $in: ['accepted', 'in_progress'] } }),
      ServiceRequest.countDocuments({ status: 'completed' }),
      ServiceRequest.countDocuments({ status: 'cancelled' }),
      ServiceRequest.aggregate([
        { $group: { _id: null, avgBudget: { $avg: '$budget.max' } } }
      ])
    ]);

    const stats = {
      totalRequests,
      pendingRequests,
      activeRequests,
      completedRequests,
      cancelledRequests,
      averageBudget: averageBudget[0]?.avgBudget || 0
    };

    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats
    });
  });
}
