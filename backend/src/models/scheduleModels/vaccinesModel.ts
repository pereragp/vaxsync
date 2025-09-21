import mongoose, { Schema } from "mongoose";
import { IVaccine } from "../../types";

const vaccineSchema = new Schema<IVaccine>(
  {
    vaccineId: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        return (
          "VAX" +
          Date.now() +
          Math.random().toString(36).substring(2, 7).toUpperCase()
        );
      },
    },
    name: {
      type: String,
      required: [true, "Vaccine name is required"],
      trim: true,
      maxlength: [100, "Vaccine name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Vaccine description is required"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    manufacturer: {
      type: String,
      required: [true, "Manufacturer is required"],
      trim: true,
      maxlength: [100, "Manufacturer name cannot exceed 100 characters"],
    },
    type: {
      type: String,
      enum: {
        values: ["routine", "travel", "emergency", "seasonal"],
        message: "Type must be one of: routine, travel, emergency, seasonal",
      },
      default: "routine",
    },
    ageGroups: [
      {
        minAge: {
          type: Number,
          required: true,
          min: [0, "Minimum age cannot be negative"],
        },
        maxAge: {
          type: Number,
          required: true,
          validate: {
            validator: function (this: any, value: number) {
              return value >= this.minAge;
            },
            message: "Maximum age must be greater than or equal to minimum age",
          },
        },
        doses: {
          type: Number,
          required: true,
          min: [1, "Number of doses must be at least 1"],
          max: [10, "Number of doses cannot exceed 10"],
        },
        interval: {
          type: Number,
          required: true,
          min: [0, "Interval cannot be negative"],
        },
      },
    ],
    sideEffects: [
      {
        type: String,
        trim: true,
        maxlength: [
          200,
          "Side effect description cannot exceed 200 characters",
        ],
      },
    ],
    contraindications: [
      {
        type: String,
        trim: true,
        maxlength: [
          200,
          "Contraindication description cannot exceed 200 characters",
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
vaccineSchema.index({ vaccineId: 1 });
vaccineSchema.index({ name: 1 });
vaccineSchema.index({ type: 1 });
vaccineSchema.index({ isActive: 1 });

export default mongoose.model<IVaccine>("Vaccines", vaccineSchema);
