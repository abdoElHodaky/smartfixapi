import { Request, Response, NextFunction } from 'express';
import { User } from '../../../models/User';

/**
 * Middleware to authorize admin access
 */
export const authorizeAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const user = await User.findById(userId);
    
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authorization error' });
  }
};

/**
 * Middleware to authorize provider access
 */
export const authorizeProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const user = await User.findById(userId);
    
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.role !== 'provider' && user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Provider access required' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authorization error' });
  }
};

/**
 * Middleware to authorize user access (authenticated users)
 */
export const authorizeUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const user = await User.findById(userId);
    
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: 'Account is not active' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authorization error' });
  }
};

/**
 * Middleware to check if user owns the resource or is admin
 */
export const authorizeOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = (req as any).user?.userId;
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (!currentUserId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const user = await User.findById(currentUserId);
      
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      // Allow if user is admin or owns the resource
      if (user.role === 'admin' || currentUserId === resourceUserId) {
        next();
        return;
      }

      res.status(403).json({ success: false, message: 'Access denied' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Authorization error' });
    }
  };
};
