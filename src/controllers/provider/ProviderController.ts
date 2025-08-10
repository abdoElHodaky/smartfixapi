import { Response } from 'express';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { User } from '../../models/User';
import { ProviderService } from '../../services/provider/ProviderService';
import { AuthRequest } from '../../types';
import { asyncHandler, NotFoundError, ValidationError, AuthorizationError } from '../../middleware/errorHandler';

export class ProviderController {
  /**
   * Get provider profile
   */
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const provider = await ServiceProvider.findOne({ userId: req.user.id })
      .populate('userId', '-password');

    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    res.status(200).json({
      success: true,
      message: 'Provider profile retrieved successfully',
      data: provider
    });
  });

  /**
   * Update provider profile
   */
  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const allowedUpdates = [
      'businessName', 'description', 'services', 'serviceArea', 
      'pricing', 'availability', 'isAvailable'
    ];
    
    const updates: any = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const provider = await ServiceProvider.findOneAndUpdate(
      { userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    ).populate('userId', '-password');

    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    res.status(200).json({
      success: true,
      message: 'Provider profile updated successfully',
      data: provider
    });
  });

  /**
   * Get provider's service requests
   */
  static getServiceRequests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const provider = await ServiceProvider.findOne({ userId: req.user.id });
    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const filter: any = { providerId: provider._id };
    if (status) {
      filter.status = status;
    }

    const serviceRequests = await ServiceRequest.find(filter)
      .populate('userId', 'firstName lastName profileImage phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ServiceRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Service requests retrieved successfully',
      data: serviceRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  });

  /**
   * Get available service requests (for providers to browse)
   */
  static getAvailableRequests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const provider = await ServiceProvider.findOne({ userId: req.user.id });
    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const skip = (page - 1) * limit;

    // Build filter for available requests
    const filter: any = {
      status: 'pending',
      providerId: null // Not yet assigned to a provider
    };

    if (category) {
      filter.category = category;
    }

    // Filter by service area (requests within provider's service radius)
    const geoFilter = {
      location: {
        $geoWithin: {
          $centerSphere: [
            provider.serviceArea.coordinates,
            provider.serviceArea.radius / 6371 // Convert km to radians
          ]
        }
      }
    };

    const serviceRequests = await ServiceRequest.find({ ...filter, ...geoFilter })
      .populate('userId', 'firstName lastName profileImage')
      .sort({ createdAt: -1, priority: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ServiceRequest.countDocuments({ ...filter, ...geoFilter });

    res.status(200).json({
      success: true,
      message: 'Available service requests retrieved successfully',
      data: serviceRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  });

  /**
   * Submit proposal for a service request
   */
  static submitProposal = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const { requestId } = req.params;
    const { message, quotedPrice, estimatedDuration, proposedDate } = req.body;

    const provider = await ServiceProvider.findOne({ userId: req.user.id });
    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    if (serviceRequest.status !== 'pending') {
      throw new ValidationError('This service request is no longer available');
    }

    // Check if provider already submitted a proposal
    const existingProposal = serviceRequest.proposals.find(
      (p: any) => p.providerId.toString() === provider._id.toString()
    );

    if (existingProposal) {
      throw new ValidationError('You have already submitted a proposal for this request');
    }

    const proposal = {
      providerId: provider._id,
      message,
      quotedPrice,
      estimatedDuration,
      proposedDate: new Date(proposedDate),
      status: 'pending',
      submittedAt: new Date()
    };

    serviceRequest.proposals.push(proposal);
    await serviceRequest.save();

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully',
      data: proposal
    });
  });

  /**
   * Get provider dashboard data
   */
  static getDashboard = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const provider = await ServiceProvider.findOne({ userId: req.user.id });
    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    // Get counts for different service request statuses
    const [
      totalJobs,
      activeJobs,
      completedJobs,
      pendingProposals,
      totalReviews,
      averageRating
    ] = await Promise.all([
      ServiceRequest.countDocuments({ providerId: provider._id }),
      ServiceRequest.countDocuments({ 
        providerId: provider._id, 
        status: { $in: ['accepted', 'in_progress'] } 
      }),
      ServiceRequest.countDocuments({ providerId: provider._id, status: 'completed' }),
      ServiceRequest.countDocuments({ 
        'proposals.providerId': provider._id,
        'proposals.status': 'pending'
      }),
      Review.countDocuments({ providerId: provider._id }),
      Review.getProviderAverageRating(provider._id.toString())
    ]);

    // Get recent jobs
    const recentJobs = await ServiceRequest.find({ providerId: provider._id })
      .populate('userId', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent reviews
    const recentReviews = await Review.find({ providerId: provider._id })
      .populate('userId', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .limit(3);

    const dashboardData = {
      stats: {
        totalJobs,
        activeJobs,
        completedJobs,
        pendingProposals,
        totalReviews,
        averageRating: averageRating.averageRating,
        isVerified: provider.isVerified,
        isAvailable: provider.isAvailable
      },
      recentJobs,
      recentReviews,
      provider: {
        businessName: provider.businessName,
        rating: provider.rating,
        completedJobs: provider.completedJobs
      }
    };

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboardData
    });
  });

  /**
   * Update availability status
   */
  static updateAvailability = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const { isAvailable } = req.body;

    const provider = await ServiceProvider.findOneAndUpdate(
      { userId: req.user.id },
      { isAvailable, lastActiveDate: new Date() },
      { new: true }
    );

    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    res.status(200).json({
      success: true,
      message: `Availability updated to ${isAvailable ? 'available' : 'unavailable'}`,
      data: { isAvailable: provider.isAvailable }
    });
  });

  /**
   * Add portfolio item
   */
  static addPortfolioItem = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== 'provider') {
      throw new AuthorizationError('Provider access required');
    }

    const { title, description, images, completedDate } = req.body;

    const provider = await ServiceProvider.findOne({ userId: req.user.id });
    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    const portfolioItem = {
      title,
      description,
      images: images || [],
      completedDate: new Date(completedDate)
    };

    provider.portfolio.push(portfolioItem);
    await provider.save();

    res.status(201).json({
      success: true,
      message: 'Portfolio item added successfully',
      data: portfolioItem
    });
  });

  /**
   * Get provider by ID (public view)
   */
  static getProviderById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { providerId } = req.params;

    const provider = await ServiceProvider.findById(providerId)
      .populate('userId', 'firstName lastName profileImage createdAt');

    if (!provider) {
      throw new NotFoundError('Service provider not found');
    }

    // Get provider's reviews and rating
    const [reviews, ratingData] = await Promise.all([
      Review.getRecentReviews(providerId, 10),
      Review.getProviderAverageRating(providerId)
    ]);

    const providerData = {
      ...provider.toJSON(),
      reviews,
      ratingData
    };

    res.status(200).json({
      success: true,
      message: 'Provider profile retrieved successfully',
      data: providerData
    });
  });

  /**
   * Search providers
   */
  static searchProviders = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { 
      q, 
      services, 
      location, 
      radius = 10, 
      minRating, 
      isVerified,
      page = 1, 
      limit = 10,
      sort = 'rating'
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const filter: any = { isAvailable: true };

    // Text search
    if (q) {
      filter.$or = [
        { businessName: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { services: { $in: [new RegExp(q as string, 'i')] } }
      ];
    }

    // Service filter
    if (services) {
      const serviceArray = (services as string).split(',');
      filter.services = { $in: serviceArray };
    }

    // Rating filter
    if (minRating) {
      filter['rating.average'] = { $gte: parseFloat(minRating as string) };
    }

    // Verification filter
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }

    let query = ServiceProvider.find(filter)
      .populate('userId', 'firstName lastName profileImage');

    // Location-based search
    if (location) {
      const [lat, lng] = (location as string).split(',').map(Number);
      query = query.where('serviceArea').near({
        center: [lng, lat],
        maxDistance: parseInt(radius as string) * 1000 // Convert km to meters
      });
    }

    // Sorting
    const sortOptions: any = {};
    if (sort === 'rating') {
      sortOptions['rating.average'] = -1;
    } else if (sort === 'completedJobs') {
      sortOptions.completedJobs = -1;
    } else if (sort === 'newest') {
      sortOptions.createdAt = -1;
    }

    const providers = await query
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await ServiceProvider.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Providers retrieved successfully',
      data: providers,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalItems: total,
        hasNext: parseInt(page as string) * parseInt(limit as string) < total,
        hasPrev: parseInt(page as string) > 1
      }
    });
  });
}
