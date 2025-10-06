"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleController = void 0;
const vaccineScheduleModel_1 = __importDefault(require("../../models/scheduleModels/vaccineScheduleModel"));
const vaccinesModel_1 = __importDefault(require("../../models/scheduleModels/vaccinesModel"));
const dependent_1 = __importDefault(require("../../models/userModels/dependent"));
const mongoose_1 = require("mongoose");
const healthCardController_1 = require("../healthCard/healthCardController");
class ScheduleController {
    static async createVaccineSchedule(req, res) {
        try {
            const { vaccineId, vaccineName, totalDoses, interval, dependentId, healthcareProvider, notes, scheduleDate } = req.body;
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
                return;
            }
            let vaccineData = null;
            if (vaccineId) {
                vaccineData = await vaccinesModel_1.default.findById(vaccineId);
                if (!vaccineData) {
                    res.status(404).json({
                        success: false,
                        message: "Vaccine not found"
                    });
                    return;
                }
            }
            let dependentIds = [];
            if (dependentId) {
                const dependent = await dependent_1.default.findOne({
                    _id: dependentId,
                    guardianId: userId
                });
                if (!dependent) {
                    res.status(404).json({
                        success: false,
                        message: "Dependent not found or not authorized"
                    });
                    return;
                }
                dependentIds = [new mongoose_1.Types.ObjectId(dependentId)];
            }
            const startDate = scheduleDate ? new Date(scheduleDate) : new Date();
            const vaccinationRecord = new vaccineScheduleModel_1.default({
                userId,
                dependentIds,
                vaccineId: vaccineId || null,
                vaccineName: vaccineName || vaccineData?.name,
                totalDoses,
                interval,
                healthcareProvider: healthcareProvider ? { name: healthcareProvider } : undefined,
                notes,
                doses: Array.from({ length: totalDoses }, (_, index) => ({
                    doseNumber: index + 1,
                    dateScheduled: new Date(startDate.getTime() + (index * interval * 24 * 60 * 60 * 1000)),
                    status: "scheduled"
                }))
            });
            const savedRecord = await vaccinationRecord.save();
            res.status(201).json({
                success: true,
                message: "Vaccine schedule created successfully",
                data: savedRecord
            });
        }
        catch (error) {
            console.error("Error creating vaccine schedule:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create vaccine schedule",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getAllVaccineSchedules(req, res) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
                return;
            }
            const { page = 1, limit = 10, dependentId, overallStatus, vaccineName } = req.query;
            const filter = { userId };
            if (dependentId) {
                filter.dependentIds = { $in: [dependentId] };
            }
            if (overallStatus) {
                filter.overallStatus = overallStatus;
            }
            if (vaccineName) {
                filter.vaccineName = { $regex: vaccineName, $options: 'i' };
            }
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const schedules = await vaccineScheduleModel_1.default.find(filter)
                .populate('vaccineId', 'name manufacturer type')
                .populate('dependentIds', 'firstName lastName dateOfBirth gender dependentType')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean();
            const totalSchedules = await vaccineScheduleModel_1.default.countDocuments(filter);
            const totalPages = Math.ceil(totalSchedules / limitNum);
            res.status(200).json({
                success: true,
                message: "Vaccine schedules retrieved successfully",
                data: schedules,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalRecords: totalSchedules,
                    hasNextPage: pageNum < totalPages,
                    hasPreviousPage: pageNum > 1
                }
            });
        }
        catch (error) {
            console.error("Error fetching vaccine schedules:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch vaccine schedules",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async updateVaccineSchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const { vaccineName, healthcareProvider, notes, scheduleDate, interval, doses } = req.body;
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
                return;
            }
            if (!mongoose_1.Types.ObjectId.isValid(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid schedule ID format"
                });
                return;
            }
            const existingSchedule = await vaccineScheduleModel_1.default.findOne({
                _id: scheduleId,
                userId
            });
            if (!existingSchedule) {
                res.status(404).json({
                    success: false,
                    message: "Schedule not found or not authorized"
                });
                return;
            }
            const updateData = {
                updatedAt: new Date()
            };
            if (vaccineName)
                updateData.vaccineName = vaccineName;
            if (healthcareProvider)
                updateData.healthcareProvider = healthcareProvider;
            if (notes !== undefined)
                updateData.notes = notes;
            if (interval !== undefined)
                updateData.interval = interval;
            if (doses && Array.isArray(doses)) {
                updateData.doses = doses;
            }
            else if (scheduleDate || interval !== undefined) {
                const startDate = scheduleDate ? new Date(scheduleDate) : new Date(existingSchedule.doses[0].dateScheduled);
                const intervalDays = interval !== undefined ? interval : existingSchedule.interval;
                updateData.doses = existingSchedule.doses.map((dose, index) => ({
                    ...dose.toObject(),
                    dateScheduled: new Date(startDate.getTime() + (index * intervalDays * 24 * 60 * 60 * 1000))
                }));
            }
            const updatedSchedule = await vaccineScheduleModel_1.default.findByIdAndUpdate(scheduleId, updateData, { new: true, runValidators: true }).populate('vaccineId', 'name manufacturer type')
                .populate('dependentIds', 'firstName lastName dateOfBirth gender dependentType');
            if (updateData.overallStatus === 'completed') {
                console.log(`Schedule ${scheduleId} marked as completed, triggering health card sync`);
                await (0, healthCardController_1.syncVaccinesToHealthCard)(scheduleId);
            }
            res.status(200).json({
                success: true,
                message: "Vaccine schedule updated successfully",
                data: updatedSchedule
            });
        }
        catch (error) {
            console.error("Error updating vaccine schedule:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update vaccine schedule",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async updateDoseStatus(req, res) {
        try {
            const { scheduleId, doseNumber } = req.params;
            const { status, dateCompleted, notes } = req.body;
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
                return;
            }
            if (!mongoose_1.Types.ObjectId.isValid(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid schedule ID format"
                });
                return;
            }
            const schedule = await vaccineScheduleModel_1.default.findOne({
                _id: scheduleId,
                userId
            });
            if (!schedule) {
                res.status(404).json({
                    success: false,
                    message: "Schedule not found or not authorized"
                });
                return;
            }
            const doseIndex = schedule.doses.findIndex(dose => dose.doseNumber === parseInt(doseNumber));
            if (doseIndex === -1) {
                res.status(404).json({
                    success: false,
                    message: "Dose not found"
                });
                return;
            }
            schedule.doses[doseIndex].status = status;
            if (dateCompleted) {
                schedule.doses[doseIndex].dateCompleted = new Date(dateCompleted);
            }
            if (notes) {
                schedule.doses[doseIndex].notes = notes;
            }
            const allCompleted = schedule.doses.every(dose => dose.status === 'completed');
            const allCancelled = schedule.doses.every(dose => dose.status === 'cancelled');
            const hasActiveOrCompletedDose = schedule.doses.some(dose => dose.status === 'completed' || dose.status === 'scheduled' || dose.status === 'missed');
            if (allCompleted) {
                schedule.overallStatus = 'completed';
            }
            else if (allCancelled) {
                schedule.overallStatus = 'cancelled';
            }
            else {
                schedule.overallStatus = 'in_progress';
            }
            await schedule.save();
            if (status === 'completed') {
                console.log(`Dose ${doseNumber} completed, triggering health card sync for schedule ${scheduleId}`);
                await (0, healthCardController_1.syncVaccinesToHealthCard)(scheduleId);
            }
            res.status(200).json({
                success: true,
                message: "Dose status updated successfully",
                data: schedule
            });
        }
        catch (error) {
            console.error("Error updating dose status:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update dose status",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async addDoseToSchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const { intervalDays, notes } = req.body;
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
                return;
            }
            if (!mongoose_1.Types.ObjectId.isValid(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid schedule ID format"
                });
                return;
            }
            const schedule = await vaccineScheduleModel_1.default.findOne({
                _id: scheduleId,
                userId
            });
            if (!schedule) {
                res.status(404).json({
                    success: false,
                    message: "Schedule not found or not authorized"
                });
                return;
            }
            const lastDose = schedule.doses[schedule.doses.length - 1];
            const lastDoseDate = new Date(lastDose.dateScheduled);
            const newDoseDate = new Date(lastDoseDate);
            newDoseDate.setDate(newDoseDate.getDate() + intervalDays);
            const newDoseNumber = schedule.doses.length + 1;
            const newDose = {
                doseNumber: newDoseNumber,
                dateScheduled: newDoseDate,
                status: 'scheduled',
                notes: notes || undefined
            };
            schedule.doses.push(newDose);
            schedule.totalDoses = schedule.doses.length;
            const updatedSchedule = await schedule.save();
            res.status(200).json({
                success: true,
                message: `Dose ${newDoseNumber} added successfully`,
                data: updatedSchedule
            });
        }
        catch (error) {
            console.error("Error adding dose to schedule:", error);
            res.status(500).json({
                success: false,
                message: "Failed to add dose to schedule",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async deleteVaccineSchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
                return;
            }
            if (!mongoose_1.Types.ObjectId.isValid(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid schedule ID format"
                });
                return;
            }
            const schedule = await vaccineScheduleModel_1.default.findOne({
                _id: scheduleId,
                userId
            });
            if (!schedule) {
                res.status(404).json({
                    success: false,
                    message: "Schedule not found or not authorized"
                });
                return;
            }
            await vaccineScheduleModel_1.default.findByIdAndDelete(scheduleId);
            res.status(200).json({
                success: true,
                message: "Vaccine schedule deleted successfully",
                data: {
                    id: schedule._id,
                    vaccineName: schedule.vaccineName,
                    dependentIds: schedule.dependentIds
                }
            });
        }
        catch (error) {
            console.error("Error deleting vaccine schedule:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete vaccine schedule",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}
exports.ScheduleController = ScheduleController;
//# sourceMappingURL=scheduleController.js.map