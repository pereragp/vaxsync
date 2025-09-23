import express from "express";
import { createDoctor, getDoctors, getDoctorById } from "../../controllers/doctorVaccController/doctorController";
// import { authenticateToken } from "../../middleware/auth"; // Uncomment when auth is ready

const router = express.Router();

// @desc   Test route
// @route  GET /api/doctors/test
// @access Public
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Doctor routes are working!" });
});

// @desc   Create a new doctor
// @route  POST /api/doctors/add
// @access Public (later: secure with auth)
router.post("/add", /* authenticateToken, */ createDoctor);

// @desc   Get all doctors
// @route  GET /api/doctors
// @access Public (later: secure with auth)
router.get("/", /* authenticateToken, */ getDoctors);

// @desc   Get doctor by ID
// @route  GET /api/doctors/:id
// @access Public (later: secure with auth)
router.get("/:id", /* authenticateToken, */ getDoctorById);

export default router;
