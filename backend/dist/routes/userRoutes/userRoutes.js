"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../../controllers/userControllers/userController");
const dependentController_1 = require("../../controllers/userControllers/dependentController");
const router = express_1.default.Router();
router.post("/register", userController_1.registerUser);
router.post("/login", userController_1.loginUser);
router.post("/new-dependent", dependentController_1.addDependent);
router.get("/:id", userController_1.getUserById);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map