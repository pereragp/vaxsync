"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllHealthCardsByUserId = exports.getHealthCardByDependentId = exports.getHealthCardByUserId = exports.createHealthCardsForUserAndDependents = exports.createDependentHealthCard = exports.createUserHealthCard = void 0;
const healthcardModel_1 = __importDefault(require("../../models/healthCard/healthcardModel"));
const user_1 = __importDefault(require("../../models/userModels/user"));
const dependent_1 = __importDefault(require("../../models/userModels/dependent"));
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
        const dependentsData = [];
        if (user.dependents && user.dependents.length > 0) {
            for (const dependentId of user.dependents) {
                const dependent = await dependent_1.default.findById(dependentId);
                if (dependent) {
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
        const user = await user_1.default.findById(userId).populate('dependents');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const createdCards = [];
        const existingCards = [];
        const dependentsData = [];
        if (user.dependents && user.dependents.length > 0) {
            for (const dependentId of user.dependents) {
                const dependent = await dependent_1.default.findById(dependentId);
                if (dependent) {
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
        if (user.dependents && user.dependents.length > 0) {
            for (const dependentId of user.dependents) {
                const dependent = await dependent_1.default.findById(dependentId);
                if (dependent) {
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
        const user = await user_1.default.findById(userId).populate('dependents');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const healthCards = [];
        const userHealthCard = await healthcardModel_1.default.findOne({ userId, cardType: "user" });
        if (userHealthCard) {
            healthCards.push(userHealthCard);
        }
        if (user.dependents && user.dependents.length > 0) {
            for (const dependentId of user.dependents) {
                const dependentHealthCard = await healthcardModel_1.default.findOne({
                    dependentId,
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
//# sourceMappingURL=healthCardController.js.map