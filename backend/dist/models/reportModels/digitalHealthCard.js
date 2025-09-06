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
const digitalHealthCardSchema = new mongoose_1.Schema({
    cardId: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return 'DHC' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
        }
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    cardNumber: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            const year = new Date().getFullYear();
            const random = Math.random().toString().substring(2, 10);
            return `VXS-${year}-${random.substring(0, 4)}-${random.substring(4, 8)}`;
        }
    },
    issuedDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    userInfo: {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        dateOfBirth: {
            type: Date,
            required: true
        },
        profilePicture: {
            type: String,
            default: ''
        },
        bloodType: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
            default: ''
        },
        emergencyContact: {
            name: {
                type: String,
                trim: true
            },
            phone: {
                type: String,
                trim: true
            }
        }
    },
    completedVaccinations: [{
            vaccineName: {
                type: String,
                required: true,
                trim: true
            },
            manufacturer: {
                type: String,
                required: true,
                trim: true
            },
            batchNumber: {
                type: String,
                required: true,
                uppercase: true,
                trim: true
            },
            doseNumber: {
                type: Number,
                required: true,
                min: 1
            },
            totalDoses: {
                type: Number,
                required: true,
                min: 1
            },
            dateScheduled: {
                type: Date,
                required: true
            },
            administeredBy: {
                type: String,
                required: true,
                trim: true
            },
            facility: {
                type: String,
                required: true,
                trim: true
            },
            certificateNumber: {
                type: String,
                required: true,
                unique: true,
                uppercase: true
            },
            nextDueDate: {
                type: Date
            }
        }],
    statistics: {
        totalVaccinations: {
            type: Number,
            default: 0
        },
        lastVaccinationDate: {
            type: Date
        },
        upcomingVaccinations: {
            type: Number,
            default: 0
        },
        complianceScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
digitalHealthCardSchema.pre('save', async function (next) {
    try {
        if (this.isNew || this.isModified('completedVaccinations') || this.isModified('userInfo')) {
            this.statistics.totalVaccinations = this.completedVaccinations.length;
            if (this.completedVaccinations.length > 0) {
                const lastVaccination = this.completedVaccinations
                    .sort((a, b) => new Date(b.dateScheduled).getTime() - new Date(a.dateScheduled).getTime())[0];
                this.statistics.lastVaccinationDate = lastVaccination.dateScheduled;
                this.statistics.complianceScore = Math.min(this.completedVaccinations.length * 20, 100);
            }
            this.lastUpdated = new Date();
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
digitalHealthCardSchema.methods.addCompletedVaccination = function (vaccinationData) {
    const existingIndex = this.completedVaccinations.findIndex((v) => v.certificateNumber === vaccinationData.certificateNumber);
    const vaccination = {
        vaccineName: vaccinationData.vaccineName,
        manufacturer: vaccinationData.manufacturer || 'Unknown',
        batchNumber: vaccinationData.batchNumber,
        doseNumber: vaccinationData.doseNumber,
        totalDoses: vaccinationData.totalDoses,
        dateScheduled: vaccinationData.dateScheduled,
        administeredBy: vaccinationData.healthcareProvider?.name || vaccinationData.administeredBy,
        facility: vaccinationData.healthcareProvider?.facility || vaccinationData.facility,
        certificateNumber: vaccinationData.certificate?.certificateNumber || vaccinationData.certificateNumber,
        nextDueDate: vaccinationData.nextDueDate
    };
    if (existingIndex >= 0) {
        this.completedVaccinations[existingIndex] = vaccination;
    }
    else {
        this.completedVaccinations.push(vaccination);
    }
    this.markModified('completedVaccinations');
};
digitalHealthCardSchema.methods.removeVaccination = function (certificateNumber) {
    this.completedVaccinations = this.completedVaccinations.filter((v) => v.certificateNumber !== certificateNumber);
    this.markModified('completedVaccinations');
};
digitalHealthCardSchema.index({ status: 1 });
exports.default = mongoose_1.default.model('DigitalHealthCard', digitalHealthCardSchema);
//# sourceMappingURL=digitalHealthCard.js.map