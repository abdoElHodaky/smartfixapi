import { ServiceRequest } from '../../models/ServiceRequest';
import { ServiceProvider } from '../../models/ServiceProvider';
import { User } from '../../models/User';
import { NotFoundError, ValidationError, AuthorizationError } from '../../middleware/errorHandler';
import { REQUEST_STATUS, SERVICE_CATEGORIES } from '../../config/constants';

export interface CreateRequestData {
  title: string;
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high';
  budget?: {
    min: number;
    max: number;
  };
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  preferredDate?: Date;
  images?: string[];
}

export interface UpdateRequestData {
  title?: string;
  description?: string;
  urgency?: 'low' | 'medium' | 'high';
  budget?: {
    min: number;
    max: number;
  };
  preferredDate?: Date;
  images?: string[];
}

export interface RequestSearchFilters {
  category?: string;
  urgency?: 'low' | 'medium' | 'high';
  status?: string;
  minBudget?: number;
  maxBudget?: number;
  location?: {
    coordinates: [number, number];
    radius: number; // in kilometers
  };
  search?: string;
  page?: number;
  limit?: number;
}

export class RequestService {
  /**
   * Create a new service request
   */
  async createRequest(userId: string, requestData: CreateRequestData): Promise<any> {
    try {
      // Validate category
      if (!SERVICE_CATEGORIES.includes(requestData.category)) {
        throw new ValidationError('Invalid service category');
      }

      // Create the request
      const request = new ServiceRequest({
        ...requestData,
        user: userId,
        status: REQUEST_STATUS.PENDING
      });

      await request.save();

      // Populate user data
      await request.populate('user', 'firstName lastName email phone');

      return {
        success: true,
        message: 'Service request created successfully',
        data: request
      };
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * Get request by ID
   */
  async getRequestById(requestId: string, userId?: string): Promise<any> {
    try {
      const request = await ServiceRequest.findById(requestId)
        .populate('user', 'firstName lastName email phone profileImage')
        .populate('assignedProvider', 'businessName email phone rating location services')
        .populate('quotes.provider', 'businessName email phone rating');

      if (!request) {
        throw new NotFoundError('Service request not found');
      }

      return {
        success: true,
        message: 'Request retrieved successfully',
        data: request
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Update service request
   */
  async updateRequest(requestId: string, userId: string, updateData: UpdateRequestData): Promise<any> {
    try {
      const request = await ServiceRequest.findById(requestId);

      if (!request) {
        throw new NotFoundError('Service request not found');
      }

      // Check if user owns the request
      if (request.user.toString() !== userId) {
        throw new AuthorizationError('You can only update your own requests');
      }

      // Check if request can be updated (only pending requests)
      if (request.status !== REQUEST_STATUS.PENDING) {
        throw new ValidationError('Only pending requests can be updated');
      }

      // Update the request
      Object.assign(request, updateData);
      await request.save();

      await request.populate('user', 'firstName lastName email phone');

      return {
        success: true,
        message: 'Request updated successfully',
        data: request
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Delete service request
   */
  async deleteRequest(requestId: string, userId: string): Promise<any> {
    try {
      const request = await ServiceRequest.findById(requestId);

      if (!request) {
        throw new NotFoundError('Service request not found');
      }

      // Check if user owns the request
      if (request.user.toString() !== userId) {
        throw new AuthorizationError('You can only delete your own requests');
      }

      // Check if request can be deleted (only pending requests)
      if (request.status !== REQUEST_STATUS.PENDING) {
        throw new ValidationError('Only pending requests can be deleted');
      }

      await ServiceRequest.findByIdAndDelete(requestId);

      return {
        success: true,
        message: 'Request deleted successfully'
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Search and filter requests
   */
  async searchRequests(filters: RequestSearchFilters): Promise<any> {
    try {
      const {
        category,
        urgency,
        status,
        minBudget,
        maxBudget,
        location,
        search,
        page = 1,
        limit = 10
      } = filters;

      const query: any = {};

      // Apply filters
      if (category) {
        query.category = category;
      }

      if (urgency) {
        query.urgency = urgency;
      }

      if (status) {
        query.status = status;
      }

      if (minBudget || maxBudget) {
        query['budget.min'] = {};
        if (minBudget) query['budget.min'].$gte = minBudget;
        if (maxBudget) query['budget.max'].$lte = maxBudget;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Location-based search
      if (location) {
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: location.coordinates
            },
            $maxDistance: location.radius * 1000 // Convert km to meters
          }
        };
      }

      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        ServiceRequest.find(query)
          .populate('user', 'firstName lastName profileImage')
          .populate('assignedProvider', 'businessName rating')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        ServiceRequest.countDocuments(query)
      ]);

      return {
        success: true,
        message: 'Requests retrieved successfully',
        data: {
          requests,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get user's requests
   */
  async getUserRequests(userId: string, page: number = 1, limit: number = 10): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        ServiceRequest.find({ user: userId })
          .populate('assignedProvider', 'businessName rating')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        ServiceRequest.countDocuments({ user: userId })
      ]);

      return {
        success: true,
        message: 'User requests retrieved successfully',
        data: {
          requests,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Add quote to request
   */
  async addQuote(requestId: string, providerId: string, quoteData: any): Promise<any> {
    try {
      const request = await ServiceRequest.findById(requestId);

      if (!request) {
        throw new NotFoundError('Service request not found');
      }

      // Check if request is still open for quotes
      if (request.status !== REQUEST_STATUS.PENDING) {
        throw new ValidationError('This request is no longer accepting quotes');
      }

      // Check if provider already submitted a quote
      const existingQuote = request.quotes.find(
        quote => quote.provider.toString() === providerId
      );

      if (existingQuote) {
        throw new ValidationError('You have already submitted a quote for this request');
      }

      // Add the quote
      request.quotes.push({
        provider: providerId,
        ...quoteData,
        submittedAt: new Date()
      });

      await request.save();

      await request.populate('quotes.provider', 'businessName rating');

      return {
        success: true,
        message: 'Quote submitted successfully',
        data: request
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Accept a quote
   */
  async acceptQuote(requestId: string, userId: string, quoteId: string): Promise<any> {
    try {
      const request = await ServiceRequest.findById(requestId);

      if (!request) {
        throw new NotFoundError('Service request not found');
      }

      // Check if user owns the request
      if (request.user.toString() !== userId) {
        throw new AuthorizationError('You can only accept quotes for your own requests');
      }

      // Find the quote
      const quote = request.quotes.id(quoteId);
      if (!quote) {
        throw new NotFoundError('Quote not found');
      }

      // Update request status and assign provider
      request.status = REQUEST_STATUS.ASSIGNED;
      request.assignedProvider = quote.provider;
      request.acceptedQuote = quote;

      await request.save();

      await request.populate('assignedProvider', 'businessName email phone');

      return {
        success: true,
        message: 'Quote accepted successfully',
        data: request
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Update request status
   */
  async updateRequestStatus(requestId: string, status: string, userId?: string): Promise<any> {
    try {
      const request = await ServiceRequest.findById(requestId);

      if (!request) {
        throw new NotFoundError('Service request not found');
      }

      // Validate status
      const validStatuses = Object.values(REQUEST_STATUS);
      if (!validStatuses.includes(status)) {
        throw new ValidationError('Invalid status');
      }

      request.status = status;
      
      if (status === REQUEST_STATUS.COMPLETED) {
        request.completedAt = new Date();
      }

      await request.save();

      return {
        success: true,
        message: 'Request status updated successfully',
        data: request
      };
    } catch (error: any) {
      throw error;
    }
  }
}
