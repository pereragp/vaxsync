import express from "express";
import { body, param, query } from "express-validator";
import { VaccinationController } from "../../controllers/scheduleController/vaccineController";
import { validateRequest, validatePagination } from "../../middleware/validation";

const router = express.Router();

// Validation rules for vaccine creation
const createVaccineValidation = [
  body('name')
    .notEmpty()
    .withMessage('Vaccine name is required')
    .isLength({ max: 100 })
    .withMessage('Vaccine name cannot exceed 100 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Vaccine description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('manufacturer')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Manufacturer name cannot exceed 100 characters')
    .trim(),
  body('type')
    .optional()
    .isIn(['routine', 'travel', 'emergency', 'seasonal'])
    .withMessage('Type must be one of: routine, travel, emergency, seasonal'),
  body('targetPopulation')
    .optional()
    .isIn(['all', 'female', 'male', 'pregnant', 'newborns', 'infants', 'children', 'adolescents', 'adults', 'elderly', 'animals'])
    .withMessage('Target population must be one of: all, female, male, pregnant, newborns, infants, children, adolescents, adults, elderly, animals')
];

// Validation rules for vaccine update
const updateVaccineValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid vaccine ID format'),
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Vaccine name cannot exceed 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('manufacturer')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Manufacturer name cannot exceed 100 characters')
    .trim(),
  body('type')
    .optional()
    .isIn(['routine', 'travel', 'emergency', 'seasonal'])
    .withMessage('Type must be one of: routine, travel, emergency, seasonal'),
  body('targetPopulation')
    .optional()
    .isIn(['all', 'female', 'male', 'pregnant', 'newborns', 'infants', 'children', 'adolescents', 'adults', 'elderly', 'animals'])
    .withMessage('Target population must be one of: all, female, male, pregnant, newborns, infants, children, adolescents, adults, elderly, animals'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Validation for ID parameters
const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid vaccine ID format')
];

const vaccineIdValidation = [
  param('vaccineId')
    .notEmpty()
    .withMessage('Vaccine ID is required')
    .isString()
    .withMessage('Vaccine ID must be a string')
];

// Routes
// POST /api/vaccines - Create a new vaccine
router.post('/', createVaccineValidation, validateRequest, VaccinationController.createVaccine);

// GET /api/vaccines - Get all vaccines with pagination and filtering
router.get('/', validatePagination, VaccinationController.getAllVaccines);

// GET /api/vaccines/:id - Get vaccine by MongoDB ObjectId
router.get('/:id', idValidation, validateRequest, VaccinationController.getVaccineById);

// GET /api/vaccines/vaccine-id/:vaccineId - Get vaccine by vaccineId string
router.get('/vaccine-id/:vaccineId', vaccineIdValidation, validateRequest, VaccinationController.getVaccineByVaccineId);

// PUT /api/vaccines/:id - Update vaccine by MongoDB ObjectId
router.put('/:id', updateVaccineValidation, validateRequest, VaccinationController.updateVaccine);

// DELETE /api/vaccines/:id - Soft delete vaccine by MongoDB ObjectId
router.delete('/:id', idValidation, validateRequest, VaccinationController.deleteVaccine);

export default router;
