import mongoose, { Schema } from "mongoose";
import { IDoctor } from "../../types";

const doctorSchema = new Schema<IDoctor>(
  {
    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    specialty: {
      type: String,
      required: [true, "Specialty is required"],
      trim: true,
      maxlength: [100, "Specialty cannot exceed 100 characters"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    distance: {
      type: String,
      default: "",
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot exceed 5"],
    },
    availability: {
      type: String,
      required: [true, "Availability is required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for faster search
doctorSchema.index({ specialty: 1, location: 1 });

export default mongoose.model<IDoctor>("Doctor", doctorSchema);
