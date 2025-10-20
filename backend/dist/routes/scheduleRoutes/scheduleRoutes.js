"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scheduleController_1 = require("../../controllers/scheduleController/scheduleController");
const auth_1 = __importDefault(require("../../middleware/auth"));
const express_validator_1 = require("express-validator");
const validation_1 = require("../../middleware/validation");
const router = express_1.default.Router();
const createScheduleValidation = [
    (0, express_validator_1.body)('vaccineId')
        .optional()
        .isMongoId()
        .withMessage('Invalid vaccine ID format'),
    (0, express_validator_1.body)('vaccineName')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Vaccine name cannot exceed 100 characters')
        .trim(),
    (0, express_validator_1.body)('totalDoses')
        .isInt({ min: 1 })
        .withMessage('Total doses must be a positive integer'),
    (0, express_validator_1.body)('interval')
        .isInt({ min: 0 })
        .withMessage('Interval must be a non-negative integer'),
    (0, express_validator_1.body)('dependentId')
        .optional()
        .isMongoId()
        .withMessage('Invalid dependent ID format'),
    (0, express_validator_1.body)('healthcareProvider')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Healthcare provider name cannot exceed 100 characters')
        .trim(),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Notes cannot exceed 1000 characters')
        .trim(),
    (0, express_validator_1.body)('scheduleDate')
        .optional()
        .isISO8601()
        .withMessage('Schedule date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('interval')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Interval must be a non-negative integer')
];
const updateDoseValidation = [
    (0, express_validator_1.param)('scheduleId')
        .isMongoId()
        .withMessage('Invalid schedule ID format'),
    (0, express_validator_1.param)('doseNumber')
        .isInt({ min: 1 })
        .withMessage('Dose number must be a positive integer'),
    (0, express_validator_1.body)('status')
        .isIn(['scheduled', 'completed', 'missed', 'cancelled'])
        .withMessage('Status must be one of: scheduled, completed, missed, cancelled'),
    (0, express_validator_1.body)('dateCompleted')
        .optional()
        .isISO8601()
        .withMessage('Date completed must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Dose notes cannot exceed 500 characters')
        .trim()
];
const addDoseValidation = [
    (0, express_validator_1.param)('scheduleId')
        .isMongoId()
        .withMessage('Invalid schedule ID format'),
    (0, express_validator_1.body)('intervalDays')
        .isInt({ min: 1 })
        .withMessage('Interval days must be a positive integer'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Dose notes cannot exceed 500 characters')
        .trim()
];
const scheduleIdValidation = [
    (0, express_validator_1.param)('scheduleId')
        .isMongoId()
        .withMessage('Invalid schedule ID format')
];
router.post('/', auth_1.default, createScheduleValidation, validation_1.validateRequest, scheduleController_1.ScheduleController.createVaccineSchedule);
router.get('/', auth_1.default, validation_1.validatePagination, scheduleController_1.ScheduleController.getAllVaccineSchedules);
router.put('/:scheduleId', auth_1.default, scheduleIdValidation, validation_1.validateRequest, scheduleController_1.ScheduleController.updateVaccineSchedule);
router.put('/:scheduleId/doses/:doseNumber', auth_1.default, updateDoseValidation, validation_1.validateRequest, scheduleController_1.ScheduleController.updateDoseStatus);
router.post('/:scheduleId/doses', auth_1.default, addDoseValidation, validation_1.validateRequest, scheduleController_1.ScheduleController.addDoseToSchedule);
router.delete('/:scheduleId', auth_1.default, scheduleIdValidation, validation_1.validateRequest, scheduleController_1.ScheduleController.deleteVaccineSchedule);
exports.default = router;
//# sourceMappingURL=scheduleRoutes.js.map