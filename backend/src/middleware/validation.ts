import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * Validate report generation request
 */
export const validateReportGeneration = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { reportType, format, dateRange, includeRecords } = req.body;
    
    const validReportTypes = ['vaccination_history', 'travel_certificate', 'medical_report', 'compliance_report'];
    const validFormats = ['pdf', 'json', 'csv'];

    // Validate report type
    if (reportType && !validReportTypes.includes(reportType)) {
      res.status(400).json({
        success: false,
        message: `Invalid report type. Must be one of: ${validReportTypes.join(', ')}`
      } as ApiResponse);
      return;
    }

    // Validate format
    if (format && !validFormats.includes(format)) {
      res.status(400).json({
        success: false,
        message: `Invalid format. Must be one of: ${validFormats.join(', ')}`
      } as ApiResponse);
      return;
    }

    // Validate date range
    if (dateRange) {
      if (dateRange.from && isNaN(Date.parse(dateRange.from))) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format for dateRange.from'
        } as ApiResponse);
        return;
      }

      if (dateRange.to && isNaN(Date.parse(dateRange.to))) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format for dateRange.to'
        } as ApiResponse);
        return;
      }

      if (dateRange.from && dateRange.to && new Date(dateRange.from) > new Date(dateRange.to)) {
        res.status(400).json({
          success: false,
          message: 'dateRange.from must be before dateRange.to'
        } as ApiResponse);
        return;
      }
    }

    // Validate includeRecords
    if (includeRecords && (!Array.isArray(includeRecords) || includeRecords.length === 0)) {
      res.status(400).json({
        success: false,
        message: 'includeRecords must be a non-empty array of record IDs'
      } as ApiResponse);
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    } as ApiResponse);
  }
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { page, limit } = req.query;

    // Validate page
    if (page && (isNaN(Number(page)) || Number(page) < 1)) {
      res.status(400).json({
        success: false,
        message: 'Page must be a positive integer'
      } as ApiResponse);
      return;
    }

    // Validate limit
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
      res.status(400).json({
        success: false,
        message: 'Limit must be a positive integer between 1 and 100'
      } as ApiResponse);
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Pagination validation failed'
    } as ApiResponse);
  }
};

/**
 * Validate email sharing request
 */
export const validateEmailSharing = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { emails, accessLevel } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Emails array is required and must not be empty'
      } as ApiResponse);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter((email: string) => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      res.status(400).json({
        success: false,
        message: `Invalid email format: ${invalidEmails.join(', ')}`
      } as ApiResponse);
      return;
    }

    // Validate access level
    if (accessLevel && !['read', 'download'].includes(accessLevel)) {
      res.status(400).json({
        success: false,
        message: 'Access level must be either "read" or "download"'
      } as ApiResponse);
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Email validation failed'
    } as ApiResponse);
  }
};