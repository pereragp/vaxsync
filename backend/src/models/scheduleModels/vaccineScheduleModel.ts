import mongoose, { Schema } from "mongoose";
import { IVaccinationRecord } from "../../types";
import { syncVaccinesToHealthCard } from "../../controllers/healthCard/healthCardController";

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
    dependentIds: {
      type: [Schema.Types.ObjectId],
      ref: "Dependent",
      required: false, // Optional - only if user has dependents
      default: [],
    }, // Array of dependent IDs for parent users
    vaccineId: {
      type: Schema.Types.ObjectId,
      ref: "Vaccines",
      required: false, // Optional for manual entries
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
    vaccinationType: {
      type: String,
      enum: {
        values: ["routine", "travel", "occupational", "emergency"],
        message:
          "Vaccination type must be one of: routine, travel, occupational, emergency",
      },
      default: "routine",
    },
    healthcareProvider: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, "Provider name cannot exceed 100 characters"],
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


// Indexes for better performance
vaccinationRecordSchema.index({ userId: 1, dateScheduled: -1 });
vaccinationRecordSchema.index({ dependentIds: 1 });
vaccinationRecordSchema.index({ vaccineId: 1 });
vaccinationRecordSchema.index({ recordId: 1 });
vaccinationRecordSchema.index({ overallStatus: 1 });
vaccinationRecordSchema.index({ vaccineName: 1 });
vaccinationRecordSchema.index({ "doses.status": 1 });

// Middleware to automatically sync completed vaccines to health cards
vaccinationRecordSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    // Check if any doses were marked as completed
    const hasCompletedDoses = doc.doses.some((dose: any) => dose.status === 'completed');
    if (hasCompletedDoses) {
      console.log(`Auto-syncing completed vaccines for schedule ${doc._id}`);
      await syncVaccinesToHealthCard(doc._id.toString());
    }
  }
});

// Also trigger on direct save operations
vaccinationRecordSchema.post('save', async function(doc) {
  if (doc) {
    // Check if any doses were marked as completed
    const hasCompletedDoses = doc.doses.some((dose: any) => dose.status === 'completed');
    if (hasCompletedDoses) {
      console.log(`Auto-syncing completed vaccines for schedule ${doc._id}`);
      await syncVaccinesToHealthCard(doc._id.toString());
    }
  }
});

export default mongoose.model<IVaccinationRecord>(
  "VaccineSchedule",
  vaccinationRecordSchema
);
