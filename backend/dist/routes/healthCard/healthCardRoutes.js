"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const healthCardController_1 = require("../../controllers/healthCard/healthCardController");
const auth_1 = __importDefault(require("../../middleware/auth"));
const router = express_1.default.Router();
router.post('/create/user/:userId', auth_1.default, healthCardController_1.createUserHealthCard);
router.post('/create/dependent/:dependentId', auth_1.default, healthCardController_1.createDependentHealthCard);
router.post('/create/all/:userId', auth_1.default, healthCardController_1.createHealthCardsForUserAndDependents);
router.get('/user/:userId', auth_1.default, healthCardController_1.getHealthCardByUserId);
router.get('/dependent/:dependentId', auth_1.default, healthCardController_1.getHealthCardByDependentId);
router.get('/all', auth_1.default, healthCardController_1.getAllHealthCardsByUserId);
router.post('/sync-vaccines/:userId', auth_1.default, healthCardController_1.syncCompletedVaccinesToHealthCard);
router.get('/with-vaccinations/:cardId', auth_1.default, healthCardController_1.getHealthCardWithVaccinations);
router.delete('/delete-vaccination/:cardId/:vaccineName/:doseNumber', auth_1.default, healthCardController_1.deleteVaccinationFromHealthCard);
router.get('/download-certificate/:cardId', healthCardController_1.downloadVaccinationCertificate);
exports.default = router;
//# sourceMappingURL=healthCardRoutes.js.map