

import express from 'express';
import { HealthCardController } from '../../controllers/reportControllers/healthCardController';
// TEMPORARILY COMMENTED OUT FOR API TESTING - ENABLE WHEN AUTHENTICATION IS READY
// import { authenticateToken, validateUser } from '../../middleware/auth';

const router = express.Router();

// TEMPORARY MOCK MIDDLEWARE FOR TESTING (Remove when auth is implemented)
const mockAuth = (req: any, res: any, next: any) => {
  // Simulate authenticated user for testing
  req.user = { 
    id: req.params.userId || '68bdd7f25f7c2f6b001b5801' 
  };
  next();
};

// Get user's digital health card
router.get('/:userId', 
  // authenticateToken,     // TEMPORARILY COMMENTED OUT
  // validateUser,          // TEMPORARILY COMMENTED OUT
  mockAuth,                 // TEMPORARY: Remove when enabling auth
  HealthCardController.getHealthCard
);

// Update health card with latest data
router.put('/:userId',
  // authenticateToken,     // TEMPORARILY COMMENTED OUT
  // validateUser,          // TEMPORARILY COMMENTED OUT
  mockAuth,                 // TEMPORARY: Remove when enabling auth
  HealthCardController.updateHealthCard
);

// Get health card by card ID (for verification/sharing)
// This endpoint doesn't need auth - it's for public verification
router.get('/card/:cardId',
  HealthCardController.getHealthCardByCardId
);

// Get health card statistics
router.get('/stats/:userId',
  // authenticateToken,     // TEMPORARILY COMMENTED OUT
  // validateUser,          // TEMPORARILY COMMENTED OUT
  mockAuth,                 // TEMPORARY: Remove when enabling auth
  HealthCardController.getHealthCardStats
);

// Update user info on health card
router.put('/user-info/:userId',
  // authenticateToken,     // TEMPORARILY COMMENTED OUT
  // validateUser,          // TEMPORARILY COMMENTED OUT
  mockAuth,                 // TEMPORARY: Remove when enabling auth
  HealthCardController.updateUserInfo
);

// Delete a specific vaccination from health card
router.delete('/vaccination/:userId/:vaccinationId',
  // authenticateToken,     // TEMPORARILY COMMENTED OUT
  // validateUser,          // TEMPORARILY COMMENTED OUT
  mockAuth,                 // TEMPORARY: Remove when enabling auth
  HealthCardController.deleteVaccination
);

// Delete multiple vaccinations from health card
router.delete('/vaccinations/:userId',
  // authenticateToken,     // TEMPORARILY COMMENTED OUT
  // validateUser,          // TEMPORARILY COMMENTED OUT
  mockAuth,                 // TEMPORARY: Remove when enabling auth
  HealthCardController.deleteMultipleVaccinations
);

// Get AI-generated vaccine instructions
router.get('/instructions/card/:cardId/:vaccinationId',
  // authenticateToken,     // TEMPORARILY COMMENTED OUT
  // validateUser,          // TEMPORARILY COMMENTED OUT
  mockAuth,                 // TEMPORARY: Remove when enabling auth
  HealthCardController.getVaccineInstructions
);

export default router;

// TO RE-ENABLE AUTHENTICATION LATER:
// 1. Uncomment the import line at the top
// 2. Uncomment all authenticateToken and validateUser middleware
// 3. Remove the mockAuth middleware and its usage
// 4. Remove this comment block
