"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleController = void 0;
const vaccineScheduleModel_1 = __importDefault(require("../../models/scheduleModels/vaccineScheduleModel"));
const vaccinesModel_1 = __importDefault(require("../../models/scheduleModels/vaccinesModel"));
const user_1 = __importDefault(require("../../models/userModels/user"));
const digitalHealthCard_1 = __importDefault(require("../../models/reportModels/digitalHealthCard"));
const mongoose_1 = __importDefault(require("mongoose"));
class ScheduleController {
    static async syncCompletedDoseToHealthCard(userId, schedule, completedDose) {
        try {
            let healthCard = await digitalHealthCard_1.default.findOne({ userId });
            if (!healthCard) {
                const user = await user_1.default.findById(userId);
                if (!user) {
                    console.error('User not found for health card creation');
                    return;
                }
                healthCard = new digitalHealthCard_1.default({
                    userId,
                    userInfo: {
                        fullName: user.name || 'Unknown User',
                        dateOfBirth: user.dateOfBirth,
                        profilePicture: user.avatar || '',
                        bloodType: '',
                        emergencyContact: {
                            name: '',
                            phone: user.phone || ''
                        }
                    },
                    completedVaccinations: []
                });
            }
            const certificateNumber = `VAC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            const vaccinationData = {
                vaccineName: schedule.vaccineName,
                manufacturer: schedule.manufacturer || 'Unknown',
                batchNumber: `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                doseNumber: completedDose.doseNumber,
                totalDoses: schedule.totalDoses,
                dateScheduled: completedDose.dateCompleted || completedDose.dateScheduled,
                administeredBy: schedule.healthcareProvider?.name || 'Unknown Provider',
                facility: schedule.healthcareProvider?.facility || 'Unknown Facility',
                certificateNumber: certificateNumber,
                nextDueDate: completedDose.doseNumber < schedule.totalDoses ?
                    new Date(completedDose.dateScheduled.getTime() + (schedule.interval * 24 * 60 * 60 * 1000)) :
                    null
            };
            healthCard.addCompletedVaccination(vaccinationData);
            await healthCard.save();
            console.log(`✅ Completed dose ${completedDose.doseNumber} of ${schedule.vaccineName} synced to health card`);
        }
        catch (error) {
            console.error('Error syncing completed dose to health card:', error);
        }
    }
    static async getAvailableVaccines(req, res) {
        try {
            const { page = 1, limit = 10, type, search } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const filter = { isActive: true };
            if (type) {
                filter.type = type;
            }
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { manufacturer: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }
            const vaccines = await vaccinesModel_1.default.find(filter)
                .select('vaccineId name description manufacturer type ageGroups sideEffects contraindications')
                .sort({ name: 1 })
                .skip(skip)
                .limit(limitNum);
            const total = await vaccinesModel_1.default.countDocuments(filter);
            const pagination = {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalRecords: total,
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPreviousPage: pageNum > 1
            };
            res.status(200).json({
                success: true,
                message: 'Vaccines retrieved successfully',
                data: vaccines,
                pagination
            });
        }
        catch (error) {
            console.error('Error fetching vaccines:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getVaccineById(req, res) {
        try {
            const { vaccineId } = req.params;
            if (!mongoose_1.default.Types.ObjectId.isValid(vaccineId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid vaccine ID format'
                });
                return;
            }
            const vaccine = await vaccinesModel_1.default.findById(vaccineId).select('-__v');
            if (!vaccine) {
                res.status(404).json({
                    success: false,
                    message: 'Vaccine not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Vaccine retrieved successfully',
                data: vaccine
            });
        }
        catch (error) {
            console.error('Error fetching vaccine:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async createSchedule(req, res) {
        try {
            const { vaccineId, vaccineName, manufacturer, totalDoses, interval, dateScheduled, notes, healthcareProvider } = req.body;
            const userId = req.user?.userId || '66b1234567890abcdef12345';
            if (!dateScheduled) {
                res.status(400).json({
                    success: false,
                    message: 'dateScheduled is required'
                });
                return;
            }
            let vaccineData = {};
            let scheduleData = {};
            if (vaccineId) {
                if (!mongoose_1.default.Types.ObjectId.isValid(vaccineId)) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid vaccine ID format'
                    });
                    return;
                }
                const vaccine = await vaccinesModel_1.default.findById(vaccineId);
                if (!vaccine) {
                    res.status(404).json({
                        success: false,
                        message: 'Suggested vaccine not found'
                    });
                    return;
                }
                const user = await user_1.default.findById(userId);
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                    return;
                }
                const userAge = new Date().getFullYear() - user.dateOfBirth.getFullYear();
                const ageGroup = vaccine.ageGroups.find(ag => userAge >= ag.minAge && userAge <= ag.maxAge);
                if (!ageGroup) {
                    res.status(400).json({
                        success: false,
                        message: 'This vaccine is not suitable for your age group'
                    });
                    return;
                }
                vaccineData = {
                    vaccineId,
                    vaccineName: vaccine.name,
                    manufacturer: vaccine.manufacturer,
                    totalDoses: ageGroup.doses,
                    interval: ageGroup.interval
                };
                scheduleData = {
                    userId,
                    vaccineId,
                    vaccineName: vaccine.name,
                    totalDoses: ageGroup.doses,
                    interval: ageGroup.interval
                };
                const existingRecord = await vaccineScheduleModel_1.default.findOne({
                    userId,
                    vaccineId,
                    status: { $in: ['scheduled', 'completed'] }
                });
                if (existingRecord) {
                    res.status(400).json({
                        success: false,
                        message: 'This suggested vaccine is already scheduled or completed'
                    });
                    return;
                }
            }
            else {
                if (!vaccineName || !manufacturer || !totalDoses || interval === undefined) {
                    res.status(400).json({
                        success: false,
                        message: 'For manual entry, vaccineName, manufacturer, totalDoses, and interval are required'
                    });
                    return;
                }
                if (totalDoses < 1 || totalDoses > 10) {
                    res.status(400).json({
                        success: false,
                        message: 'Total doses must be between 1 and 10'
                    });
                    return;
                }
                if (interval < 0) {
                    res.status(400).json({
                        success: false,
                        message: 'Interval cannot be negative'
                    });
                    return;
                }
                vaccineData = {
                    vaccineName,
                    manufacturer,
                    totalDoses,
                    interval
                };
                scheduleData = {
                    userId,
                    vaccineName,
                    totalDoses,
                    interval
                };
                const existingRecord = await vaccineScheduleModel_1.default.findOne({
                    userId,
                    vaccineName: { $regex: new RegExp(vaccineName, 'i') },
                    status: { $in: ['scheduled', 'completed'] }
                });
                if (existingRecord) {
                    res.status(400).json({
                        success: false,
                        message: 'A similar vaccine is already scheduled or completed'
                    });
                    return;
                }
            }
            const scheduledDate = new Date(dateScheduled);
            const doses = [];
            for (let doseNumber = 1; doseNumber <= vaccineData.totalDoses; doseNumber++) {
                const doseDate = new Date(scheduledDate);
                doseDate.setDate(doseDate.getDate() + (doseNumber - 1) * vaccineData.interval);
                doses.push({
                    doseNumber,
                    dateScheduled: doseDate,
                    status: 'scheduled',
                    notes: notes || ''
                });
            }
            const schedule = new vaccineScheduleModel_1.default({
                ...scheduleData,
                interval: vaccineData.interval,
                doses,
                overallStatus: 'in_progress',
                healthcareProvider: {
                    name: healthcareProvider?.name || '',
                    facility: healthcareProvider?.facility || '',
                    contact: healthcareProvider?.contact || ''
                }
            });
            const savedSchedule = await schedule.save();
            res.status(201).json({
                success: true,
                message: 'Vaccination schedule created successfully',
                data: {
                    schedule: savedSchedule,
                    vaccine: vaccineData
                }
            });
        }
        catch (error) {
            console.error('Error creating schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getScheduleById(req, res) {
        try {
            const { scheduleId } = req.params;
            const userId = req.user?.userId || '66b1234567890abcdef12345';
            if (!mongoose_1.default.Types.ObjectId.isValid(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid schedule ID format'
                });
                return;
            }
            const schedule = await vaccineScheduleModel_1.default.findOne({
                _id: scheduleId,
                userId
            }).populate('vaccineId', 'name manufacturer type ageGroups');
            if (!schedule) {
                res.status(404).json({
                    success: false,
                    message: 'Schedule not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Schedule retrieved successfully',
                data: schedule
            });
        }
        catch (error) {
            console.error('Error getting schedule by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getUserSchedules(req, res) {
        try {
            const { page = 1, limit = 10, status, vaccineName } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const userId = req.user?.userId || '66b1234567890abcdef12345';
            const filter = { userId };
            if (status) {
                filter.status = status;
            }
            if (vaccineName) {
                filter.vaccineName = { $regex: vaccineName, $options: 'i' };
            }
            const schedules = await vaccineScheduleModel_1.default.find(filter)
                .populate('vaccineId', 'name manufacturer type')
                .sort({ dateScheduled: 1 })
                .skip(skip)
                .limit(limitNum);
            const total = await vaccineScheduleModel_1.default.countDocuments(filter);
            const pagination = {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalRecords: total,
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPreviousPage: pageNum > 1
            };
            res.status(200).json({
                success: true,
                message: 'Schedules retrieved successfully',
                data: schedules,
                pagination
            });
        }
        catch (error) {
            console.error('Error fetching schedules:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async updateSchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const { dateScheduled, status, notes, healthcareProvider } = req.body;
            const userId = req.user?.userId || '66b1234567890abcdef12345';
            if (!mongoose_1.default.Types.ObjectId.isValid(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid schedule ID format'
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
                    message: 'Schedule not found'
                });
                return;
            }
            if (notes !== undefined) {
                schedule.notes = notes;
            }
            if (healthcareProvider) {
                schedule.healthcareProvider = {
                    ...schedule.healthcareProvider,
                    ...healthcareProvider
                };
            }
            if (status === 'completed') {
            }
            await schedule.save();
            res.status(200).json({
                success: true,
                message: 'Schedule updated successfully',
                data: schedule
            });
        }
        catch (error) {
            console.error('Error updating schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async updateDoseStatus(req, res) {
        try {
            const { scheduleId, doseNumber } = req.params;
            const { status, notes, dateCompleted } = req.body;
            const userId = req.user?.userId || '66b1234567890abcdef12345';
            if (!mongoose_1.default.Types.ObjectId.isValid(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid schedule ID format'
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
                    message: 'Schedule not found'
                });
                return;
            }
            const doseIndex = schedule.doses.findIndex(dose => dose.doseNumber === parseInt(doseNumber));
            if (doseIndex === -1) {
                res.status(404).json({
                    success: false,
                    message: 'Dose not found'
                });
                return;
            }
            if (status) {
                schedule.doses[doseIndex].status = status;
            }
            if (notes) {
                schedule.doses[doseIndex].notes = notes;
            }
            if (dateCompleted) {
                schedule.doses[doseIndex].dateCompleted = new Date(dateCompleted);
            }
            else if (status === 'completed') {
                schedule.doses[doseIndex].dateCompleted = new Date();
            }
            const allCompleted = schedule.doses.every(dose => dose.status === 'completed');
            const anyCancelled = schedule.doses.some(dose => dose.status === 'cancelled');
            if (allCompleted) {
                schedule.overallStatus = 'completed';
            }
            else if (anyCancelled) {
                schedule.overallStatus = 'cancelled';
            }
            else {
                schedule.overallStatus = 'in_progress';
            }
            await schedule.save();
            if (status === 'completed') {
                const completedDose = schedule.doses[doseIndex];
                await ScheduleController.syncCompletedDoseToHealthCard(userId, schedule, completedDose);
            }
            res.status(200).json({
                success: true,
                message: 'Dose status updated successfully',
                data: {
                    schedule,
                    updatedDose: schedule.doses[doseIndex]
                }
            });
        }
        catch (error) {
            console.error('Error updating dose status:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async deleteSchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const userId = req.user?.userId || '66b1234567890abcdef12345';
            if (!mongoose_1.default.Types.ObjectId.isValid(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid schedule ID format'
                });
                return;
            }
            const schedule = await vaccineScheduleModel_1.default.findOneAndDelete({
                _id: scheduleId,
                userId
            });
            if (!schedule) {
                res.status(404).json({
                    success: false,
                    message: 'Schedule not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Schedule deleted successfully',
                data: schedule
            });
        }
        catch (error) {
            console.error('Error deleting schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async syncAllCompletedDosesToHealthCard(req, res) {
        try {
            const userId = req.user?.userId || '66b1234567890abcdef12345';
            const schedules = await vaccineScheduleModel_1.default.find({ userId });
            let syncedCount = 0;
            for (const schedule of schedules) {
                const completedDoses = schedule.doses.filter(dose => dose.status === 'completed');
                for (const completedDose of completedDoses) {
                    await ScheduleController.syncCompletedDoseToHealthCard(userId, schedule, completedDose);
                    syncedCount++;
                }
            }
            res.status(200).json({
                success: true,
                message: `Successfully synced ${syncedCount} completed doses to health card`,
                data: { syncedCount }
            });
        }
        catch (error) {
            console.error('Error syncing completed doses:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getUpcomingSchedules(req, res) {
        try {
            const { days = 30 } = req.query;
            const daysNum = parseInt(days);
            const userId = req.user?.userId || '66b1234567890abcdef12345';
            const currentDate = new Date();
            const futureDate = new Date();
            futureDate.setDate(currentDate.getDate() + daysNum);
            const upcomingSchedules = await vaccineScheduleModel_1.default.find({
                userId,
                status: 'scheduled',
                dateScheduled: {
                    $gte: currentDate,
                    $lte: futureDate
                }
            })
                .populate('vaccineId', 'name manufacturer type')
                .sort({ dateScheduled: 1 });
            res.status(200).json({
                success: true,
                message: 'Upcoming schedules retrieved successfully',
                data: upcomingSchedules
            });
        }
        catch (error) {
            console.error('Error fetching upcoming schedules:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.ScheduleController = ScheduleController;
//# sourceMappingURL=scheduleController.js.map