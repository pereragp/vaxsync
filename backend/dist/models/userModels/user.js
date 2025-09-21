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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return 'USR' + Date.now() + Math.random().toString(36).substring(2, 7).toUpperCase();
        }
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
        validate: {
            validator: function (value) {
                return value <= new Date();
            },
            message: 'Date of birth cannot be in the future'
        }
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    avatar: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'parent', 'healthcare_provider', 'admin'],
            message: 'Role must be one of: user, parent, healthcare_provider, admin'
        },
        default: 'user'
    },
    verificationCode: {
        type: String,
        default: function () {
            return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
    },
    dependents: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    guardians: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    isActive: {
        type: Boolean,
        default: true
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
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    }
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(12);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    catch (error) {
        throw new Error('Password comparison failed');
    }
};
userSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.updatedAt = new Date();
    }
    next();
});
userSchema.index({ phone: 1 });
exports.default = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=user.js.map