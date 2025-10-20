"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const doctorController_1 = require("../../controllers/doctorVaccController/doctorController");
const router = express_1.default.Router();
router.get("/test", (req, res) => {
    res.json({ success: true, message: "Doctor routes are working!" });
});
router.post("/add", doctorController_1.createDoctor);
router.get("/", doctorController_1.getDoctors);
router.get("/:id", doctorController_1.getDoctorById);
exports.default = router;
//# sourceMappingURL=doctorRoutes.js.map