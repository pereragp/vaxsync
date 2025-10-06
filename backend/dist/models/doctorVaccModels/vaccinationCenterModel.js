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
const vaccinationCenterSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Center name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [150, "Name cannot exceed 150 characters"],
    },
    address: {
        type: String,
        required: [true, "Address is required"],
        trim: true,
        maxlength: [300, "Address cannot exceed 300 characters"],
    },
    district: {
        type: String,
        required: [true, "District is required"],
        trim: true,
        maxlength: [100, "District name cannot exceed 100 characters"],
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
        validate: {
            validator: (v) => /^(\+94|0)?[0-9]{9}$/.test(v),
            message: (props) => `${props.value} is not a valid Sri Lankan phone number!`,
        },
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    vaccineTypes: {
        type: [String],
        required: [true, "At least one vaccine type is required"],
    },
    availability: {
        type: Map,
        of: Number,
        default: {},
    },
    openingHours: {
        type: Map,
        of: String,
        default: {},
    },
}, { timestamps: true });
vaccinationCenterSchema.index({ location: "2dsphere" });
exports.default = mongoose_1.default.model("VaccinationCenter", vaccinationCenterSchema);
//# sourceMappingURL=vaccinationCenterModel.js.map