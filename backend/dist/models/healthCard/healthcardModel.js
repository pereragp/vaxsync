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
const healthCardSchema = new mongoose_1.Schema({
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true,
    },
    gender: {
        type: String,
        required: [true, "Gender is required"],
        enum: ["Male", "Female", "Other"],
    },
    dateOfBirth: {
        type: Date,
        required: [true, "Date of birth is required"],
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: function () {
            return this.cardType === "user";
        },
    },
    dependentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Dependent",
        required: function () {
            return this.cardType === "dependent";
        },
    },
    cardType: {
        type: String,
        required: true,
        enum: ["user", "dependent"],
    },
    dependents: [{
            _id: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Dependent",
                required: true,
            },
            dependentId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Dependent",
                required: true,
            },
            fullName: {
                type: String,
                required: true,
                trim: true,
            },
            dateOfBirth: {
                type: Date,
                required: true,
            },
            gender: {
                type: String,
                required: true,
            },
            dependentType: {
                type: String,
                required: true,
            },
        }],
}, { timestamps: true });
healthCardSchema.pre('save', function (next) {
    if (this.cardType === "user" && !this.userId) {
        return next(new Error("User ID is required for user health cards"));
    }
    if (this.cardType === "dependent" && !this.dependentId) {
        return next(new Error("Dependent ID is required for dependent health cards"));
    }
    if (this.userId && this.dependentId) {
        return next(new Error("Health card cannot have both userId and dependentId"));
    }
    next();
});
healthCardSchema.index({ userId: 1 }, { unique: true, sparse: true });
healthCardSchema.index({ dependentId: 1 }, { unique: true, sparse: true });
const HealthCard = mongoose_1.default.model("HealthCard", healthCardSchema);
exports.default = HealthCard;
//# sourceMappingURL=healthcardModel.js.map