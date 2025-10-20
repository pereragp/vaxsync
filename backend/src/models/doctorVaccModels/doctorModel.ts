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
    hospitals: {
      type: [String],
      required: [true, "At least one hospital is required"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: (v: string) => {
          // Sri Lankan phone number format validation
          // e.g., 0712345678 or +94712345678
          return /^(\+94|0)?[0-9]{9}$/.test(v);
        },
        message: (props: any) => `${props.value} is not a valid Sri Lankan phone number!`,
      },
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
    imageUrls: {
      type: [String],
      required: [true, "Image URL(s) are required"],
    },
    doc990Id: {
      type: String,
      required: [true, "Doc990 ID is required"],
      trim: true,
    },
    doc990Link: {
      type: String,
      required: [true, "Doc990 link is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

doctorSchema.index({ specialty: 1, "hospitals": 1 });

export default mongoose.model<IDoctor>("Doctor", doctorSchema);