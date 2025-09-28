import express from 'express';
import { 
  createUserHealthCard,
  createDependentHealthCard,
  createHealthCardsForUserAndDependents,
  getHealthCardByUserId,
  getHealthCardByDependentId,
  getAllHealthCardsByUserId,
  syncCompletedVaccinesToHealthCard,
  getHealthCardWithVaccinations,
  deleteVaccinationFromHealthCard
} from '../../controllers/healthCard/healthCardController';

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

// === HEALTH CARD ENDPOINTS ===

// Create health card for a main user
router.post('/create/user/:userId',
  mockAuth,
  createUserHealthCard
);

// Create health card for a dependent
router.post('/create/dependent/:dependentId',
  mockAuth,
  createDependentHealthCard
);

// Create health cards for user and all their dependents
router.post('/create/all/:userId',
  mockAuth,
  createHealthCardsForUserAndDependents
);

// Get health card by user ID
router.get('/user/:userId',
  mockAuth,
  getHealthCardByUserId
);

// Get health card by dependent ID
router.get('/dependent/:dependentId',
  mockAuth,
  getHealthCardByDependentId
);

// Get all health cards for a user and their dependents
router.get('/all/:userId',
  mockAuth,
  getAllHealthCardsByUserId
);

// Sync completed vaccines from schedule to health cards
router.post('/sync-vaccines/:userId',
  mockAuth,
  syncCompletedVaccinesToHealthCard
);

// Get health card with completed vaccinations
router.get('/with-vaccinations/:cardId',
  mockAuth,
  getHealthCardWithVaccinations
);

// Delete a specific vaccination from health card
router.delete('/delete-vaccination/:cardId/:vaccineName/:doseNumber',
  mockAuth,
  deleteVaccinationFromHealthCard
);

export default router;

// TO RE-ENABLE AUTHENTICATION LATER:
// 1. Uncomment the import line at the top
// 2. Uncomment all authenticateToken and validateUser middleware
// 3. Remove the mockAuth middleware and its usage
// 4. Remove this comment block
