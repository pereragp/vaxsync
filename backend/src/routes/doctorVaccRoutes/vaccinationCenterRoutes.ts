import express from "express";
import {
  addVaccinationCenter,
  getVaccinationCenters,
  getVaccinationCenterById,
} from "../../controllers/doctorVaccController/vaccinationCenterController";

const router = express.Router();

router.post("/", addVaccinationCenter);          // Add new center
router.get("/", getVaccinationCenters);          // Get list/nearby centers
router.get("/:id", getVaccinationCenterById);    // Get center by ID

export default router;
