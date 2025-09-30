import express from "express";
import {
  registerUser,
  getUserById,
  loginUser,
} from "../../controllers/userControllers/userController";
import { addDependent, getDependentsByGuardian } from "../../controllers/userControllers/dependentController";

const router = express.Router();

// User registration route
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/new-dependent", addDependent);

//User profile routes
router.get("/:id", getUserById);
router.get("/dependents/:guardianId", getDependentsByGuardian);

export default router;
