import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { User } from '../../models/User';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { IProviderService, IUserService } from '../../interfaces/services';
import {
  UpdateProviderDto,
  ProviderFiltersDto,
  PortfolioItemDto,
  ApiResponseDto,
  PaginatedResponseDto
} from '../../dtos';

export class ProviderService implements IProviderService {
  constructor(private userService: IUserService) {}

  /**
   * Get provider by ID
   */
  async getProviderById(providerId: string): Promise<any> {
    const provider = await ServiceProvider.findById(providerId)
      .populate('userId', 'firstName lastName email phone profileImage');
    
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    
    return provider;
  }

  /**
   * Get provider by user ID
   */
  async getProviderByUserId(userId: string): Promise<any> {
    const provider = await ServiceProvider.findOne({ userId })
      .populate('userId', 'firstName lastName email phone profileImage');
    
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    
    return provider;
  }

  /**
   * Update provider profile
   */
  async updateProviderProfile(providerId: string, updateData: UpdateProviderDto): Promise<ApiResponseDto> {
    const provider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email phone profileImage');

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    return {
      success: true,
      message: 'Provider profile updated successfully',
      data: provider
    };
  }

  /**
   * Search providers with filters
   */
  async searchProviders(filters: ProviderFiltersDto): Promise<PaginatedResponseDto<any>> {
    const { 
      services, 
      location, 
      radius = 10000, // 10km default
      minRating, 
      isVerified, 
      isAvailable, 
      page = 1, 
      limit = 10,
      sort = 'rating'
    } = filters;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (services && services.length > 0) {
      filter.services = { $in: services };
    }

    if (location) {
      filter.serviceArea = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location
          },
          $maxDistance: radius
        }
      };
    }

    if (typeof minRating === 'number') {
      filter.rating = { $gte: minRating };
    }

    if (typeof isVerified === 'boolean') {
      filter.isVerified = isVerified;
    }

    if (typeof isAvailable === 'boolean') {
      filter.isAvailable = isAvailable;
    }

    let sortOption: any = { createdAt: -1 };
    switch (sort) {
      case 'rating':
        sortOption = { rating: -1, completedJobs: -1 };
        break;
      case 'completedJobs':
        sortOption = { completedJobs: -1, rating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
    }

    const providers = await ServiceProvider.find(filter)
      .populate('userId', 'firstName lastName profileImage')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await ServiceProvider.countDocuments(filter);

    return {
      data: providers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Add portfolio item
   */
  async addPortfolioItem(providerId: string, portfolioItem: PortfolioItemDto): Promise<ApiResponseDto> {
    const provider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      { $push: { portfolio: portfolioItem } },
      { new: true }
    );

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    return {
      success: true,
      message: 'Portfolio item added successfully',
      data: portfolioItem
    };
  }

  /**
   * Update portfolio item
   */
  async updatePortfolioItem(
    providerId: string, 
    itemId: string, 
    updateData: Partial<PortfolioItemDto>
  ): Promise<ApiResponseDto> {
    const provider = await ServiceProvider.findOneAndUpdate(
      { _id: providerId, 'portfolio._id': itemId },
      { $set: { 'portfolio.$': { ...updateData, _id: itemId } } },
      { new: true }
    );

    if (!provider) {
      throw new NotFoundError('Provider or portfolio item not found');
    }

    return {
      success: true,
      message: 'Portfolio item updated successfully'
    };
  }

  /**
   * Delete portfolio item
   */
  async deletePortfolioItem(providerId: string, itemId: string): Promise<ApiResponseDto> {
    const provider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      { $pull: { portfolio: { _id: itemId } } },
      { new: true }
    );

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    return {
      success: true,
      message: 'Portfolio item deleted successfully'
    };
  }

  /**
   * Get provider portfolio
   */
  async getProviderPortfolio(providerId: string): Promise<PortfolioItemDto[]> {
    const provider = await ServiceProvider.findById(providerId).select('portfolio');
    
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    
    return provider.portfolio || [];
  }

  /**
   * Update provider availability
   */
  async updateProviderAvailability(providerId: string, availability: any): Promise<ApiResponseDto> {
    const provider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      { availability },
      { new: true }
    );

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    return {
      success: true,
      message: 'Provider availability updated successfully',
      data: { availability }
    };
  }

  /**
   * Get provider statistics
   */
  async getProviderStatistics(providerId: string): Promise<any> {
    const [
      totalRequests,
      pendingRequests,
      activeRequests,
      completedRequests,
      totalReviews,
      averageRating
    ] = await Promise.all([
      ServiceRequest.countDocuments({ providerId }),
      ServiceRequest.countDocuments({ providerId, status: 'pending' }),
      ServiceRequest.countDocuments({ 
        providerId, 
        status: { $in: ['accepted', 'in_progress'] } 
      }),
      ServiceRequest.countDocuments({ providerId, status: 'completed' }),
      Review.countDocuments({ providerId }),
      Review.aggregate([
        { $match: { providerId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    return {
      totalRequests,
      pendingRequests,
      activeRequests,
      completedRequests,
      totalReviews,
      averageRating: averageRating[0]?.avgRating || 0
    };
  }

  /**
   * Verify provider
   */
  async verifyProvider(providerId: string): Promise<ApiResponseDto> {
    const provider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      { isVerified: true },
      { new: true }
    );

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    return {
      success: true,
      message: 'Provider verified successfully'
    };
  }

  /**
   * Get provider reviews
   */
  async getProviderReviews(
    providerId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ providerId })
      .populate('userId', 'firstName lastName profileImage')
      .populate('serviceRequestId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ providerId });

    return {
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get provider service requests
   */
  async getProviderServiceRequests(
    providerId: string, 
    status?: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;
    const filter: any = { providerId };
    
    if (status) {
      filter.status = status;
    }

    const serviceRequests = await ServiceRequest.find(filter)
      .populate('userId', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ServiceRequest.countDocuments(filter);

    return {
      data: serviceRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Update provider rating
   */
  async updateProviderRating(providerId: string): Promise<void> {
    const ratingStats = await Review.aggregate([
      { $match: { providerId } },
      { 
        $group: { 
          _id: null, 
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        } 
      }
    ]);

    if (ratingStats.length > 0) {
      await ServiceProvider.findByIdAndUpdate(providerId, {
        rating: Math.round(ratingStats[0].avgRating * 10) / 10,
        totalReviews: ratingStats[0].totalReviews
      });
    }
  }

  /**
   * Update provider status (admin function)
   */
  async updateProviderStatus(providerId: string, status: string): Promise<ApiResponseDto> {
    const validStatuses = ['active', 'inactive', 'suspended', 'banned'];
    
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const provider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    return {
      success: true,
      message: `Provider status updated to ${status}`,
      data: provider
    };
  }

  /**
   * Delete provider (admin function)
   */
  async deleteProvider(providerId: string): Promise<ApiResponseDto> {
    const provider = await ServiceProvider.findByIdAndDelete(providerId);

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    // Clean up related data
    await Promise.all([
      ServiceRequest.deleteMany({ providerId }),
      Review.deleteMany({ providerId })
    ]);

    return {
      success: true,
      message: 'Provider deleted successfully'
    };
  }

  /**
   * Get all providers (admin function)
   */
  async getAllProviders(filters: ProviderFiltersDto): Promise<PaginatedResponseDto<any>> {
    const { 
      page = 1, 
      limit = 10, 
      isVerified, 
      status,
      category,
      rating,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (typeof isVerified === 'boolean') {
      filter.isVerified = isVerified;
    }

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.services = { $in: [category] };
    }

    if (rating) {
      filter.rating = { $gte: rating };
    }

    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOption: any = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const providers = await ServiceProvider.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await ServiceProvider.countDocuments(filter);

    return {
      data: providers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
}
