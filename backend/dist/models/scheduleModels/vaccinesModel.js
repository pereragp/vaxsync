"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const vaccineSchema = new mongoose_1.Schema({
    vaccineId: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return ("VAX" +
                Date.now() +
                Math.random().toString(36).substring(2, 7).toUpperCase());
        },
    },
    name: {
        type: String,
        required: [true, "Vaccine name is required"],
        trim: true,
        maxlength: [100, "Vaccine name cannot exceed 100 characters"],
    },
    description: {
        type: String,
        required: [true, "Vaccine description is required"],
        maxlength: [500, "Description cannot exceed 500 characters"],
    },
    manufacturer: {
        type: String,
        required: [true, "Manufacturer is required"],
        trim: true,
        maxlength: [100, "Manufacturer name cannot exceed 100 characters"],
    },
    type: {
        type: String,
        enum: {
            values: ["routine", "travel", "emergency", "seasonal"],
            message: "Type must be one of: routine, travel, emergency, seasonal",
        },
        default: "routine",
    },
    targetPopulation: {
        type: String,
        enum: {
            values: ["all", "female", "male", "pregnant"],
            message: "Target population must be one of: all, female, male, pregnant",
        },
        default: "female",
    },
    ageGroups: [
        {
            minAge: {
                type: Number,
                required: true,
                min: [0, "Minimum age cannot be negative"],
            },
            maxAge: {
                type: Number,
                required: true,
                validate: {
                    validator: function (value) {
                        return value >= this.minAge;
                    },
                    message: "Maximum age must be greater than or equal to minimum age",
                },
            },
            doses: {
                type: Number,
                required: true,
                min: [1, "Number of doses must be at least 1"],
                max: [10, "Number of doses cannot exceed 10"],
            },
            interval: {
                type: Number,
                required: true,
                min: [0, "Interval cannot be negative"],
            },
        },
    ],
    doseSchedule: [
        {
            pregnancyNumber: { type: Number, required: true },
            doseNumber: { type: Number, required: true },
            weeksAfterPOA: { type: Number },
            weeksAfterPreviousDose: { type: Number },
        },
    ],
    sideEffects: [
        {
            type: String,
            trim: true,
            maxlength: [
                200,
                "Side effect description cannot exceed 200 characters",
            ],
        },
    ],
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
vaccineSchema.index({ vaccineId: 1 });
vaccineSchema.index({ name: 1 });
vaccineSchema.index({ type: 1 });
vaccineSchema.index({ isActive: 1 });
exports.default = mongoose_1.default.model("Vaccines", vaccineSchema);
//# sourceMappingURL=vaccinesModel.js.map