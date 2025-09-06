"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRefreshToken = exports.logAuthEvents = exports.validateApiKey = exports.userRateLimit = exports.validateDependentAccess = exports.requireParent = exports.requireHealthcareProvider = exports.requireAdmin = exports.validateUser = exports.optionalAuth = exports.authenticateToken = exports.verifyToken = exports.generateRefreshToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../models/userModels/user"));
const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not defined');
    }
    const payload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
        issuer: 'vaxsync-api',
        audience: 'vaxsync-client'
    });
};
exports.generateToken = generateToken;
const generateRefreshToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not defined');
    }
    const payload = {
        userId: user._id.toString(),
        email: user.email,
        type: 'refresh'
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d',
        issuer: 'vaxsync-api',
        audience: 'vaxsync-client'
    });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyToken = (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not defined');
    }
    return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, {
        issuer: 'vaxsync-api',
        audience: 'vaxsync-client'
    });
};
exports.verifyToken = verifyToken;
const extractToken = (req) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    if (req.query.token && typeof req.query.token === 'string') {
        return req.query.token;
    }
    return null;
};
const authenticateToken = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required. Please provide a valid authorization token.',
                code: 'TOKEN_MISSING'
            });
            return;
        }
        let decoded;
        try {
            decoded = (0, exports.verifyToken)(token);
        }
        catch (error) {
            let message = 'Invalid or expired token';
            let code = 'TOKEN_INVALID';
            if (error.name === 'TokenExpiredError') {
                message = 'Token has expired. Please log in again.';
                code = 'TOKEN_EXPIRED';
            }
            else if (error.name === 'JsonWebTokenError') {
                message = 'Invalid token format or signature.';
                code = 'TOKEN_MALFORMED';
            }
            else if (error.name === 'NotBeforeError') {
                message = 'Token not active yet.';
                code = 'TOKEN_NOT_ACTIVE';
            }
            res.status(403).json({
                success: false,
                message,
                code,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
            return;
        }
        const user = await user_1.default.findById(decoded.userId).select('-password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found. Token may be invalid.',
                code: 'USER_NOT_FOUND'
            });
            return;
        }
        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Account has been deactivated. Please contact support.',
                code: 'ACCOUNT_DEACTIVATED'
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication service error',
            code: 'AUTH_SERVICE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            next();
            return;
        }
        try {
            const decoded = (0, exports.verifyToken)(token);
            const user = await user_1.default.findById(decoded.userId).select('-password');
            if (user && user.isActive) {
                req.user = user;
            }
        }
        catch (error) {
            console.warn('Optional auth token error:', error);
        }
        next();
    }
    catch (error) {
        console.error('Optional authentication error:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
const validateUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'User ID parameter is required',
                code: 'MISSING_USER_ID'
            });
            return;
        }
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
            return;
        }
        const isOwnData = req.user._id.toString() === userId;
        const isDependent = req.user.dependents.some(dep => dep.toString() === userId);
        const isGuardian = req.user.guardians.some(guard => guard.toString() === req.user._id.toString());
        const isAdmin = req.user.role === 'admin';
        const isHealthcareProvider = req.user.role === 'healthcare_provider';
        if (!isOwnData && !isDependent && !isGuardian && !isAdmin && !isHealthcareProvider) {
            res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions to access this user\'s data.',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
            return;
        }
        if (isHealthcareProvider && !isOwnData && !isAdmin) {
        }
        next();
    }
    catch (error) {
        console.error('User validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Authorization validation failed',
            code: 'VALIDATION_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
exports.validateUser = validateUser;
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
            return;
        }
        if (req.user.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Admin access required',
                code: 'ADMIN_REQUIRED'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Admin authorization error:', error);
        res.status(500).json({
            success: false,
            message: 'Authorization check failed',
            code: 'AUTH_CHECK_ERROR'
        });
    }
};
exports.requireAdmin = requireAdmin;
const requireHealthcareProvider = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
            return;
        }
        if (req.user.role !== 'healthcare_provider' && req.user.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Healthcare provider access required',
                code: 'HEALTHCARE_PROVIDER_REQUIRED'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Healthcare provider authorization error:', error);
        res.status(500).json({
            success: false,
            message: 'Authorization check failed',
            code: 'AUTH_CHECK_ERROR'
        });
    }
};
exports.requireHealthcareProvider = requireHealthcareProvider;
const requireParent = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
            return;
        }
        if (req.user.role !== 'parent' && req.user.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Parent access required',
                code: 'PARENT_REQUIRED'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Parent authorization error:', error);
        res.status(500).json({
            success: false,
            message: 'Authorization check failed',
            code: 'AUTH_CHECK_ERROR'
        });
    }
};
exports.requireParent = requireParent;
const validateDependentAccess = async (req, res, next) => {
    try {
        const { dependentId } = req.params;
        if (!dependentId) {
            res.status(400).json({
                success: false,
                message: 'Dependent ID parameter is required',
                code: 'MISSING_DEPENDENT_ID'
            });
            return;
        }
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
            return;
        }
        const isDependent = req.user.dependents.some(dep => dep.toString() === dependentId);
        const isAdmin = req.user.role === 'admin';
        if (!isDependent && !isAdmin) {
            res.status(403).json({
                success: false,
                message: 'Access denied. You are not authorized to manage this dependent.',
                code: 'DEPENDENT_ACCESS_DENIED'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Dependent access validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Dependent access validation failed',
            code: 'VALIDATION_ERROR'
        });
    }
};
exports.validateDependentAccess = validateDependentAccess;
const userRateLimit = (maxRequests, windowMs) => {
    const userRequestCounts = new Map();
    return (req, res, next) => {
        if (!req.user) {
            next();
            return;
        }
        const userId = req.user._id.toString();
        const now = Date.now();
        const userRequests = userRequestCounts.get(userId);
        if (!userRequests || now > userRequests.resetTime) {
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
            });
            return;
        }
        userRequests.count++;
        next();
    };
};
exports.userRateLimit = userRateLimit;
const validateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            res.status(401).json({
                success: false,
                message: 'API key required',
                code: 'API_KEY_MISSING'
            });
            return;
        }
        const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
        if (!validApiKeys.includes(apiKey)) {
            res.status(401).json({
                success: false,
                message: 'Invalid API key',
                code: 'INVALID_API_KEY'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('API key validation error:', error);
        res.status(500).json({
            success: false,
            message: 'API key validation failed',
            code: 'API_KEY_VALIDATION_ERROR'
        });
    }
};
exports.validateApiKey = validateApiKey;
const logAuthEvents = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (!data.success && (data.code === 'TOKEN_EXPIRED' ||
            data.code === 'TOKEN_INVALID' ||
            data.code === 'AUTH_REQUIRED')) {
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
exports.logAuthEvents = logAuthEvents;
const validateRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(401).json({
                success: false,
                message: 'Refresh token required',
                code: 'REFRESH_TOKEN_MISSING'
            });
            return;
        }
        try {
            const decoded = (0, exports.verifyToken)(refreshToken);
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            const user = await user_1.default.findById(decoded.userId).select('-password');
            if (!user || !user.isActive) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token or user not found',
                    code: 'INVALID_REFRESH_TOKEN'
                });
                return;
            }
            req.user = user;
            next();
        }
        catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token',
                code: 'REFRESH_TOKEN_INVALID',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    catch (error) {
        console.error('Refresh token validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Refresh token validation failed',
            code: 'REFRESH_TOKEN_VALIDATION_ERROR'
        });
    }
};
exports.validateRefreshToken = validateRefreshToken;
exports.default = {
    generateToken: exports.generateToken,
    generateRefreshToken: exports.generateRefreshToken,
    verifyToken: exports.verifyToken,
    authenticateToken: exports.authenticateToken,
    optionalAuth: exports.optionalAuth,
    validateUser: exports.validateUser,
    requireAdmin: exports.requireAdmin,
    requireHealthcareProvider: exports.requireHealthcareProvider,
    requireParent: exports.requireParent,
    validateDependentAccess: exports.validateDependentAccess,
    userRateLimit: exports.userRateLimit,
    validateApiKey: exports.validateApiKey,
    logAuthEvents: exports.logAuthEvents,
    validateRefreshToken: exports.validateRefreshToken
};
//# sourceMappingURL=auth.js.map