import express from 'express';
import { ReportController } from '../../controllers/reportControllers/reportController';
import { authenticateToken, validateUser, requireAdmin } from '../../middleware/auth';
import { 
  validateReportGeneration, 
  validatePagination, 
  validateEmailSharing 
} from '../../middleware/validation';
import { 
  apiLimiter, 
  reportGenerationLimiter, 
  downloadLimiter 
} from '../../middleware/rateLimiter';

const router = express.Router();

// Apply general rate limiting to all routes
router.use(apiLimiter);

/**
 * @route   GET /api/reports/analytics/:userId
 * @desc    Get vaccination analytics for dashboard
 * @access  Private
 */
router.get('/analytics/:userId', 
  authenticateToken,
  validateUser,
  ReportController.getVaccinationAnalytics
);

/**
 * @route   POST /api/reports/generate/:userId
 * @desc    Generate vaccination report
 * @access  Private
 */
router.post('/generate/:userId',
  reportGenerationLimiter,
  authenticateToken,
  validateUser,
  validateReportGeneration,
  ReportController.generateVaccinationReport
);

/**
 * @route   GET /api/reports/download/:reportId
 * @desc    Download generated report
 * @access  Public (with valid reportId)
 */
router.get('/download/:reportId',
  downloadLimiter,
  ReportController.downloadReport
);

/**
 * @route   GET /api/reports/history/:userId
 * @desc    Get vaccination history with filters and pagination
 * @access  Private
 */
router.get('/history/:userId',
  authenticateToken,
  validateUser,
  validatePagination,
  ReportController.getVaccinationHistory
);

/**
 * @route   GET /api/reports/list/:userId
 * @desc    Get user's generated reports
 * @access  Private
 */
router.get('/list/:userId',
  authenticateToken,
  validateUser,
  validatePagination,
  ReportController.getUserReports
);

/**
 * @route   POST /api/reports/share/:reportId
 * @desc    Share report with others
 * @access  Private
 */
router.post('/share/:reportId',
  authenticateToken,
  validateEmailSharing,
  ReportController.shareReport
);

/**
 * @route   DELETE /api/reports/:reportId
 * @desc    Delete report
 * @access  Private
 */
router.delete('/:reportId',
  authenticateToken,
  ReportController.deleteReport
);

export default router;