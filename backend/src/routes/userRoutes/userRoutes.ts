import express from "express";
import {
  registerUser,
  getUserById,
  loginUser,
  getMyProfile,
  logoutUser,
  updateProfile,
  changePassword,
} from "../../controllers/userControllers/userController";
import {
  addDependent,
  getDependentsByGuardian,
  updateDependent,
  removeDependent,
} from "../../controllers/userControllers/dependentController";
import protect from "../../middleware/auth";

const router = express.Router();

// User registration route
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);

// Protected route to get current user's profile
router.get("/profile", protect, getMyProfile);

//User profile routes
router.get("/:id", getUserById);
router.put("/profile/update", protect, updateProfile);
router.put("/change-password", protect, changePassword); //Reset password route

// Protected dependent routes
router.post("/new-dependent", protect, addDependent);
router.get("/dependents/:guardianId", protect, getDependentsByGuardian);
router.put("/dependents/:guardianId/:dependentId", protect, updateDependent);
router.delete("/dependents/:guardianId/:dependentId", protect, removeDependent);

export default router;
