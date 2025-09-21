import mongoose, { Schema } from "mongoose";
import { IVaccinationRecord } from "../../types";

const vaccinationRecordSchema = new Schema<IVaccinationRecord>(
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
      required: false, // Made optional for manual entries
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
            message:
              "Status must be one of: scheduled, completed, missed, cancelled",
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
        message:
          "Overall status must be one of: in_progress, completed, cancelled",
      },
      default: "in_progress",
    },
    healthcareProvider: {
      name: {
        type: String,
        required: false, // Made optional
        trim: true,
      },
      facility: {
        type: String,
        required: false, // Made optional
        trim: true,
      },
      contact: {
        type: String,
        required: false, // Made optional
        trim: true,
      },
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

// No pre-save hooks needed for simplified model

// Indexes for better performance
vaccinationRecordSchema.index({ userId: 1, dateScheduled: -1 });
vaccinationRecordSchema.index({ status: 1 });
vaccinationRecordSchema.index({ vaccineName: 1 });

export default mongoose.model<IVaccinationRecord>(
  "VaccineSchedule",
  vaccinationRecordSchema
);
