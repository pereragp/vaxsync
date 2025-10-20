"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../../controllers/userControllers/userController");
const dependentController_1 = require("../../controllers/userControllers/dependentController");
const auth_1 = __importDefault(require("../../middleware/auth"));
const authController_1 = require("../../controllers/userControllers/authController");
const router = express_1.default.Router();
router.post("/register", userController_1.registerUser);
router.post("/login", userController_1.loginUser);
router.post("/logout", auth_1.default, userController_1.logoutUser);
router.post("/forgot-password", authController_1.forgotPassword);
router.post("/reset-password", authController_1.resetPassword);
router.get("/profile", auth_1.default, userController_1.getMyProfile);
router.get("/:id", userController_1.getUserById);
router.put("/profile/update", auth_1.default, userController_1.updateProfile);
router.put("/change-password", auth_1.default, userController_1.changePassword);
router.post("/new-dependent", auth_1.default, dependentController_1.addDependent);
router.get("/dependents/:guardianId", auth_1.default, dependentController_1.getDependentsByGuardian);
router.put("/dependents/:guardianId/:dependentId", auth_1.default, dependentController_1.updateDependent);
router.delete("/dependents/:guardianId/:dependentId", auth_1.default, dependentController_1.removeDependent);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map