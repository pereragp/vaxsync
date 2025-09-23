"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vaccineController_1 = require("../../controllers/scheduleController/vaccineController");
const router = express_1.default.Router();
router.post("/", createVaccine);
router.get("/", async function getAllVaccines(req, res) {
    return vaccineController_1.VaccinationController.getAllVaccines(req, res);
});
router.get("/:id", async function getVaccineById(req, res) {
    return vaccineController_1.VaccinationController.getVaccineById(req, res);
});
async function createVaccine(req, res) {
    return vaccineController_1.VaccinationController.createVaccine(req, res);
}
exports.default = router;
//# sourceMappingURL=vaccineRoutes.js.map