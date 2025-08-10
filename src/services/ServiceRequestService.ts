import { ServiceRequest } from '../models/ServiceRequest';
import { ServiceProvider } from '../models/ServiceProvider';
import { User } from '../models/User';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

export interface ServiceMatchCriteria {
  location: [number, number]; // [longitude, latitude]
  radius: number; // in kilometers
  services: string[];
  budget: {
    min: number;
    max: number;
  };
  scheduledDate: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export class ServiceRequestService {
  /**
   * Find matching service providers for a request
   */
  static async findMatchingProviders(
    serviceRequestId: string,
    criteria: ServiceMatchCriteria
  ): Promise<any[]> {
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Build query to find matching providers
    const matchQuery: any = {
      isVerified: true,
      isAvailable: true,
      services: { $in: criteria.services }
    };

    // Location-based matching
    const providers = await ServiceProvider.find(matchQuery)
      .where('serviceArea')
      .near({
        center: criteria.location,
        maxDistance: criteria.radius * 1000 // Convert km to meters
      })
      .populate('userId', 'firstName lastName profileImage phone')
      .sort({ 'rating.average': -1, completedJobs: -1 });

    // Filter providers based on additional criteria
    const matchingProviders = providers.filter(provider => {
      // Check if provider's service area covers the request location
      const distance = this.calculateDistance(
        criteria.location,
        provider.serviceArea.coordinates
      );
      
      if (distance > provider.serviceArea.radius) {
        return false;
      }

      // Check pricing compatibility (if provider has hourly rate)
      if (provider.pricing.hourlyRate) {
        const estimatedCost = provider.pricing.hourlyRate * (serviceRequest.estimatedDuration || 1);
        if (estimatedCost > criteria.budget.max) {
          return false;
        }
      }

      // Check availability for the scheduled date/time
      const dayOfWeek = criteria.scheduledDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const availability = provider.availability[dayOfWeek as keyof typeof provider.availability];
      
      if (!availability || !availability.available) {
        return false;
      }

      return true;
    });

    return matchingProviders;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
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
   * Auto-match service request with providers
   */
  static async autoMatchServiceRequest(serviceRequestId: string): Promise<any[]> {
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    const criteria: ServiceMatchCriteria = {
      location: serviceRequest.location.coordinates,
      radius: 25, // Default 25km radius
      services: [serviceRequest.serviceType],
      budget: serviceRequest.budget,
      scheduledDate: serviceRequest.scheduledDate,
      priority: serviceRequest.priority
    };

    return this.findMatchingProviders(serviceRequestId, criteria);
  }

  /**
   * Send notifications to matching providers
   */
  static async notifyMatchingProviders(
    serviceRequestId: string,
    providerIds: string[]
  ): Promise<void> {
    // In a real implementation, this would send push notifications, emails, or SMS
    // For now, we'll just log the notification
    console.log(`Notifying ${providerIds.length} providers about service request ${serviceRequestId}`);
    
    // You could implement:
    // - Push notifications via Firebase
    // - Email notifications via SendGrid/Mailgun
    // - SMS notifications via Twilio
    // - In-app notifications
  }

  /**
   * Calculate service request priority score
   */
  static calculatePriorityScore(serviceRequest: any): number {
    let score = 0;

    // Base score by priority level
    const priorityScores = {
      urgent: 100,
      high: 75,
      medium: 50,
      low: 25
    };
    score += priorityScores[serviceRequest.priority as keyof typeof priorityScores] || 50;

    // Increase score based on budget
    score += Math.min(serviceRequest.budget.max / 100, 50);

    // Increase score for sooner scheduled dates
    const daysUntilService = Math.ceil(
      (serviceRequest.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilService <= 1) score += 30;
    else if (daysUntilService <= 3) score += 20;
    else if (daysUntilService <= 7) score += 10;

    return Math.min(score, 200); // Cap at 200
  }

  /**
   * Get service request recommendations for a provider
   */
  static async getRecommendationsForProvider(
    providerId: string,
    limit: number = 10
  ): Promise<any[]> {
    const provider = await ServiceProvider.findById(providerId);
    if (!provider) {
      throw new NotFoundError('Service provider not found');
    }

    // Find service requests that match provider's services and location
    const matchingRequests = await ServiceRequest.find({
      status: 'pending',
      serviceType: { $in: provider.services },
      location: {
        $geoWithin: {
          $centerSphere: [
            provider.serviceArea.coordinates,
            provider.serviceArea.radius / 6371 // Convert km to radians
          ]
        }
      },
      // Exclude requests where provider already submitted a proposal
      'proposals.providerId': { $ne: provider._id }
    })
    .populate('userId', 'firstName lastName profileImage')
    .sort({ createdAt: -1 })
    .limit(limit);

    // Calculate priority scores and sort
    const requestsWithScores = matchingRequests.map(request => ({
      ...request.toJSON(),
      priorityScore: this.calculatePriorityScore(request),
      distance: this.calculateDistance(
        provider.serviceArea.coordinates,
        request.location.coordinates
      )
    }));

    return requestsWithScores.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Validate service request data
   */
  static validateServiceRequest(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!data.title || data.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters long');
    }

    if (!data.description || data.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if (!data.category || !data.serviceType) {
      errors.push('Category and service type are required');
    }

    if (!data.location || !data.location.coordinates || data.location.coordinates.length !== 2) {
      errors.push('Valid location coordinates are required');
    }

    if (!data.scheduledDate || new Date(data.scheduledDate) <= new Date()) {
      errors.push('Scheduled date must be in the future');
    }

    if (!data.budget || data.budget.min < 0 || data.budget.max < data.budget.min) {
      errors.push('Valid budget range is required');
    }

    if (!data.estimatedDuration || data.estimatedDuration < 0.5 || data.estimatedDuration > 24) {
      errors.push('Estimated duration must be between 0.5 and 24 hours');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get service request analytics
   */
  static async getServiceRequestAnalytics(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const [
      totalRequests,
      statusDistribution,
      categoryDistribution,
      averageBudget,
      completionRate
    ] = await Promise.all([
      ServiceRequest.countDocuments({ createdAt: { $gte: startDate } }),
      ServiceRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      ServiceRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      ServiceRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: null, avgBudget: { $avg: '$budget.max' } } }
      ]),
      ServiceRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
          }
        }
      ])
    ]);

    const completionRateData = completionRate[0] || { total: 0, completed: 0 };

    return {
      timeframe,
      totalRequests,
      statusDistribution,
      categoryDistribution,
      averageBudget: averageBudget[0]?.avgBudget || 0,
      completionRate: completionRateData.total > 0 
        ? (completionRateData.completed / completionRateData.total) * 100 
        : 0
    };
  }

  /**
   * Estimate service cost based on provider and request details
   */
  static estimateServiceCost(
    provider: any,
    serviceRequest: any
  ): { estimatedCost: number; breakdown: any } {
    let estimatedCost = 0;
    const breakdown: any = {};

    // Check if provider has fixed pricing for this service
    const fixedPrice = provider.pricing.fixedPrices?.find(
      (fp: any) => fp.service.toLowerCase() === serviceRequest.serviceType.toLowerCase()
    );

    if (fixedPrice) {
      estimatedCost = fixedPrice.price;
      breakdown.fixedPrice = fixedPrice.price;
    } else if (provider.pricing.hourlyRate) {
      const hourlyRate = provider.pricing.hourlyRate;
      const duration = serviceRequest.estimatedDuration || 1;
      estimatedCost = hourlyRate * duration;
      breakdown.hourlyRate = hourlyRate;
      breakdown.duration = duration;
      breakdown.subtotal = estimatedCost;
    }

    // Add potential additional costs (travel, materials, etc.)
    // This is a simplified calculation
    const distance = this.calculateDistance(
      provider.serviceArea.coordinates,
      serviceRequest.location.coordinates
    );

    if (distance > 10) {
      const travelCost = (distance - 10) * 2; // $2 per km beyond 10km
      estimatedCost += travelCost;
      breakdown.travelCost = travelCost;
    }

    return {
      estimatedCost: Math.round(estimatedCost * 100) / 100, // Round to 2 decimal places
      breakdown
    };
  }
}
