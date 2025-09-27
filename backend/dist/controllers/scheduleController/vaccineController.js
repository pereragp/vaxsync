"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaccinationController = void 0;
const mongoose_1 = require("mongoose");
const vaccinesModel_1 = __importDefault(require("../../models/scheduleModels/vaccinesModel"));
class VaccinationController {
    static async createVaccine(req, res) {
        try {
            const { name, description, manufacturer, type, targetPopulation } = req.body;
            const existingVaccine = await vaccinesModel_1.default.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
            if (existingVaccine) {
                res.status(409).json({
                    success: false,
                    message: "Vaccine with this name already exists",
                    error: "Duplicate vaccine name"
                });
                return;
            }
            const vaccine = new vaccinesModel_1.default({
                name,
                description,
                manufacturer,
                type: type || "routine",
                targetPopulation: targetPopulation || "female"
            });
            const savedVaccine = await vaccine.save();
            res.status(201).json({
                success: true,
                message: "Vaccine created successfully",
                data: savedVaccine
            });
        }
        catch (error) {
            console.error("Error creating vaccine:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create vaccine",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getAllVaccines(req, res) {
        try {
            const { page = 1, limit = 10, type, targetPopulation, isActive } = req.query;
            const filter = {};
            if (type)
                filter.type = type;
            if (targetPopulation)
                filter.targetPopulation = targetPopulation;
            if (isActive !== undefined)
                filter.isActive = isActive === 'true';
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const vaccines = await vaccinesModel_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean();
            const totalVaccines = await vaccinesModel_1.default.countDocuments(filter);
            const totalPages = Math.ceil(totalVaccines / limitNum);
            res.status(200).json({
                success: true,
                message: "Vaccines retrieved successfully",
                data: vaccines,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalRecords: totalVaccines,
                    hasNextPage: pageNum < totalPages,
                    hasPreviousPage: pageNum > 1
                }
            });
        }
        catch (error) {
            console.error("Error fetching vaccines:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch vaccines",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getVaccineById(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid vaccine ID format",
                    error: "Invalid ID format"
                });
                return;
            }
            const vaccine = await vaccinesModel_1.default.findById(id);
            if (!vaccine) {
                res.status(404).json({
                    success: false,
                    message: "Vaccine not found",
                    error: "Vaccine with this ID does not exist"
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Vaccine retrieved successfully",
                data: vaccine
            });
        }
        catch (error) {
            console.error("Error fetching vaccine:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch vaccine",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async updateVaccine(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid vaccine ID format",
                    error: "Invalid ID format"
                });
                return;
            }
            const existingVaccine = await vaccinesModel_1.default.findById(id);
            if (!existingVaccine) {
                res.status(404).json({
                    success: false,
                    message: "Vaccine not found",
                    error: "Vaccine with this ID does not exist"
                });
                return;
            }
            if (updateData.name && updateData.name !== existingVaccine.name) {
                const duplicateVaccine = await vaccinesModel_1.default.findOne({
                    name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
                    _id: { $ne: id }
                });
                if (duplicateVaccine) {
                    res.status(409).json({
                        success: false,
                        message: "Vaccine with this name already exists",
                        error: "Duplicate vaccine name"
                    });
                    return;
                }
            }
            const updatedVaccine = await vaccinesModel_1.default.findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true, runValidators: true });
            res.status(200).json({
                success: true,
                message: "Vaccine updated successfully",
                data: updatedVaccine
            });
        }
        catch (error) {
            console.error("Error updating vaccine:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update vaccine",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async deleteVaccine(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid vaccine ID format",
                    error: "Invalid ID format"
                });
                return;
            }
            const vaccine = await vaccinesModel_1.default.findById(id);
            if (!vaccine) {
                res.status(404).json({
                    success: false,
                    message: "Vaccine not found",
                    error: "Vaccine with this ID does not exist"
                });
                return;
            }
            await vaccinesModel_1.default.findByIdAndDelete(id);
            res.status(200).json({
                success: true,
                message: "Vaccine deleted successfully",
                data: { id: vaccine._id, name: vaccine.name }
            });
        }
        catch (error) {
            console.error("Error deleting vaccine:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete vaccine",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getVaccineByVaccineId(req, res) {
        try {
            const { vaccineId } = req.params;
            const vaccine = await vaccinesModel_1.default.findOne({ vaccineId });
            if (!vaccine) {
                res.status(404).json({
                    success: false,
                    message: "Vaccine not found",
                    error: "Vaccine with this vaccineId does not exist"
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Vaccine retrieved successfully",
                data: vaccine
            });
        }
        catch (error) {
            console.error("Error fetching vaccine by vaccineId:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch vaccine",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}
exports.VaccinationController = VaccinationController;
//# sourceMappingURL=vaccineController.js.map