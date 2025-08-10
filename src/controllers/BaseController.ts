import { Request, Response } from 'express';
import { serviceRegistry } from '../container';
import { IAuthService, IUserService, IProviderService, IServiceRequestService, IReviewService } from '../interfaces/services';

/**
 * Base controller that provides access to all services via dependency injection
 */
export abstract class BaseController {
  protected authService: IAuthService;
  protected userService: IUserService;
  protected providerService: IProviderService;
  protected serviceRequestService: IServiceRequestService;
  protected reviewService: IReviewService;

  constructor() {
    // Resolve services from DI container
    this.authService = serviceRegistry.getService<IAuthService>('AuthService');
    this.userService = serviceRegistry.getService<IUserService>('UserService');
    this.providerService = serviceRegistry.getService<IProviderService>('ProviderService');
    this.serviceRequestService = serviceRegistry.getService<IServiceRequestService>('ServiceRequestService');
    this.reviewService = serviceRegistry.getService<IReviewService>('ReviewService');
  }

  /**
   * Send success response
   */
  protected sendSuccess(res: Response, data: any, message: string = 'Success', statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Send error response
   */
  protected sendError(res: Response, message: string, statusCode: number = 400, error?: any): void {
    res.status(statusCode).json({
      success: false,
      message,
      ...(error && { error })
    });
  }

  /**
   * Handle async controller methods
   */
  protected asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
    return (req: Request, res: Response) => {
      Promise.resolve(fn(req, res)).catch((error) => {
        console.error('Controller error:', error);
        this.sendError(res, 'Internal server error', 500, error.message);
      });
    };
  }

  /**
   * Get user ID from request (assumes auth middleware sets req.user)
   */
  protected getUserId(req: Request): string {
    const user = (req as any).user;
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }

  /**
   * Get pagination parameters from query
   */
  protected getPagination(req: Request): { page: number; limit: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    return { page, limit };
  }
}

