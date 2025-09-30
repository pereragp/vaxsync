"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const geminiController_1 = require("../controllers/geminiController");
const router = express_1.default.Router();
const mockAuth = (req, res, next) => {
    req.user = {
        id: req.params.userId || '68cfcf945e1c53a931fa032e'
    };
    next();
};
router.post('/generate-instructions', mockAuth, geminiController_1.GeminiController.generateVaccineInstructions);
exports.default = router;
//# sourceMappingURL=geminiRoutes.js.map