"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaccinationController = void 0;
const vaccinesModel_1 = __importDefault(require("../../models/scheduleModels/vaccinesModel"));
class VaccinationController {
    static async createVaccine(req, res) {
        try {
            const { name, description, manufacturer, type, ageGroups, sideEffects, targetPopulation, doseSchedule, } = req.body;
            const newVaccine = new vaccinesModel_1.default({
                name,
                description,
                manufacturer,
                type,
                ageGroups,
                sideEffects,
                targetPopulation: targetPopulation || "all",
                doseSchedule: doseSchedule || [],
            });
            await newVaccine.save();
            res
                .status(201)
                .json({ message: "Vaccine created successfully", vaccine: newVaccine });
        }
        catch (error) {
            res.status(500).json({ message: "Error creating vaccine", error });
        }
    }
    static async getAllVaccines(req, res) {
        try {
            const vaccines = await vaccinesModel_1.default.find();
            res
                .status(200)
                .json({ message: "Vaccines retrieved successfully", vaccines });
        }
        catch (error) {
            res.status(500).json({ message: "Error retrieving vaccines", error });
        }
    }
    static async getVaccineById(req, res) {
        try {
            const vaccine = await vaccinesModel_1.default.findById(req.params.id);
            if (!vaccine) {
                return res.status(404).json({ message: "Vaccine not found" });
            }
            res
                .status(200)
                .json({ message: "Vaccine retrieved successfully", vaccine });
        }
        catch (error) {
            res.status(500).json({ message: "Error retrieving vaccine", error });
        }
    }
}
exports.VaccinationController = VaccinationController;
//# sourceMappingURL=vaccineController.js.map