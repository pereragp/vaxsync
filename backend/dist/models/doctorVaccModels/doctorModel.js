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
    hospitals: {
        type: [String],
        required: [true, "At least one hospital is required"],
    },
    phoneNumber: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
        validate: {
            validator: (v) => {
                return /^(\+94|0)?[0-9]{9}$/.test(v);
            },
            message: (props) => `${props.value} is not a valid Sri Lankan phone number!`,
        },
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
    imageUrls: {
        type: [String],
        required: [true, "Image URL(s) are required"],
    },
    doc990Id: {
        type: String,
        required: [true, "Doc990 ID is required"],
        trim: true,
    },
    doc990Link: {
        type: String,
        required: [true, "Doc990 link is required"],
        trim: true,
    },
}, { timestamps: true });
doctorSchema.index({ specialty: 1, "hospitals": 1 });
exports.default = mongoose_1.default.model("Doctor", doctorSchema);
//# sourceMappingURL=doctorModel.js.map