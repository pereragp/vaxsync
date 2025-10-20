"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDependent = exports.updateDependent = exports.getDependentsByGuardian = exports.addDependent = void 0;
const dependent_1 = __importDefault(require("../../models/userModels/dependent"));
const user_1 = __importDefault(require("../../models/userModels/user"));
const healthcardModel_1 = __importDefault(require("../../models/healthCard/healthcardModel"));
const addDependent = async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, gender, dependentType, guardianId, } = req.body;
        if (!firstName ||
            !lastName ||
            !dateOfBirth ||
            !gender ||
            !dependentType ||
            !guardianId) {
            return res.status(400).json({ message: "All fields are required!!" });
        }
        if (req.user._id.toString() !== guardianId) {
            return res.status(403).json({
                message: "You can only add dependents to your own profile",
            });
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
        if (req.user._id.toString() !== guardianId) {
            return res.status(403).json({
                message: "You can only view your own dependents",
            });
        }
        const guardian = await user_1.default.findById(guardianId);
        if (!guardian) {
            return res.status(404).json({ message: "Guardian not found" });
        }
        const dependents = await dependent_1.default.find({ guardianId }).sort({
            createdAt: -1,
        });
        return res.status(200).json({
            message: "Dependents retrieved successfully",
            dependents: dependents,
        });
    }
    catch (error) {
        console.error("Error getting dependents:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.getDependentsByGuardian = getDependentsByGuardian;
const updateDependent = async (req, res) => {
    try {
        const { dependentId, guardianId } = req.params;
        const updateData = req.body;
        if (!dependentId || !guardianId) {
            return res.status(400).json({
                message: "Both dependent ID and guardian ID are required",
            });
        }
        if (req.user._id.toString() !== guardianId) {
            return res.status(403).json({
                message: "You can only update your own dependents",
            });
        }
        const dependent = await dependent_1.default.findById(dependentId);
        if (!dependent) {
            return res.status(404).json({ message: "Dependent not found" });
        }
        if (dependent.guardianId.toString() !== guardianId) {
            return res.status(403).json({
                message: "Not authorized to update this dependent",
            });
        }
        const updatedDependent = await dependent_1.default.findByIdAndUpdate(dependentId, updateData, { new: true, runValidators: true });
        if (!updatedDependent) {
            return res.status(404).json({ message: "Failed to update dependent" });
        }
        if (updateData.firstName || updateData.lastName) {
            const fullName = `${updatedDependent.firstName} ${updatedDependent.lastName}`;
            await healthcardModel_1.default.findOneAndUpdate({ dependentId: dependentId }, {
                fullName: fullName,
                gender: updatedDependent.gender,
                dateOfBirth: updatedDependent.dateOfBirth
            }, { new: true });
        }
        return res.status(200).json({
            message: "Dependent updated successfully",
            dependent: updatedDependent,
        });
    }
    catch (error) {
        console.error("Error updating dependent:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.updateDependent = updateDependent;
const removeDependent = async (req, res) => {
    try {
        const { dependentId, guardianId } = req.params;
        if (!dependentId || !guardianId) {
            return res.status(400).json({
                message: "Both dependent ID and guardian ID are required",
            });
        }
        if (req.user._id.toString() !== guardianId) {
            return res.status(403).json({
                message: "You can only remove your own dependents",
            });
        }
        const dependent = await dependent_1.default.findById(dependentId);
        if (!dependent) {
            return res.status(404).json({ message: "Dependent not found" });
        }
        if (dependent.guardianId.toString() !== guardianId) {
            return res.status(403).json({
                message: "Not authorized to remove this dependent",
            });
        }
        const guardian = await user_1.default.findById(guardianId);
        if (!guardian) {
            return res.status(404).json({ message: "Guardian not found" });
        }
        await dependent_1.default.findByIdAndDelete(dependentId);
        await user_1.default.findByIdAndUpdate(guardianId, { $pull: { dependents: dependentId } }, { new: true });
        return res.status(200).json({
            message: "Dependent removed successfully",
            removedDependentId: dependentId,
        });
    }
    catch (error) {
        console.error("Error removing dependent:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.removeDependent = removeDependent;
//# sourceMappingURL=dependentController.js.map