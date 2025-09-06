"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scheduleController_1 = require("../../controllers/scheduleController/scheduleController");
const router = express_1.default.Router();
router.get('/vaccines', [], scheduleController_1.ScheduleController.getAvailableVaccines);
router.get('/vaccines/:vaccineId', [], scheduleController_1.ScheduleController.getVaccineById);
router.post('/', [], scheduleController_1.ScheduleController.createSchedule);
router.get('/', [], scheduleController_1.ScheduleController.getUserSchedules);
router.get('/:scheduleId', [], scheduleController_1.ScheduleController.getScheduleById);
router.get('/upcoming', [], scheduleController_1.ScheduleController.getUpcomingSchedules);
router.post('/sync-health-card', [], scheduleController_1.ScheduleController.syncAllCompletedDosesToHealthCard);
router.put('/:scheduleId', [], scheduleController_1.ScheduleController.updateSchedule);
router.put('/:scheduleId/dose/:doseNumber', [], scheduleController_1.ScheduleController.updateDoseStatus);
router.delete('/:scheduleId', [], scheduleController_1.ScheduleController.deleteSchedule);
exports.default = router;
//# sourceMappingURL=scheduleRoutes.js.map