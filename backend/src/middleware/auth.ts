import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModels/user';
import { AuthRequest, ApiResponse, IUser } from '../types';

/**
 * Interface for JWT payload
 */
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Generate JWT token
 */
export const generateToken = (user: IUser): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d',
      issuer: 'vaxsync-api',
      audience: 'vaxsync-client'
    } as jwt.SignOptions
  );
};

/**
 * Generate refresh token (longer expiry)
 */
export const generateRefreshToken = (user: IUser): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  const payload = {
    userId: user._id.toString(),
    email: user.email,
    type: 'refresh'
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { 
      expiresIn: '30d',
      issuer: 'vaxsync-api',
      audience: 'vaxsync-client'
    } as jwt.SignOptions
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  return jwt.verify(token, process.env.JWT_SECRET!, {
    issuer: 'vaxsync-api',
    audience: 'vaxsync-client'
  }) as JWTPayload;
};

/**
 * Extract token from request headers
 */
const extractToken = (req: AuthRequest): string | null => {
  const authHeader = req.headers['authorization'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  
  // Also check for token in query params (for file downloads)
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }
  
  return null;
};

/**
 * Main authentication middleware
 * Validates JWT token and attaches user to request
 */
export const authenticateToken = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required. Please provide a valid authorization token.',
        code: 'TOKEN_MISSING'
      } as ApiResponse);
      return;
    }

    // Verify and decode token
    let decoded: JWTPayload;
    try {
      decoded = verifyToken(token);
    } catch (error: any) {
      let message = 'Invalid or expired token';
      let code = 'TOKEN_INVALID';
      
      if (error.name === 'TokenExpiredError') {
        message = 'Token has expired. Please log in again.';
        code = 'TOKEN_EXPIRED';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token format or signature.';
        code = 'TOKEN_MALFORMED';
      } else if (error.name === 'NotBeforeError') {
        message = 'Token not active yet.';
        code = 'TOKEN_NOT_ACTIVE';
      }

      res.status(403).json({
        success: false,
        message,
        code,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      } as ApiResponse);
      return;
    }

    // Find user in database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.',
        code: 'USER_NOT_FOUND'
      } as ApiResponse);
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      } as ApiResponse);
      return;
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error: any) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    } as ApiResponse);
  }
};

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Silently ignore token errors for optional auth
      console.warn('Optional auth token error:', error);
    }

    next();
  } catch (error: any) {
    console.error('Optional authentication error:', error);
    next(); // Continue without authentication
  }
};

/**
 * Validate user access to specific user resources
 * Checks if user can access another user's data
 */
export const validateUser = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID parameter is required',
        code: 'MISSING_USER_ID'
      } as ApiResponse);
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      } as ApiResponse);
      return;
    }

    // Check various authorization levels
    const isOwnData = req.user._id.toString() === userId;
    const isDependent = req.user.dependents.some(dep => dep.toString() === userId);
    const isGuardian = req.user.guardians.some(guard => guard.toString() === req.user!._id.toString());
    const isAdmin = req.user.role === 'admin';
    const isHealthcareProvider = req.user.role === 'healthcare_provider';

    if (!isOwnData && !isDependent && !isGuardian && !isAdmin && !isHealthcareProvider) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions to access this user\'s data.',
        code: 'INSUFFICIENT_PERMISSIONS'
      } as ApiResponse);
      return;
    }

    // For healthcare providers, add additional checks if needed
    if (isHealthcareProvider && !isOwnData && !isAdmin) {
      // Add logic to check if healthcare provider is authorized for this patient
      // This could involve checking appointment records, etc.
    }

    next();
  } catch (error: any) {
    console.error('User validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization validation failed',
      code: 'VALIDATION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    } as ApiResponse);
  }
};

/**
 * Require admin role
 */
export const requireAdmin = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      } as ApiResponse);
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      } as ApiResponse);
      return;
    }

    next();
  } catch (error: any) {
    console.error('Admin authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR'
    } as ApiResponse);
  }
};

/**
 * Require healthcare provider role or admin
 */
export const requireHealthcareProvider = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      } as ApiResponse);
      return;
    }

    if (req.user.role !== 'healthcare_provider' && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Healthcare provider access required',
        code: 'HEALTHCARE_PROVIDER_REQUIRED'
      } as ApiResponse);
      return;
    }

    next();
  } catch (error: any) {
    console.error('Healthcare provider authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR'
    } as ApiResponse);
  }
};

/**
 * Require parent role (for managing dependents)
 */
export const requireParent = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      } as ApiResponse);
      return;
    }

    if (req.user.role !== 'parent' && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Parent access required',
        code: 'PARENT_REQUIRED'
      } as ApiResponse);
      return;
    }

    next();
  } catch (error: any) {
    console.error('Parent authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR'
    } as ApiResponse);
  }
};

/**
 * Check if user can manage dependents
 */
export const validateDependentAccess = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { dependentId } = req.params;
    
    if (!dependentId) {
      res.status(400).json({
        success: false,
        message: 'Dependent ID parameter is required',
        code: 'MISSING_DEPENDENT_ID'
      } as ApiResponse);
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      } as ApiResponse);
      return;
    }

    // Check if user is authorized to manage this dependent
    const isDependent = req.user.dependents.some(dep => dep.toString() === dependentId);
    const isAdmin = req.user.role === 'admin';

    if (!isDependent && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to manage this dependent.',
        code: 'DEPENDENT_ACCESS_DENIED'
      } as ApiResponse);
      return;
    }

    next();
  } catch (error: any) {
    console.error('Dependent access validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Dependent access validation failed',
      code: 'VALIDATION_ERROR'
    } as ApiResponse);
  }
};

/**
 * Rate limiting per user (prevents abuse by authenticated users)
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next();
      return;
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const userRequests = userRequestCounts.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      // Reset or initialize counter
      userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (userRequests.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000} seconds.`,
        code: 'USER_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      } as ApiResponse);
      return;
    }

    // Increment counter
    userRequests.count++;
    next();
  };
};

/**
 * Validate API key (for external integrations)
 */
export const validateApiKey = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        message: 'API key required',
        code: 'API_KEY_MISSING'
      } as ApiResponse);
      return;
    }

    // Validate API key against your database or environment
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
      res.status(401).json({
        success: false,
        message: 'Invalid API key',
        code: 'INVALID_API_KEY'
      } as ApiResponse);
      return;
    }

    next();
  } catch (error: any) {
    console.error('API key validation error:', error);
    res.status(500).json({
      success: false,
      message: 'API key validation failed',
      code: 'API_KEY_VALIDATION_ERROR'
    } as ApiResponse);
  }
};

/**
 * Middleware to log authentication events
 */
export const logAuthEvents = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Log authentication failures
    if (!data.success && (
      data.code === 'TOKEN_EXPIRED' || 
      data.code === 'TOKEN_INVALID' || 
      data.code === 'AUTH_REQUIRED'
    )) {
      console.warn('Authentication event:', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        error: data.code,
        timestamp: new Date().toISOString()
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Refresh token validation
 */
export const validateRefreshToken = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token required',
        code: 'REFRESH_TOKEN_MISSING'
      } as ApiResponse);
      return;
    }

    try {
      const decoded = verifyToken(refreshToken) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token or user not found',
          code: 'INVALID_REFRESH_TOKEN'
        } as ApiResponse);
        return;
      }

      req.user = user;
      next();

    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        code: 'REFRESH_TOKEN_INVALID',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      } as ApiResponse);
    }

  } catch (error: any) {
    console.error('Refresh token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Refresh token validation failed',
      code: 'REFRESH_TOKEN_VALIDATION_ERROR'
    } as ApiResponse);
  }
};

// Export all middleware functions
export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  authenticateToken,
  optionalAuth,
  validateUser,
  requireAdmin,
  requireHealthcareProvider,
  requireParent,
  validateDependentAccess,
  userRateLimit,
  validateApiKey,
  logAuthEvents,
  validateRefreshToken
};