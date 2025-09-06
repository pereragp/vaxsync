"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err) => err.message);
        res.status(400).json({
            success: false,
            message: 'Validation Error',
            error: messages.join(', ')
        });
        return;
    }
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        res.status(409).json({
            success: false,
            message: `Duplicate value for ${field}`,
            error: `${field} already exists`
        });
        return;
    }
    if (error.name === 'CastError') {
        res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            error: 'Resource not found'
        });
        return;
    }
    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
        return;
    }
    if (error.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            message: 'Token expired'
        });
        return;
    }
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.stack : 'Something went wrong'
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map