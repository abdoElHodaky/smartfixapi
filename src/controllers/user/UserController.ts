import { Response } from 'express';
import { User } from '../../models/User';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';
import { UserService } from '../../services/user/UserService';
import { AuthRequest, PaginationOptions } from '../../types';
import { asyncHandler, NotFoundError, ValidationError } from '../../middleware/errorHandler';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService = new UserService()) {
    this.userService = userService;
  }

  /**
   * Get user profile
   */
  getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    });
  });

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'profileImage', 
      'address', 'location'
    ];
    
    const updates: any = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  });

  /**
   * Upload profile image
   */
  uploadProfileImage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!req.file) {
      throw new ValidationError('No image file provided');
    }

    // In a real implementation, you would upload to cloud storage (AWS S3, Cloudinary, etc.)
    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: imageUrl,
        user
      }
    });
  });

  /**
   * Get user's service requests
   */
  getServiceRequests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const filter: any = { userId: req.user.id };
    if (status) {
      filter.status = status;
    }

    const serviceRequests = await ServiceRequest.find(filter)
      .populate('providerId', 'businessName rating')
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
   * Get user's reviews (reviews they've written)
   */
  getMyReviews = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ userId: req.user.id })
      .populate('providerId', 'businessName')
      .populate('serviceRequestId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ userId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: reviews,
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
   * Get user dashboard data
   */
  getDashboard = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Get counts for different service request statuses
    const [
      totalRequests,
      pendingRequests,
      activeRequests,
      completedRequests,
      totalReviews
    ] = await Promise.all([
      ServiceRequest.countDocuments({ userId: req.user.id }),
      ServiceRequest.countDocuments({ userId: req.user.id, status: 'pending' }),
      ServiceRequest.countDocuments({ 
        userId: req.user.id, 
        status: { $in: ['accepted', 'in_progress'] } 
      }),
      ServiceRequest.countDocuments({ userId: req.user.id, status: 'completed' }),
      Review.countDocuments({ userId: req.user.id })
    ]);

    // Get recent service requests
    const recentRequests = await ServiceRequest.find({ userId: req.user.id })
      .populate('providerId', 'businessName rating')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent reviews
    const recentReviews = await Review.find({ userId: req.user.id })
      .populate('providerId', 'businessName')
      .sort({ createdAt: -1 })
      .limit(3);

    const dashboardData = {
      stats: {
        totalRequests,
        pendingRequests,
        activeRequests,
        completedRequests,
        totalReviews
      },
      recentRequests,
      recentReviews
    };

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboardData
    });
  });

  /**
   * Update user location
   */
  updateLocation = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { coordinates, address } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new ValidationError('Valid coordinates [longitude, latitude] are required');
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        location: {
          type: 'Point',
          coordinates
        },
        'address.street': address?.street,
        'address.city': address?.city,
        'address.state': address?.state,
        'address.zipCode': address?.zipCode
      },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: user
    });
  });

  /**
   * Delete user account
   */
  deleteAccount = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // In a real implementation, you might want to:
    // 1. Cancel all pending service requests
    // 2. Archive user data instead of deleting
    // 3. Send confirmation email
    // 4. Handle related data cleanup

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  });

  /**
   * Get user by ID (for admin or public profile view)
   */
  getUserById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('firstName lastName profileImage location createdAt isEmailVerified')
      .where('isActive', true);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get user's public stats
    const [totalReviews, completedRequests] = await Promise.all([
      Review.countDocuments({ userId }),
      ServiceRequest.countDocuments({ userId, status: 'completed' })
    ]);

    const publicProfile = {
      ...user.toJSON(),
      stats: {
        totalReviews,
        completedRequests
      }
    };

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: publicProfile
    });
  });

  /**
   * Search users (for admin purposes)
   */
  searchUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    // This endpoint would typically be restricted to admin users
    const { q, role, isActive, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const filter: any = {};
    
    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
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
