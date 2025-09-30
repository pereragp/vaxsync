import mongoose, { Schema } from "mongoose";
import { IVaccinationCenter } from "../../types";

const vaccinationCenterSchema = new Schema<IVaccinationCenter>(
  {
    name: {
      type: String,
      required: [true, "Center name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [150, "Name cannot exceed 150 characters"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: [300, "Address cannot exceed 300 characters"],
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
      maxlength: [100, "District name cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: (v: string) => /^(\+94|0)?[0-9]{9}$/.test(v),
        message: (props: any) =>
          `${props.value} is not a valid Sri Lankan phone number!`,
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    vaccineTypes: {
      type: [String],
      required: [true, "At least one vaccine type is required"],
    },
    availability: {
      type: Map,
      of: Number,
      default: {},
    },
    openingHours: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

// Enable geospatial queries
vaccinationCenterSchema.index({ location: "2dsphere" });

export default mongoose.model<IVaccinationCenter>(
  "VaccinationCenter",
  vaccinationCenterSchema
);
