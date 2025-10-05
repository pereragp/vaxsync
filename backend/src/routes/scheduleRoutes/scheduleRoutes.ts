import express from 'express';
import { ScheduleController } from '../../controllers/scheduleController/scheduleController';
import protect from '../../middleware/auth';
import { body, param, query } from 'express-validator';
import { validateRequest, validatePagination } from '../../middleware/validation';

const router = express.Router();

// Validation rules for creating vaccine schedule
const createScheduleValidation = [
  body('vaccineId')
    .optional()
    .isMongoId()
    .withMessage('Invalid vaccine ID format'),
  body('vaccineName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Vaccine name cannot exceed 100 characters')
    .trim(),
  body('totalDoses')
    .isInt({ min: 1 })
    .withMessage('Total doses must be a positive integer'),
  body('interval')
    .isInt({ min: 0 })
    .withMessage('Interval must be a non-negative integer'),
  body('dependentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid dependent ID format'),
  body('healthcareProvider')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Healthcare provider name cannot exceed 100 characters')
    .trim(),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
    .trim(),
  body('scheduleDate')
    .optional()
    .isISO8601()
    .withMessage('Schedule date must be a valid ISO 8601 date'),
  body('interval')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Interval must be a non-negative integer')
];

// Validation rules for updating dose status
const updateDoseValidation = [
  param('scheduleId')
    .isMongoId()
    .withMessage('Invalid schedule ID format'),
  param('doseNumber')
    .isInt({ min: 1 })
    .withMessage('Dose number must be a positive integer'),
  body('status')
    .isIn(['scheduled', 'completed', 'missed', 'cancelled'])
    .withMessage('Status must be one of: scheduled, completed, missed, cancelled'),
  body('dateCompleted')
    .optional()
    .isISO8601()
    .withMessage('Date completed must be a valid ISO 8601 date'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Dose notes cannot exceed 500 characters')
    .trim()
];

// Validation for ID parameters
const scheduleIdValidation = [
  param('scheduleId')
    .isMongoId()
    .withMessage('Invalid schedule ID format')
];

// Routes
// POST /api/v1/schedule - Create new vaccine schedule
router.post('/', protect, createScheduleValidation, validateRequest, ScheduleController.createVaccineSchedule);

// GET /api/v1/schedule - Get all vaccine schedules with filtering
router.get('/', protect, validatePagination, ScheduleController.getAllVaccineSchedules);

// PUT /api/v1/schedule/:scheduleId - Update vaccine schedule
router.put('/:scheduleId', protect, scheduleIdValidation, validateRequest, ScheduleController.updateVaccineSchedule);

// PUT /api/v1/schedule/:scheduleId/doses/:doseNumber - Update dose status
router.put('/:scheduleId/doses/:doseNumber', protect, updateDoseValidation, validateRequest, ScheduleController.updateDoseStatus);

// DELETE /api/v1/schedule/:scheduleId - Delete vaccine schedule
router.delete('/:scheduleId', protect, scheduleIdValidation, validateRequest, ScheduleController.deleteVaccineSchedule);

export default router;