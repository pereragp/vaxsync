import express from "express";
import { VaccinationController } from "../../controllers/scheduleController/vaccineController";
// import { authenticateToken } from "../../middleware/auth";
import { body, param, query } from "express-validator";
import { validateRequest } from "../../middleware/validation";
import { create } from "domain";

const router = express.Router();

router.post("/", createVaccine);
router.get(
  "/",
  //authenticateToken,
  async function getAllVaccines(req: any, res: any) {
    return VaccinationController.getAllVaccines(req, res);
  }
);

router.get(
  "/:id",
  //authenticateToken,
  async function getVaccineById(req: any, res: any) {
    return VaccinationController.getVaccineById(req, res);
  }
);

async function createVaccine(req: any, res: any) {
  return VaccinationController.createVaccine(req, res);
}

export default router;
