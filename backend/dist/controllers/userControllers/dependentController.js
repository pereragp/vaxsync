"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDependentsByGuardian = exports.addDependent = void 0;
const dependent_1 = __importDefault(require("../../models/userModels/dependent"));
const user_1 = __importDefault(require("../../models/userModels/user"));
const healthcardModel_1 = __importDefault(require("../../models/healthCard/healthcardModel"));
const addDependent = async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, gender, dependentType, guardianId } = req.body;
        if (!firstName ||
            !lastName ||
            !dateOfBirth ||
            !gender ||
            !dependentType ||
            !guardianId) {
            return res.status(400).json({ message: "All fields are required!!" });
        }
        const newDependent = new dependent_1.default({
            firstName,
            lastName,
            dateOfBirth,
            gender,
            dependentType,
            guardianId,
        });
        const savedDependent = await newDependent.save();
        await user_1.default.findByIdAndUpdate(guardianId, { $push: { dependents: savedDependent._id } }, { new: true });
        try {
            const dependentHealthCard = new healthcardModel_1.default({
                fullName: `${savedDependent.firstName} ${savedDependent.lastName}`,
                gender: savedDependent.gender,
                dateOfBirth: savedDependent.dateOfBirth,
                dependentId: savedDependent._id,
                cardType: "dependent"
            });
            await dependentHealthCard.save();
            console.log(`Health card automatically created for dependent: ${savedDependent._id}`);
            await healthcardModel_1.default.findOneAndUpdate({ userId: guardianId, cardType: "user" }, {
                $push: {
                    dependents: {
                        _id: savedDependent._id,
                        dependentId: savedDependent._id,
                        fullName: `${savedDependent.firstName} ${savedDependent.lastName}`,
                        dateOfBirth: savedDependent.dateOfBirth,
                        gender: savedDependent.gender,
                        dependentType: savedDependent.dependentType
                    }
                }
            }, { new: true });
        }
        catch (healthCardError) {
            console.error("Error creating health card for dependent:", healthCardError);
        }
        return res
            .status(201)
            .json({
            message: "Dependent added successfully",
            dependent: savedDependent,
        });
    }
    catch (error) {
        console.error("Error adding dependent:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.addDependent = addDependent;
const getDependentsByGuardian = async (req, res) => {
    try {
        const { guardianId } = req.params;
        if (!guardianId) {
            return res.status(400).json({ message: "Guardian ID is required" });
        }
        const guardian = await user_1.default.findById(guardianId);
        if (!guardian) {
            return res.status(404).json({ message: "Guardian not found" });
        }
        const dependents = await dependent_1.default.find({ guardianId }).sort({ createdAt: -1 });
        return res.status(200).json({
            message: "Dependents retrieved successfully",
            dependents: dependents
        });
    }
    catch (error) {
        console.error("Error getting dependents:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.getDependentsByGuardian = getDependentsByGuardian;
//# sourceMappingURL=dependentController.js.map