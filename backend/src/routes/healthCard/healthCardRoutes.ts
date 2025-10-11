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
  deleteVaccinationFromHealthCard,
  downloadVaccinationCertificate
} from '../../controllers/healthCard/healthCardController';

import protect from '../../middleware/auth';

const router = express.Router();


// === HEALTH CARD ENDPOINTS ===

// Create health card for a main user
router.post('/create/user/:userId',
  protect,
  createUserHealthCard
);

// Create health card for a dependent
router.post('/create/dependent/:dependentId',
  protect,
  createDependentHealthCard
);

// Create health cards for user and all their dependents
router.post('/create/all/:userId',
  protect,
  createHealthCardsForUserAndDependents
);

// Get health card by user ID
router.get('/user/:userId',
  protect,
  getHealthCardByUserId
);

// Get health card by dependent ID
router.get('/dependent/:dependentId',
  protect,
  getHealthCardByDependentId
);

// Get all health cards for a user and their dependents
router.get('/all',
  protect,
  getAllHealthCardsByUserId
);

// Sync completed vaccines from schedule to health cards
router.post('/sync-vaccines/:userId',
  protect,
  syncCompletedVaccinesToHealthCard
);

// Get health card with completed vaccinations
router.get('/with-vaccinations/:cardId',
  protect,
  getHealthCardWithVaccinations
);

// Delete a specific vaccination from health card
router.delete('/delete-vaccination/:cardId/:vaccineName/:doseNumber',
  protect,
  deleteVaccinationFromHealthCard
);

// Download vaccination certificate as PDF (with token support)
router.get('/download-certificate/:cardId',
  downloadVaccinationCertificate
);

export default router;
