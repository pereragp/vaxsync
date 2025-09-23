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
const doctorSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Doctor name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [100, "Name cannot exceed 100 characters"],
    },
    specialty: {
        type: String,
        required: [true, "Specialty is required"],
        trim: true,
        maxlength: [100, "Specialty cannot exceed 100 characters"],
    },
    location: {
        type: String,
        required: [true, "Location is required"],
        trim: true,
        maxlength: [200, "Location cannot exceed 200 characters"],
    },
    distance: {
        type: String,
        default: "",
        trim: true,
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, "Rating cannot be less than 0"],
        max: [5, "Rating cannot exceed 5"],
    },
    availability: {
        type: String,
        required: [true, "Availability is required"],
        trim: true,
    },
    imageUrl: {
        type: String,
        required: [true, "Image URL is required"],
        trim: true,
    },
}, { timestamps: true });
doctorSchema.index({ specialty: 1, location: 1 });
exports.default = mongoose_1.default.model("Doctor", doctorSchema);
//# sourceMappingURL=doctorModel.js.map