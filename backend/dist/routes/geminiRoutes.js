"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const geminiController_1 = require("../controllers/geminiController");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
router.post('/generate-instructions', auth_1.default, geminiController_1.GeminiController.generateVaccineInstructions);
exports.default = router;
//# sourceMappingURL=geminiRoutes.js.map