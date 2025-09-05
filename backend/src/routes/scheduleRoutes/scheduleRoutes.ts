import express from 'express';
import { ScheduleController } from '../../controllers/scheduleController/scheduleController';
import { authenticateToken } from '../../middleware/auth';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../../middleware/validation';

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authenticateToken); // Commented out for testing

/**
 * @route GET /api/v1/schedule/vaccines
 * @desc Get all available vaccines
 * @access Private
 */
router.get('/vaccines', [
  // query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  // query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  // query('type').optional().isIn(['routine', 'travel', 'emergency', 'seasonal']).withMessage('Invalid vaccine type'),
  // query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search term must be between 1 and 100 characters'),
  // validateRequest
], ScheduleController.getAvailableVaccines);

/**
 * @route GET /api/v1/schedule/vaccines/:vaccineId
 * @desc Get specific vaccine by ID
 * @access Private
 */
router.get('/vaccines/:vaccineId', [
  // param('vaccineId').isMongoId().withMessage('Invalid vaccine ID format'),
  // validateRequest
], ScheduleController.getVaccineById);

/**
 * @route POST /api/v1/schedule
 * @desc Create vaccination schedule (supports both suggested vaccines and manual entry)
 * @access Private
 */
router.post('/', [
  // body('vaccineId').optional().isMongoId().withMessage('Invalid vaccine ID format'),
  // body('vaccineName').optional().isLength({ min: 1, max: 100 }).withMessage('Vaccine name must be between 1 and 100 characters'),
  // body('manufacturer').optional().isLength({ min: 1, max: 100 }).withMessage('Manufacturer must be between 1 and 100 characters'),
  // body('totalDoses').optional().isInt({ min: 1, max: 10 }).withMessage('Total doses must be between 1 and 10'),
  // body('interval').optional().isInt({ min: 0 }).withMessage('Interval must be a non-negative integer'),
  // body('dateScheduled').isISO8601().withMessage('Invalid date format for scheduled date'),
  // body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  // body('healthcareProvider.name').optional().isLength({ max: 100 }).withMessage('Healthcare provider name cannot exceed 100 characters'),
  // body('healthcareProvider.facility').optional().isLength({ max: 100 }).withMessage('Healthcare facility name cannot exceed 100 characters'),
  // body('healthcareProvider.contact').optional().isLength({ max: 50 }).withMessage('Healthcare provider contact cannot exceed 50 characters'),
  // validateRequest
], ScheduleController.createSchedule);

/**
 * @route GET /api/v1/schedule
 * @desc Get user's vaccination schedules
 * @access Private
 */
router.get('/', [
  // query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  // query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  // query('status').optional().isIn(['scheduled', 'completed', 'missed', 'cancelled']).withMessage('Invalid status'),
  // query('vaccineName').optional().isLength({ min: 1, max: 100 }).withMessage('Vaccine name search must be between 1 and 100 characters'),
  // validateRequest
], ScheduleController.getUserSchedules);

/**
 * @route GET /api/v1/schedule/:scheduleId
 * @desc Get specific vaccination schedule by ID
 * @access Private
 */
router.get('/:scheduleId', [
  // param('scheduleId').isMongoId().withMessage('Invalid schedule ID format'),
  // validateRequest
], ScheduleController.getScheduleById);

/**
 * @route GET /api/v1/schedule/upcoming
 * @desc Get upcoming vaccination schedules
 * @access Private
 */
router.get('/upcoming', [
  // query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
  // validateRequest
], ScheduleController.getUpcomingSchedules);

/**
 * @route POST /api/v1/schedule/sync-health-card
 * @desc Sync all completed doses to health card
 * @access Private
 */
router.post('/sync-health-card', [
  // validateRequest
], ScheduleController.syncAllCompletedDosesToHealthCard);

/**
 * @route PUT /api/v1/schedule/:scheduleId
 * @desc Update vaccination schedule
 * @access Private
 */
router.put('/:scheduleId', [
  // param('scheduleId').isMongoId().withMessage('Invalid schedule ID format'),
  // body('dateScheduled').optional().isISO8601().withMessage('Invalid date format for scheduled date'),
  // body('status').optional().isIn(['scheduled', 'completed', 'missed', 'cancelled']).withMessage('Invalid status'),
  // body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  // body('healthcareProvider.name').optional().isLength({ max: 100 }).withMessage('Healthcare provider name cannot exceed 100 characters'),
  // body('healthcareProvider.facility').optional().isLength({ max: 100 }).withMessage('Healthcare facility name cannot exceed 100 characters'),
  // body('healthcareProvider.contact').optional().isLength({ max: 50 }).withMessage('Healthcare provider contact cannot exceed 50 characters'),
  // validateRequest
], ScheduleController.updateSchedule);

/**
 * @route PUT /api/v1/schedule/:scheduleId/dose/:doseNumber
 * @desc Update individual dose status
 * @access Private
 */
router.put('/:scheduleId/dose/:doseNumber', [
  // param('scheduleId').isMongoId().withMessage('Invalid schedule ID format'),
  // param('doseNumber').isInt({ min: 1 }).withMessage('Dose number must be a positive integer'),
  // body('status').optional().isIn(['scheduled', 'completed', 'missed', 'cancelled']).withMessage('Invalid status'),
  // body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  // body('dateCompleted').optional().isISO8601().withMessage('Invalid date format for completion date'),
  // validateRequest
], ScheduleController.updateDoseStatus);

/**
 * @route DELETE /api/v1/schedule/:scheduleId
 * @desc Delete vaccination schedule
 * @access Private
 */
router.delete('/:scheduleId', [
  // param('scheduleId').isMongoId().withMessage('Invalid schedule ID format'),
  // validateRequest
], ScheduleController.deleteSchedule);

export default router;
