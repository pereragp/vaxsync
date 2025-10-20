"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const vaccineController_1 = require("../../controllers/scheduleController/vaccineController");
const validation_1 = require("../../middleware/validation");
const router = express_1.default.Router();
const createVaccineValidation = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Vaccine name is required')
        .isLength({ max: 100 })
        .withMessage('Vaccine name cannot exceed 100 characters')
        .trim(),
    (0, express_validator_1.body)('description')
        .notEmpty()
        .withMessage('Vaccine description is required')
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    (0, express_validator_1.body)('manufacturer')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Manufacturer name cannot exceed 100 characters')
        .trim(),
    (0, express_validator_1.body)('type')
        .optional()
        .isIn(['routine', 'travel', 'emergency', 'seasonal'])
        .withMessage('Type must be one of: routine, travel, emergency, seasonal'),
    (0, express_validator_1.body)('targetPopulation')
        .optional()
        .isIn(['all', 'female', 'male', 'pregnant'])
        .withMessage('Target population must be one of: all, female, male, pregnant')
];
const updateVaccineValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid vaccine ID format'),
    (0, express_validator_1.body)('name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Vaccine name cannot exceed 100 characters')
        .trim(),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    (0, express_validator_1.body)('manufacturer')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Manufacturer name cannot exceed 100 characters')
        .trim(),
    (0, express_validator_1.body)('type')
        .optional()
        .isIn(['routine', 'travel', 'emergency', 'seasonal'])
        .withMessage('Type must be one of: routine, travel, emergency, seasonal'),
    (0, express_validator_1.body)('targetPopulation')
        .optional()
        .isIn(['all', 'female', 'male', 'pregnant'])
        .withMessage('Target population must be one of: all, female, male, pregnant'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
];
const idValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid vaccine ID format')
];
const vaccineIdValidation = [
    (0, express_validator_1.param)('vaccineId')
        .notEmpty()
        .withMessage('Vaccine ID is required')
        .isString()
        .withMessage('Vaccine ID must be a string')
];
router.post('/', createVaccineValidation, validation_1.validateRequest, vaccineController_1.VaccinationController.createVaccine);
router.get('/', validation_1.validatePagination, vaccineController_1.VaccinationController.getAllVaccines);
router.get('/:id', idValidation, validation_1.validateRequest, vaccineController_1.VaccinationController.getVaccineById);
router.get('/vaccine-id/:vaccineId', vaccineIdValidation, validation_1.validateRequest, vaccineController_1.VaccinationController.getVaccineByVaccineId);
router.put('/:id', updateVaccineValidation, validation_1.validateRequest, vaccineController_1.VaccinationController.updateVaccine);
router.delete('/:id', idValidation, validation_1.validateRequest, vaccineController_1.VaccinationController.deleteVaccine);
exports.default = router;
//# sourceMappingURL=vaccineRoutes.js.map