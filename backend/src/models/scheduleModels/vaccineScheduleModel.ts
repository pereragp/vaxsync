import mongoose, { Schema, Document } from "mongoose";
import { Types } from "mongoose"; // Import Types for ObjectId

export interface IDose {
  doseNumber: number;
  dateScheduled: Date;
  dateCompleted?: Date;
  batchNo?: string;
  vaccinatedLocation?: string;
  status: "scheduled" | "completed" | "missed" | "cancelled";
  notes?: string;
}

export interface IVaccineSchedule extends Document {
  recordId: string;
  userId: mongoose.Types.ObjectId;
  vaccineId?: mongoose.Types.ObjectId;
  vaccineName: string;
  totalDoses: number;
  doses: IDose[];
  overallStatus: "in_progress" | "completed" | "cancelled";
  healthcareProvider?: {
    name?: string;
    facility?: string;
    contact?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const doseSchema = new Schema<IDose>({
  doseNumber: {
    type: Number,
    required: true,
    min: [1, "Dose number must be at least 1"],
  },
  dateScheduled: {
    type: Date,
    required: true,
  },
  dateCompleted: {
    type: Date,
    required: false,
  },
  batchNo: {
    type: String,
    required: false,
    trim: true,
  },
  vaccinatedLocation: {
    type: String,
    required: false,
    trim: true,
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
});

const vaccineScheduleSchema = new Schema<IVaccineSchedule>(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        return (
          "REC" +
          Date.now() +
          Math.random().toString(36).substring(2, 7).toUpperCase()
        );
      },
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    vaccineId: {
      type: Schema.Types.ObjectId,
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
      max: [10, "Total doses cannot exceed 10"],
    },
    doses: [doseSchema],
    overallStatus: {
      type: String,
      enum: {
        values: ["in_progress", "completed", "cancelled"],
        message:
          "Overall status must be one of: in_progress, completed, cancelled",
      },
      default: "in_progress",
    },
    healthcareProvider: {
      name: { type: String, trim: true },
      facility: { type: String, trim: true },
      contact: { type: String, trim: true },
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
vaccineScheduleSchema.index({ userId: 1 });
vaccineScheduleSchema.index({ "doses.status": 1 });
vaccineScheduleSchema.index({ "doses.dateScheduled": 1 });
vaccineScheduleSchema.index({ vaccineName: 1 });
vaccineScheduleSchema.index({ overallStatus: 1 });

// Middleware to validate doses array
vaccineScheduleSchema.pre("save", function (next) {
  if (this.doses.length > this.totalDoses) {
    return next(new Error("Number of doses cannot exceed total doses"));
  }
  next();
});

export default mongoose.model<IVaccineSchedule>(
  "VaccineSchedule",
  vaccineScheduleSchema
);
