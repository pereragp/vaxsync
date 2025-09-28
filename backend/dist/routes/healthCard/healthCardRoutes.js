"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const healthCardController_1 = require("../../controllers/healthCard/healthCardController");
const router = express_1.default.Router();
const mockAuth = (req, res, next) => {
    req.user = {
        id: req.params.userId || '68bdd7f25f7c2f6b001b5801'
    };
    next();
};
router.post('/create/user/:userId', mockAuth, healthCardController_1.createUserHealthCard);
router.post('/create/dependent/:dependentId', mockAuth, healthCardController_1.createDependentHealthCard);
router.post('/create/all/:userId', mockAuth, healthCardController_1.createHealthCardsForUserAndDependents);
router.get('/user/:userId', mockAuth, healthCardController_1.getHealthCardByUserId);
router.get('/dependent/:dependentId', mockAuth, healthCardController_1.getHealthCardByDependentId);
router.get('/all/:userId', mockAuth, healthCardController_1.getAllHealthCardsByUserId);
router.post('/sync-vaccines/:userId', mockAuth, healthCardController_1.syncCompletedVaccinesToHealthCard);
router.get('/with-vaccinations/:cardId', mockAuth, healthCardController_1.getHealthCardWithVaccinations);
router.delete('/delete-vaccination/:cardId/:vaccineName/:doseNumber', mockAuth, healthCardController_1.deleteVaccinationFromHealthCard);
exports.default = router;
//# sourceMappingURL=healthCardRoutes.js.map