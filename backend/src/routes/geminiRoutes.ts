import express from 'express';
import { GeminiController } from '../controllers/geminiController';

const router = express.Router();

// TEMPORARY MOCK MIDDLEWARE FOR TESTING (Remove when auth is implemented)
const mockAuth = (req: any, res: any, next: any) => {
  // Simulate authenticated user for testing
  req.user = { 
    id: req.params.userId || '68cfcf945e1c53a931fa032e' 
  };
  next();
};

// === GEMINI AI ENDPOINTS ===

// Generate post-vaccination instructions using Gemini AI and send as push notification
router.post('/generate-instructions',
  mockAuth,
  GeminiController.generateVaccineInstructions
);


export default router;
