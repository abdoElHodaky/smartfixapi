import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { User } from '../../models/User';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';

export interface ProviderUpdateData {
  businessName?: string;
  description?: string;
  services?: string[];
  serviceArea?: {
    type: 'Point';
    coordinates: [number, number];
    radius: number;
  };
  pricing?: {
    hourlyRate?: number;
    fixedPrices?: Array<{
      service: string;
      price: number;
    }>;
  };
  availability?: {
    [key: string]: {
      available: boolean;
      startTime?: string;
      endTime?: string;
    };
  };
  isAvailable?: boolean;
}

export interface ProviderSearchFilters {
  services?: string[];
  location?: [number, number];
  radius?: number;
  minRating?: number;
  isVerified?: boolean;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
  sort?: 'rating' | 'completedJobs' | 'newest';
}

export interface PortfolioItem {
  title: string;
  description: string;
  images?: string[];
  completedDate: Date;
}

export class ProviderService {
  /**
   * Get provider by ID
   */
  static async getProviderById(providerId: string): Promise<any> {
    const provider = await ServiceProvider.findById(providerId)
      .populate('userId', 'firstName lastName profileImage createdAt');

    if (!provider) {
      throw new NotFoundError('Service provider not found');
    }

    return provider;
  }

  /**
   * Get provider by user ID
   */
  static async getProviderByUserId(userId: string): Promise<any> {
    const provider = await ServiceProvider.findOne({ userId })
      .populate('userId', '-password');

    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    return provider;
  }

  /**
   * Update provider profile
   */
  static async updateProviderProfile(userId: string, updateData: ProviderUpdateData): Promise<any> {
    const provider = await ServiceProvider.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', '-password');

    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    return provider;
  }

  /**
   * Get provider dashboard data
   */
  static async getProviderDashboard(userId: string): Promise<any> {
    const provider = await ServiceProvider.findOne({ userId });
    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

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

    return {
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
  }

  /**
   * Search providers with filters
   */
  static async searchProviders(filters: ProviderSearchFilters): Promise<any> {
    const { 
      services, 
      location, 
      radius = 10, 
      minRating, 
      isVerified,
      isAvailable,
      page = 1, 
      limit = 10,
      sort = 'rating'
    } = filters;

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Service filter
    if (services && services.length > 0) {
      filter.services = { $in: services };
    }

    // Rating filter
    if (minRating) {
      filter['rating.average'] = { $gte: minRating };
    }

    // Verification filter
    if (isVerified !== undefined) {
      filter.isVerified = isVerified;
    }

    // Availability filter
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable;
    }

    let query = ServiceProvider.find(filter)
      .populate('userId', 'firstName lastName profileImage');

    // Location-based search
    if (location) {
      const [lat, lng] = location;
      query = query.where('serviceArea').near({
        center: [lng, lat],
        maxDistance: radius * 1000 // Convert km to meters
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
      .limit(limit);

    const total = await ServiceProvider.countDocuments(filter);

    return {
      providers,
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
   * Update provider availability
   */
  static async updateAvailability(userId: string, isAvailable: boolean): Promise<any> {
    const provider = await ServiceProvider.findOneAndUpdate(
      { userId },
      { isAvailable, lastActiveDate: new Date() },
      { new: true }
    );

    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    return provider;
  }

  /**
   * Add portfolio item
   */
  static async addPortfolioItem(userId: string, portfolioItem: PortfolioItem): Promise<any> {
    const provider = await ServiceProvider.findOne({ userId });
    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    provider.portfolio.push(portfolioItem);
    await provider.save();

    return portfolioItem;
  }

  /**
   * Remove portfolio item
   */
  static async removePortfolioItem(userId: string, portfolioItemId: string): Promise<void> {
    const provider = await ServiceProvider.findOne({ userId });
    if (!provider) {
      throw new NotFoundError('Service provider profile not found');
    }

    provider.portfolio = provider.portfolio.filter(
      (item: any) => item._id.toString() !== portfolioItemId
    );
    await provider.save();
  }

  /**
   * Verify provider
   */
  static async verifyProvider(providerId: string, isVerified: boolean): Promise<any> {
    const provider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      { isVerified },
      { new: true }
    ).populate('userId', 'firstName lastName email');

    if (!provider) {
      throw new NotFoundError('Service provider not found');
    }

    return provider;
  }

  /**
   * Get provider statistics
   */
  static async getProviderStatistics(): Promise<any> {
    const [
      totalProviders,
      verifiedProviders,
      availableProviders,
      providersByService
    ] = await Promise.all([
      ServiceProvider.countDocuments(),
      ServiceProvider.countDocuments({ isVerified: true }),
      ServiceProvider.countDocuments({ isAvailable: true }),
      ServiceProvider.aggregate([
        { $unwind: '$services' },
        { $group: { _id: '$services', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      totalProviders,
      verifiedProviders,
      availableProviders,
      providersByService
    };
  }

  /**
   * Get providers near location
   */
  static async getProvidersNearLocation(
    coordinates: [number, number], 
    radius: number = 25,
    services?: string[]
  ): Promise<any[]> {
    const [lng, lat] = coordinates;
    const filter: any = {
      isVerified: true,
      isAvailable: true
    };

    if (services && services.length > 0) {
      filter.services = { $in: services };
    }

    const providers = await ServiceProvider.find(filter)
      .where('serviceArea')
      .near({
        center: [lng, lat],
        maxDistance: radius * 1000 // Convert km to meters
      })
      .populate('userId', 'firstName lastName profileImage')
      .sort({ 'rating.average': -1 })
      .limit(20);

    return providers;
  }

  /**
   * Calculate distance between two coordinates
   */
  static calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate provider data
   */
  static validateProviderData(providerData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!providerData.businessName || providerData.businessName.trim().length < 2) {
      errors.push('Business name must be at least 2 characters long');
    }

    if (!providerData.description || providerData.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if (!providerData.services || !Array.isArray(providerData.services) || providerData.services.length === 0) {
      errors.push('At least one service must be provided');
    }

    if (!providerData.serviceArea || !providerData.serviceArea.coordinates || 
        !Array.isArray(providerData.serviceArea.coordinates) || 
        providerData.serviceArea.coordinates.length !== 2) {
      errors.push('Valid service area coordinates are required');
    }

    if (providerData.serviceArea && providerData.serviceArea.radius) {
      if (providerData.serviceArea.radius < 1 || providerData.serviceArea.radius > 100) {
        errors.push('Service radius must be between 1 and 100 kilometers');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

