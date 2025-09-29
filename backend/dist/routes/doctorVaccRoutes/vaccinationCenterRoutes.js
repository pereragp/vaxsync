"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vaccinationCenterController_1 = require("../../controllers/doctorVaccController/vaccinationCenterController");
const router = express_1.default.Router();
router.post("/", vaccinationCenterController_1.addVaccinationCenter);
router.get("/", vaccinationCenterController_1.getVaccinationCenters);
router.get("/:id", vaccinationCenterController_1.getVaccinationCenterById);
exports.default = router;
//# sourceMappingURL=vaccinationCenterRoutes.js.map