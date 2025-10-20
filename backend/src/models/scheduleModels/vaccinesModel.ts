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
    targetPopulation: {
      type: String,
      enum: {
        values: ["all", "female", "male", "pregnant", "newborns", "infants", "children", "adolescents", "adults", "elderly"],
        message:
          "Target population must be one of: all, female, male, pregnant, newborns, infants, children, adolescents, adults, elderly",
      },
      default: "all",
    },  
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
