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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
            values: ["all", "female", "male", "pregnant", "newborns", "infants", "children", "adolescents", "adults", "elderly", "animals"],
            message: "Target population must be one of: all, female, male, pregnant, newborns, infants, children, adolescents, adults, elderly, animals",
        },
        default: "all",
    },
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