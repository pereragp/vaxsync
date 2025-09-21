"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const healthCardController_1 = require("../../controllers/reportControllers/healthCardController");
const router = express_1.default.Router();
const mockAuth = (req, res, next) => {
    req.user = {
        id: req.params.userId || '66b1234567890abcdef12345'
    };
    next();
};
router.get('/:userId', mockAuth, healthCardController_1.HealthCardController.getHealthCard);
router.put('/:userId', mockAuth, healthCardController_1.HealthCardController.updateHealthCard);
router.get('/card/:cardId', healthCardController_1.HealthCardController.getHealthCardByCardId);
router.get('/stats/:userId', mockAuth, healthCardController_1.HealthCardController.getHealthCardStats);
router.put('/user-info/:userId', mockAuth, healthCardController_1.HealthCardController.updateUserInfo);
exports.default = router;
//# sourceMappingURL=healthCardRoutes.js.map