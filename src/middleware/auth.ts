import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { ConditionalHelpers } from '../utils/conditions/ConditionalHelpers';

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Access token required',
        error: 'No token provided'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    
    // Fetch user from database to ensure they still exist and are active
    const user = await User.findById(decoded.id).select('-password');
    
    // Optimized: Use ConditionalHelpers for user validation
    const authError = ConditionalHelpers.guardAuthenticated(user);
    if (authError) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid token',
        error: authError
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ 
        success: false, 
        message: 'Invalid token',
        error: error.message
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Token verification failed',
        error: 'Internal server error'
      });
    }
  }
};

export const authorizeRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        error: 'No user found in request'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: 'Access denied',
        error: `Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.isActive) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      };
    }

    next();
  } catch (error) {
    // Token is invalid, but we continue without authentication
    next();
  }
};

export const requireEmailVerification = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
    return;
  }

  User.findById(req.user.id).then(user => {
    if (!user || !user.isEmailVerified) {
      res.status(403).json({ 
        success: false, 
        message: 'Email verification required',
        error: 'Please verify your email address to access this resource'
      });
      return;
    }
    next();
  }).catch(() => {
    res.status(500).json({ 
      success: false, 
      message: 'Verification check failed' 
    });
  });
};

export const requireProviderVerification = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'provider') {
    res.status(403).json({ 
      success: false, 
      message: 'Provider access required' 
    });
    return;
  }

  // Additional provider verification logic can be added here
  next();
};
