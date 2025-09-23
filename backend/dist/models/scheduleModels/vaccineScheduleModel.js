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
const vaccinationRecordSchema = new mongoose_1.Schema({
    recordId: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return ("REC" +
                Date.now() +
                Math.random().toString(36).substring(2, 7).toUpperCase());
        },
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
    },
    vaccineId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Vaccine",
        required: false,
    },
    vaccineName: {
        type: String,
        required: [true, "Vaccine name is required"],
        trim: true,
    },
    totalDoses: {
        type: Number,
        required: [true, "Total doses is required"],
        min: [1, "Total doses must be at least 1"],
    },
    interval: {
        type: Number,
        required: [true, "Interval is required"],
        min: [0, "Interval must be non-negative"],
    },
    doses: [
        {
            doseNumber: {
                type: Number,
                required: true,
                min: [1, "Dose number must be at least 1"],
            },
            dateScheduled: {
                type: Date,
                required: [true, "Date scheduled is required"],
            },
            dateCompleted: {
                type: Date,
                required: false,
            },
            status: {
                type: String,
                enum: {
                    values: ["scheduled", "completed", "missed", "cancelled"],
                    message: "Status must be one of: scheduled, completed, missed, cancelled",
                },
                default: "scheduled",
            },
            notes: {
                type: String,
                maxlength: [500, "Dose notes cannot exceed 500 characters"],
                trim: true,
            },
        },
    ],
    overallStatus: {
        type: String,
        enum: {
            values: ["in_progress", "completed", "cancelled"],
            message: "Overall status must be one of: in_progress, completed, cancelled",
        },
        default: "in_progress",
    },
    healthcareProvider: {
        name: {
            type: String,
            required: false,
            trim: true,
        },
        facility: {
            type: String,
            required: false,
            trim: true,
        },
        contact: {
            type: String,
            required: false,
            trim: true,
        },
    },
    notes: {
        type: String,
        maxlength: [1000, "Notes cannot exceed 1000 characters"],
        trim: true,
    },
}, {
    timestamps: true,
});
vaccinationRecordSchema.index({ userId: 1, dateScheduled: -1 });
vaccinationRecordSchema.index({ status: 1 });
vaccinationRecordSchema.index({ vaccineName: 1 });
exports.default = mongoose_1.default.model("VaccineSchedule", vaccinationRecordSchema);
//# sourceMappingURL=vaccineScheduleModel.js.map