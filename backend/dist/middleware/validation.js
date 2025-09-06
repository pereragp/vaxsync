"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmailSharing = exports.validatePagination = exports.validateReportGeneration = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
        return;
    }
    next();
};
exports.validateRequest = validateRequest;
const validateReportGeneration = (req, res, next) => {
    try {
        const { reportType, format, dateRange, includeRecords } = req.body;
        const validReportTypes = ['vaccination_history', 'travel_certificate', 'medical_report', 'compliance_report'];
        const validFormats = ['pdf', 'json', 'csv'];
        if (reportType && !validReportTypes.includes(reportType)) {
            res.status(400).json({
                success: false,
                message: `Invalid report type. Must be one of: ${validReportTypes.join(', ')}`
            });
            return;
        }
        if (format && !validFormats.includes(format)) {
            res.status(400).json({
                success: false,
                message: `Invalid format. Must be one of: ${validFormats.join(', ')}`
            });
            return;
        }
        if (dateRange) {
            if (dateRange.from && isNaN(Date.parse(dateRange.from))) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid date format for dateRange.from'
                });
                return;
            }
            if (dateRange.to && isNaN(Date.parse(dateRange.to))) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid date format for dateRange.to'
                });
                return;
            }
            if (dateRange.from && dateRange.to && new Date(dateRange.from) > new Date(dateRange.to)) {
                res.status(400).json({
                    success: false,
                    message: 'dateRange.from must be before dateRange.to'
                });
                return;
            }
        }
        if (includeRecords && (!Array.isArray(includeRecords) || includeRecords.length === 0)) {
            res.status(400).json({
                success: false,
                message: 'includeRecords must be a non-empty array of record IDs'
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Validation failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
exports.validateReportGeneration = validateReportGeneration;
const validatePagination = (req, res, next) => {
    try {
        const { page, limit } = req.query;
        if (page && (isNaN(Number(page)) || Number(page) < 1)) {
            res.status(400).json({
                success: false,
                message: 'Page must be a positive integer'
            });
            return;
        }
        if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
            res.status(400).json({
                success: false,
                message: 'Limit must be a positive integer between 1 and 100'
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Pagination validation failed'
        });
    }
};
exports.validatePagination = validatePagination;
const validateEmailSharing = (req, res, next) => {
    try {
        const { emails, accessLevel } = req.body;
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Emails array is required and must not be empty'
            });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emails.filter((email) => !emailRegex.test(email));
        if (invalidEmails.length > 0) {
            res.status(400).json({
                success: false,
                message: `Invalid email format: ${invalidEmails.join(', ')}`
            });
            return;
        }
        if (accessLevel && !['read', 'download'].includes(accessLevel)) {
            res.status(400).json({
                success: false,
                message: 'Access level must be either "read" or "download"'
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Email validation failed'
        });
    }
};
exports.validateEmailSharing = validateEmailSharing;
//# sourceMappingURL=validation.js.map