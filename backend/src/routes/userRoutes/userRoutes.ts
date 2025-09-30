import express from "express";
import {
  registerUser,
  getUserById,
  loginUser,
  getMyProfile,
} from "../../controllers/userControllers/userController";
import {
  addDependent,
  getDependentsByGuardian,
} from "../../controllers/userControllers/dependentController";
import protect from "../../middleware/auth";

const router = express.Router();

// User registration route
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/new-dependent", addDependent);

// Protected route to get current user's profile
router.get("/profile", protect, getMyProfile);

//User profile routes
router.get("/:id", getUserById);
router.get("/dependents/:guardianId", getDependentsByGuardian);

export default router;
