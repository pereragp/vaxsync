"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadVaccinationCertificate = exports.deleteVaccinationFromHealthCard = exports.getHealthCardWithVaccinations = exports.syncCompletedVaccinesToHealthCard = exports.getAllHealthCardsByUserId = exports.getHealthCardByDependentId = exports.getHealthCardByUserId = exports.createHealthCardsForUserAndDependents = exports.createDependentHealthCard = exports.createUserHealthCard = exports.syncVaccinesToHealthCard = void 0;
const healthcardModel_1 = __importDefault(require("../../models/healthCard/healthcardModel"));
const user_1 = __importDefault(require("../../models/userModels/user"));
const dependent_1 = __importDefault(require("../../models/userModels/dependent"));
const vaccineScheduleModel_1 = __importDefault(require("../../models/scheduleModels/vaccineScheduleModel"));
const mongoose_1 = require("mongoose");
const vaccinationCertificateService_1 = require("../../services/vaccinationCertificateService");
const syncVaccinesToHealthCard = async (scheduleId) => {
    try {
        const schedule = await vaccineScheduleModel_1.default.findById(scheduleId).populate('vaccineId', 'name manufacturer');
        if (!schedule) {
            console.log(`Schedule ${scheduleId} not found for sync`);
            return;
        }
        const completedDoses = schedule.doses.filter(dose => dose.status === 'completed');
        if (completedDoses.length === 0) {
            console.log(`No completed doses found in schedule ${scheduleId}`);
            return;
        }
        const vaccinationData = completedDoses.map(dose => ({
            vaccineName: schedule.vaccineName,
            manufacturer: schedule.vaccineId?.manufacturer || 'Unknown',
            doseNumber: dose.doseNumber,
            totalDoses: schedule.totalDoses,
            dateCompleted: dose.dateCompleted || new Date(),
            administeredBy: schedule.healthcareProvider?.name || 'Unknown',
            facility: 'Health Center',
            certificateNumber: `CERT-${Date.now()}-${dose.doseNumber}`,
            notes: dose.notes || ''
        }));
        const isUserSchedule = !schedule.dependentIds || schedule.dependentIds.length === 0;
        if (isUserSchedule) {
            const userHealthCard = await healthcardModel_1.default.findOne({
                userId: schedule.userId,
                cardType: "user"
            });
            if (userHealthCard) {
                const existingVaccinations = userHealthCard.completedVaccinations || [];
                const newVaccinations = vaccinationData.filter(newVaccine => !existingVaccinations.some(existing => existing.vaccineName === newVaccine.vaccineName &&
                    existing.doseNumber === newVaccine.doseNumber));
                userHealthCard.completedVaccinations = [...existingVaccinations, ...newVaccinations];
                await userHealthCard.save();
                console.log(`Synced ${newVaccinations.length} vaccines to user health card ${userHealthCard._id}`);
            }
        }
        else {
            for (const dependentId of schedule.dependentIds || []) {
                const dependentHealthCard = await healthcardModel_1.default.findOne({
                    dependentId: dependentId,
                    cardType: "dependent"
                });
                if (dependentHealthCard) {
                    const existingVaccinations = dependentHealthCard.completedVaccinations || [];
                    const newVaccinations = vaccinationData.filter(newVaccine => !existingVaccinations.some(existing => existing.vaccineName === newVaccine.vaccineName &&
                        existing.doseNumber === newVaccine.doseNumber));
                    dependentHealthCard.completedVaccinations = [...existingVaccinations, ...newVaccinations];
                    await dependentHealthCard.save();
                    console.log(`Synced ${newVaccinations.length} vaccines to dependent health card ${dependentHealthCard._id}`);
                }
            }
        }
    }
    catch (error) {
        console.error(`Error syncing vaccines to health card for schedule ${scheduleId}:`, error);
    }
};
exports.syncVaccinesToHealthCard = syncVaccinesToHealthCard;
const createUserHealthCard = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await user_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const existingCard = await healthcardModel_1.default.findOne({ userId, cardType: "user" });
        if (existingCard) {
            return res.status(400).json({
                message: "Health card already exists for this user",
                healthCard: existingCard
            });
        }
        const dependents = await dependent_1.default.find({ guardianId: userId });
        const dependentsData = [];
        if (dependents && dependents.length > 0) {
            for (const dependent of dependents) {
                const dependentData = {
                    _id: dependent._id,
                    dependentId: dependent._id,
                    fullName: `${dependent.firstName} ${dependent.lastName}`,
                    dateOfBirth: dependent.dateOfBirth,
                    gender: dependent.gender,
                    dependentType: dependent.dependentType
                };
                dependentsData.push(dependentData);
            }
        }
        const healthCard = new healthcardModel_1.default({
            fullName: `${user.firstName} ${user.lastName}`,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            userId: user._id,
            cardType: "user",
            dependents: dependentsData
        });
        const savedHealthCard = await healthCard.save();
        return res.status(201).json({
            message: "Health card created successfully",
            healthCard: savedHealthCard
        });
    }
    catch (error) {
        console.error("Error creating user health card:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.createUserHealthCard = createUserHealthCard;
const createDependentHealthCard = async (req, res) => {
    try {
        const { dependentId } = req.params;
        const dependent = await dependent_1.default.findById(dependentId);
        if (!dependent) {
            return res.status(404).json({ message: "Dependent not found" });
        }
        const existingCard = await healthcardModel_1.default.findOne({ dependentId, cardType: "dependent" });
        if (existingCard) {
            return res.status(400).json({
                message: "Health card already exists for this dependent",
                healthCard: existingCard
            });
        }
        const healthCard = new healthcardModel_1.default({
            fullName: `${dependent.firstName} ${dependent.lastName}`,
            gender: dependent.gender,
            dateOfBirth: dependent.dateOfBirth,
            dependentId: dependent._id,
            cardType: "dependent"
        });
        const savedHealthCard = await healthCard.save();
        return res.status(201).json({
            message: "Health card created successfully for dependent",
            healthCard: savedHealthCard
        });
    }
    catch (error) {
        console.error("Error creating dependent health card:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.createDependentHealthCard = createDependentHealthCard;
const createHealthCardsForUserAndDependents = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await user_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const createdCards = [];
        const existingCards = [];
        const dependents = await dependent_1.default.find({ guardianId: userId });
        const dependentsData = [];
        if (dependents && dependents.length > 0) {
            for (const dependent of dependents) {
                const dependentData = {
                    _id: dependent._id,
                    dependentId: dependent._id,
                    fullName: `${dependent.firstName} ${dependent.lastName}`,
                    dateOfBirth: dependent.dateOfBirth,
                    gender: dependent.gender,
                    dependentType: dependent.dependentType
                };
                dependentsData.push(dependentData);
            }
        }
        const existingUserCard = await healthcardModel_1.default.findOne({ userId, cardType: "user" });
        if (!existingUserCard) {
            const userHealthCard = new healthcardModel_1.default({
                fullName: `${user.firstName} ${user.lastName}`,
                gender: user.gender,
                dateOfBirth: user.dateOfBirth,
                userId: user._id,
                cardType: "user",
                dependents: dependentsData
            });
            const savedUserCard = await userHealthCard.save();
            createdCards.push(savedUserCard);
        }
        else {
            existingCards.push(existingUserCard);
        }
        if (dependents && dependents.length > 0) {
            for (const dependent of dependents) {
                const existingDependentCard = await healthcardModel_1.default.findOne({
                    dependentId: dependent._id,
                    cardType: "dependent"
                });
                if (!existingDependentCard) {
                    const dependentHealthCard = new healthcardModel_1.default({
                        fullName: `${dependent.firstName} ${dependent.lastName}`,
                        gender: dependent.gender,
                        dateOfBirth: dependent.dateOfBirth,
                        dependentId: dependent._id,
                        cardType: "dependent"
                    });
                    const savedDependentCard = await dependentHealthCard.save();
                    createdCards.push(savedDependentCard);
                }
                else {
                    existingCards.push(existingDependentCard);
                }
            }
        }
        return res.status(201).json({
            message: "Health cards processing completed",
            createdCards: createdCards,
            existingCards: existingCards,
            summary: {
                totalCreated: createdCards.length,
                totalExisting: existingCards.length
            }
        });
    }
    catch (error) {
        console.error("Error creating health cards:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.createHealthCardsForUserAndDependents = createHealthCardsForUserAndDependents;
const getHealthCardByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const healthCard = await healthcardModel_1.default.findOne({ userId, cardType: "user" });
        if (!healthCard) {
            return res.status(404).json({ message: "Health card not found for this user" });
        }
        return res.status(200).json({
            message: "Health card retrieved successfully",
            healthCard
        });
    }
    catch (error) {
        console.error("Error retrieving health card:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.getHealthCardByUserId = getHealthCardByUserId;
const getHealthCardByDependentId = async (req, res) => {
    try {
        const { dependentId } = req.params;
        const healthCard = await healthcardModel_1.default.findOne({ dependentId, cardType: "dependent" });
        if (!healthCard) {
            return res.status(404).json({ message: "Health card not found for this dependent" });
        }
        return res.status(200).json({
            message: "Health card retrieved successfully",
            healthCard
        });
    }
    catch (error) {
        console.error("Error retrieving dependent health card:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.getHealthCardByDependentId = getHealthCardByDependentId;
const getAllHealthCardsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await user_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const healthCards = [];
        const userHealthCard = await healthcardModel_1.default.findOne({ userId, cardType: "user" });
        if (userHealthCard) {
            healthCards.push(userHealthCard);
        }
        const dependents = await dependent_1.default.find({ guardianId: userId });
        if (dependents && dependents.length > 0) {
            for (const dependent of dependents) {
                const dependentHealthCard = await healthcardModel_1.default.findOne({
                    dependentId: dependent._id,
                    cardType: "dependent"
                });
                if (dependentHealthCard) {
                    healthCards.push(dependentHealthCard);
                }
            }
        }
        return res.status(200).json({
            message: "Health cards retrieved successfully",
            healthCards,
            count: healthCards.length
        });
    }
    catch (error) {
        console.error("Error retrieving health cards:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.getAllHealthCardsByUserId = getAllHealthCardsByUserId;
const syncCompletedVaccinesToHealthCard = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await user_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const completedSchedules = await vaccineScheduleModel_1.default.find({
            userId: new mongoose_1.Types.ObjectId(userId),
            overallStatus: "completed"
        }).populate('vaccineId', 'name manufacturer');
        const syncResults = [];
        const userSchedules = completedSchedules.filter(schedule => !schedule.dependentIds || schedule.dependentIds.length === 0);
        if (userSchedules.length > 0) {
            const userHealthCard = await healthcardModel_1.default.findOne({
                userId: new mongoose_1.Types.ObjectId(userId),
                cardType: "user"
            });
            if (userHealthCard) {
                const completedVaccines = [];
                for (const schedule of userSchedules) {
                    const completedDoses = schedule.doses.filter(dose => dose.status === 'completed');
                    for (const dose of completedDoses) {
                        completedVaccines.push({
                            vaccineName: schedule.vaccineName,
                            manufacturer: schedule.vaccineId?.manufacturer || 'Unknown',
                            doseNumber: dose.doseNumber,
                            totalDoses: schedule.totalDoses,
                            dateCompleted: dose.dateCompleted || new Date(),
                            administeredBy: schedule.healthcareProvider?.name || 'Unknown',
                            facility: 'Health Center',
                            certificateNumber: `CERT-${Date.now()}-${dose.doseNumber}`,
                            notes: dose.notes || ''
                        });
                    }
                }
                userHealthCard.completedVaccinations = completedVaccines;
                await userHealthCard.save();
                syncResults.push({
                    cardType: 'user',
                    cardId: userHealthCard._id,
                    vaccinesAdded: completedVaccines.length
                });
            }
        }
        const dependentSchedules = completedSchedules.filter(schedule => schedule.dependentIds && schedule.dependentIds.length > 0);
        for (const schedule of dependentSchedules) {
            for (const dependentId of schedule.dependentIds || []) {
                const dependentHealthCard = await healthcardModel_1.default.findOne({
                    dependentId: dependentId,
                    cardType: "dependent"
                });
                if (dependentHealthCard) {
                    const completedDoses = schedule.doses.filter(dose => dose.status === 'completed');
                    const completedVaccines = [];
                    for (const dose of completedDoses) {
                        completedVaccines.push({
                            vaccineName: schedule.vaccineName,
                            manufacturer: schedule.vaccineId?.manufacturer || 'Unknown',
                            doseNumber: dose.doseNumber,
                            totalDoses: schedule.totalDoses,
                            dateCompleted: dose.dateCompleted || new Date(),
                            administeredBy: schedule.healthcareProvider?.name || 'Unknown',
                            facility: 'Health Center',
                            certificateNumber: `CERT-${Date.now()}-${dose.doseNumber}`,
                            notes: dose.notes || ''
                        });
                    }
                    dependentHealthCard.completedVaccinations = completedVaccines;
                    await dependentHealthCard.save();
                    syncResults.push({
                        cardType: 'dependent',
                        cardId: dependentHealthCard._id,
                        dependentId: dependentId,
                        vaccinesAdded: completedVaccines.length
                    });
                }
            }
        }
        return res.status(200).json({
            message: "Vaccination sync completed successfully",
            syncResults,
            summary: {
                totalCardsUpdated: syncResults.length,
                totalVaccinesSynced: syncResults.reduce((sum, result) => sum + result.vaccinesAdded, 0)
            }
        });
    }
    catch (error) {
        console.error("Error syncing vaccines to health card:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.syncCompletedVaccinesToHealthCard = syncCompletedVaccinesToHealthCard;
const getHealthCardWithVaccinations = async (req, res) => {
    try {
        const { cardId } = req.params;
        const healthCard = await healthcardModel_1.default.findById(cardId);
        if (!healthCard) {
            return res.status(404).json({ message: "Health card not found" });
        }
        const completedVaccinations = healthCard.completedVaccinations || [];
        const vaccinationStats = {
            totalVaccinations: completedVaccinations.length,
            lastVaccinationDate: completedVaccinations.length > 0
                ? completedVaccinations.reduce((latest, vaccine) => new Date(vaccine.dateCompleted) > new Date(latest.dateCompleted) ? vaccine : latest).dateCompleted
                : null,
            vaccinesByType: completedVaccinations.reduce((acc, vaccine) => {
                acc[vaccine.vaccineName] = (acc[vaccine.vaccineName] || 0) + 1;
                return acc;
            }, {})
        };
        return res.status(200).json({
            message: "Health card with vaccinations retrieved successfully",
            healthCard,
            vaccinationStats
        });
    }
    catch (error) {
        console.error("Error retrieving health card with vaccinations:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.getHealthCardWithVaccinations = getHealthCardWithVaccinations;
const deleteVaccinationFromHealthCard = async (req, res) => {
    try {
        const { cardId, vaccineName, doseNumber } = req.params;
        const healthCard = await healthcardModel_1.default.findById(cardId);
        if (!healthCard) {
            return res.status(404).json({ message: "Health card not found" });
        }
        if (!healthCard.completedVaccinations || healthCard.completedVaccinations.length === 0) {
            return res.status(404).json({ message: "No vaccinations found in this health card" });
        }
        const decodedVaccineName = decodeURIComponent(vaccineName);
        const vaccinationIndex = healthCard.completedVaccinations.findIndex(vaccination => vaccination.vaccineName === decodedVaccineName &&
            vaccination.doseNumber === parseInt(doseNumber));
        if (vaccinationIndex === -1) {
            return res.status(404).json({
                message: `Vaccination not found: ${decodedVaccineName} dose ${doseNumber}`
            });
        }
        const deletedVaccination = healthCard.completedVaccinations[vaccinationIndex];
        healthCard.completedVaccinations.splice(vaccinationIndex, 1);
        await healthCard.save();
        return res.status(200).json({
            message: "Vaccination deleted successfully",
            deletedVaccination: {
                vaccineName: deletedVaccination.vaccineName,
                doseNumber: deletedVaccination.doseNumber,
                dateCompleted: deletedVaccination.dateCompleted
            },
            remainingVaccinations: healthCard.completedVaccinations.length
        });
    }
    catch (error) {
        console.error("Error deleting vaccination from health card:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.deleteVaccinationFromHealthCard = deleteVaccinationFromHealthCard;
const downloadVaccinationCertificate = async (req, res) => {
    try {
        const { cardId } = req.params;
        const healthCard = await healthcardModel_1.default.findById(cardId);
        if (!healthCard) {
            return res.status(404).json({ message: "Health card not found" });
        }
        if (!healthCard.completedVaccinations || healthCard.completedVaccinations.length === 0) {
            return res.status(404).json({ message: "No vaccinations found to generate certificate" });
        }
        const certificateData = {
            healthCard: healthCard,
            generatedAt: new Date(),
            certificateId: vaccinationCertificateService_1.VaccinationCertificateService.generateCertificateId(healthCard._id.toString())
        };
        const pdfBuffer = await vaccinationCertificateService_1.VaccinationCertificateService.generateCertificate(certificateData);
        const fileName = `vaccination-certificate-${healthCard.fullName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        return res.send(pdfBuffer);
    }
    catch (error) {
        console.error("Error generating vaccination certificate:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.downloadVaccinationCertificate = downloadVaccinationCertificate;
//# sourceMappingURL=healthCardController.js.map