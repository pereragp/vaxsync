"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDependent = void 0;
const dependent_1 = __importDefault(require("../../models/userModels/dependent"));
const user_1 = __importDefault(require("../../models/userModels/user"));
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
//# sourceMappingURL=dependentController.js.map