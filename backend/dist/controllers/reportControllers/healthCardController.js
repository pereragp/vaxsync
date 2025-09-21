"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCardController = void 0;
const digitalHealthCard_1 = __importDefault(require("../../models/reportModels/digitalHealthCard"));
const vaccineScheduleModel_1 = __importDefault(require("../../models/scheduleModels/vaccineScheduleModel"));
const user_1 = __importDefault(require("../../models/userModels/user"));
class HealthCardController {
    static async getHealthCard(req, res) {
        try {
            const { userId } = req.params;
            let healthCard = await digitalHealthCard_1.default.findOne({
                userId,
                status: 'active'
            }).populate('userId', 'name email phone avatar');
            if (!healthCard) {
                const user = await user_1.default.findById(userId);
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                    return;
                }
                healthCard = await HealthCardController.createHealthCard(userId);
            }
            res.status(200).json({
                success: true,
                message: 'Health card retrieved successfully',
                data: {
                    healthCard
                }
            });
        }
        catch (error) {
            console.error('Get health card error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve health card',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async createHealthCard(userId) {
        try {
            const user = await user_1.default.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const completedVaccinations = await vaccineScheduleModel_1.default.find({
                userId,
                'doses.status': 'completed'
            }).sort({ createdAt: -1 });
            const healthCard = new digitalHealthCard_1.default({
                userId,
                userInfo: {
                    fullName: user.name,
                    dateOfBirth: user.dateOfBirth,
                    profilePicture: user.avatar || '',
                    emergencyContact: {
                        name: '',
                        phone: user.phone
                    }
                },
                completedVaccinations: []
            });
            for (const vaccination of completedVaccinations) {
                vaccination.doses.forEach((dose) => {
                    if (dose.status === 'completed') {
                        healthCard.completedVaccinations.push({
                            vaccineName: vaccination.vaccineName,
                            manufacturer: 'Unknown',
                            batchNumber: 'N/A',
                            doseNumber: dose.doseNumber,
                            totalDoses: vaccination.totalDoses,
                            dateScheduled: dose.dateScheduled,
                            administeredBy: vaccination.healthcareProvider?.name || 'Unknown',
                            facility: vaccination.healthcareProvider?.facility || 'Unknown',
                            certificateNumber: 'N/A',
                            nextDueDate: undefined
                        });
                    }
                });
            }
            return await healthCard.save();
        }
        catch (error) {
            throw error;
        }
    }
    static async updateHealthCard(req, res) {
        try {
            const { userId } = req.params;
            let healthCard = await digitalHealthCard_1.default.findOne({
                userId,
                status: 'active'
            });
            if (!healthCard) {
                healthCard = await HealthCardController.createHealthCard(userId);
            }
            else {
                const completedVaccinations = await vaccineScheduleModel_1.default.find({
                    userId,
                    'doses.status': 'completed'
                }).sort({ createdAt: -1 });
                if (healthCard) {
                    healthCard.completedVaccinations = [];
                    for (const vaccination of completedVaccinations) {
                        vaccination.doses.forEach((dose) => {
                            if (dose.status === 'completed' && healthCard) {
                                healthCard.completedVaccinations.push({
                                    vaccineName: vaccination.vaccineName,
                                    manufacturer: 'Unknown',
                                    batchNumber: 'N/A',
                                    doseNumber: dose.doseNumber,
                                    totalDoses: vaccination.totalDoses,
                                    dateScheduled: dose.dateScheduled,
                                    administeredBy: vaccination.healthcareProvider?.name || 'Unknown',
                                    facility: vaccination.healthcareProvider?.facility || 'Unknown',
                                    certificateNumber: 'N/A',
                                    nextDueDate: undefined
                                });
                            }
                        });
                    }
                    if (healthCard) {
                        await healthCard.save();
                    }
                }
            }
            res.status(200).json({
                success: true,
                message: 'Health card updated successfully',
                data: {
                    healthCard
                }
            });
        }
        catch (error) {
            console.error('Update health card error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update health card',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getHealthCardByCardId(req, res) {
        try {
            const { cardId } = req.params;
            const healthCard = await digitalHealthCard_1.default.findOne({
                cardId,
                status: 'active'
            }).populate('userId', 'name email');
            if (!healthCard) {
                res.status(404).json({
                    success: false,
                    message: 'Health card not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Health card retrieved successfully',
                data: {
                    healthCard: {
                        cardId: healthCard.cardId,
                        cardNumber: healthCard.cardNumber,
                        userInfo: healthCard.userInfo,
                        completedVaccinations: healthCard.completedVaccinations,
                        statistics: healthCard.statistics,
                        issuedDate: healthCard.issuedDate,
                        lastUpdated: healthCard.lastUpdated
                    }
                }
            });
        }
        catch (error) {
            console.error('Get health card by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve health card',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getHealthCardStats(req, res) {
        try {
            const { userId } = req.params;
            const healthCard = await digitalHealthCard_1.default.findOne({
                userId,
                status: 'active'
            });
            if (!healthCard) {
                res.status(404).json({
                    success: false,
                    message: 'Health card not found'
                });
                return;
            }
            const upcomingVaccinations = await vaccineScheduleModel_1.default.find({
                userId,
                status: 'scheduled',
                dateScheduled: { $gte: new Date() }
            }).limit(5);
            const stats = {
                ...healthCard.statistics,
                upcomingVaccinations: upcomingVaccinations.length,
                cardStatus: healthCard.status,
                cardAge: Math.floor((Date.now() - healthCard.issuedDate.getTime()) / (1000 * 60 * 60 * 24)),
                recentVaccinations: healthCard.completedVaccinations
                    .sort((a, b) => new Date(b.dateScheduled).getTime() - new Date(a.dateScheduled).getTime())
                    .slice(0, 3)
            };
            res.status(200).json({
                success: true,
                message: 'Health card statistics retrieved successfully',
                data: {
                    statistics: stats,
                    upcomingVaccinations
                }
            });
        }
        catch (error) {
            console.error('Get health card stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve health card statistics',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async updateUserInfo(req, res) {
        try {
            const { userId } = req.params;
            const { fullName, bloodType, emergencyContact, profilePicture } = req.body;
            const healthCard = await digitalHealthCard_1.default.findOne({
                userId,
                status: 'active'
            });
            if (!healthCard) {
                res.status(404).json({
                    success: false,
                    message: 'Health card not found'
                });
                return;
            }
            if (fullName)
                healthCard.userInfo.fullName = fullName;
            if (bloodType)
                healthCard.userInfo.bloodType = bloodType;
            if (profilePicture)
                healthCard.userInfo.profilePicture = profilePicture;
            if (emergencyContact) {
                healthCard.userInfo.emergencyContact = {
                    name: emergencyContact.name || healthCard.userInfo.emergencyContact?.name || '',
                    phone: emergencyContact.phone || healthCard.userInfo.emergencyContact?.phone || ''
                };
            }
            await healthCard.save();
            res.status(200).json({
                success: true,
                message: 'Health card user info updated successfully',
                data: {
                    healthCard
                }
            });
        }
        catch (error) {
            console.error('Update user info error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user info',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}
exports.HealthCardController = HealthCardController;
//# sourceMappingURL=healthCardController.js.map