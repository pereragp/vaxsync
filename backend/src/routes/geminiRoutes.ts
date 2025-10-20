import express from 'express';
import { GeminiController } from '../controllers/geminiController';
import protect from '../middleware/auth';

const router = express.Router();

// === GEMINI AI ENDPOINTS ===

// Generate post-vaccination instructions using Gemini AI and send as push notification
router.post('/generate-instructions',
  protect,
  GeminiController.generateVaccineInstructions
);


export default router;
