import express from "express";
// import { authenticateToken } from "../../middleware/auth";
import { Router } from "express";
import { VaccineScheduleController } from "../../controllers/scheduleController/scheduleController";

const router = Router();

// Apply authentication middleware to all routes
// router.use(authenticateToken);

// CRUD Operations
router.post("/api/schedules", VaccineScheduleController.createSchedule);
router.get("/schedules/:scheduleId", VaccineScheduleController.getScheduleById);
router.get("/schedules", VaccineScheduleController.getSchedules);
router.put("/schedules/:scheduleId", VaccineScheduleController.updateSchedule);
router.delete(
  "/schedules/:scheduleId",
  VaccineScheduleController.deleteSchedule
);

// Dose Management
router.put(
  "/schedules/:scheduleId/doses/:doseNumber",
  VaccineScheduleController.updateDoseStatus
);

// Special Queries
router.get("/upcoming", VaccineScheduleController.getUpcomingVaccines);
router.get("/overdue", VaccineScheduleController.getOverdueVaccines);

export default router;
