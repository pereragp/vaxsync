import mongoose, { Schema } from "mongoose";
import { IHealthCard } from "../../types";

const healthCardSchema = new Schema<IHealthCard>(
  {
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
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function(this: IHealthCard) {
        return this.cardType === "user";
      },
    },
    dependentId: {
      type: Schema.Types.ObjectId,
      ref: "Dependent",
      required: function(this: IHealthCard) {
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
        type: Schema.Types.ObjectId,
        ref: "Dependent",
        required: true,
      },
      dependentId: {
        type: Schema.Types.ObjectId,
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
    completedVaccinations: [{
      vaccineName: {
        type: String,
        required: true,
        trim: true,
      },
      manufacturer: {
        type: String,
        trim: true,
      },
      doseNumber: {
        type: Number,
        required: true,
        min: 1,
      },
      totalDoses: {
        type: Number,
        required: true,
        min: 1,
      },
      dateCompleted: {
        type: Date,
        required: true,
      },
      administeredBy: {
        type: String,
        trim: true,
      },
      facility: {
        type: String,
        trim: true,
      },
      certificateNumber: {
        type: String,
        trim: true,
      },
      notes: {
        type: String,
        trim: true,
        maxlength: [500, "Notes cannot exceed 500 characters"],
      },
      status: {
        type: String,
        enum: ["completed", "cancelled"],
        default: "completed",
      },
      vaccinationType: {
        type: String,
        enum: ["routine", "travel", "occupational", "emergency"],
        default: "routine",
      },
    }],
  },
  { timestamps: true }
);

// Ensure either userId or dependentId is provided, but not both
healthCardSchema.pre('save', function(this: IHealthCard, next) {
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

// Create compound index to ensure uniqueness
healthCardSchema.index({ userId: 1 }, { unique: true, sparse: true });
healthCardSchema.index({ dependentId: 1 }, { unique: true, sparse: true });

const HealthCard = mongoose.model<IHealthCard>("HealthCard", healthCardSchema);

export default HealthCard;
