"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiController = void 0;
const geminiService_1 = __importDefault(require("../services/geminiService"));
class GeminiController {
    static async generateVaccineInstructions(req, res) {
        try {
            const { dateOfBirth, gender, vaccineName, totalDoses, vaccineDate, completedDoseNo, expoPushToken, userId } = req.body;
            if (!dateOfBirth || !vaccineName || !totalDoses || !vaccineDate || !completedDoseNo) {
                res.status(400).json({
                    success: false,
                    message: "Missing required fields: dateOfBirth, vaccineName, totalDoses, vaccineDate, completedDoseNo"
                });
                return;
            }
            if (typeof totalDoses !== 'number' || typeof completedDoseNo !== 'number') {
                res.status(400).json({
                    success: false,
                    message: "totalDoses and completedDoseNo must be numbers"
                });
                return;
            }
            if (completedDoseNo > totalDoses) {
                res.status(400).json({
                    success: false,
                    message: "completedDoseNo cannot be greater than totalDoses"
                });
                return;
            }
            const instructions = await geminiService_1.default.generateVaccineInstructions({
                dateOfBirth: new Date(dateOfBirth),
                gender,
                vaccineName,
                totalDoses,
                vaccineDate: new Date(vaccineDate),
                completedDoseNo
            });
            res.status(200).json({
                success: true,
                message: "Vaccine instructions generated successfully",
                data: {
                    instructions,
                    metadata: {
                        vaccineName,
                        totalDoses,
                        completedDoseNo,
                        remainingDoses: totalDoses - completedDoseNo,
                        generatedAt: new Date()
                    }
                }
            });
        }
        catch (error) {
            console.error('Error generating vaccine instructions:', error);
            res.status(500).json({
                success: false,
                message: "Failed to generate vaccine instructions",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}
exports.GeminiController = GeminiController;
//# sourceMappingURL=geminiController.js.map