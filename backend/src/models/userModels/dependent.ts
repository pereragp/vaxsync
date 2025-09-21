import mongoose, { Schema } from "mongoose";
import { IDependent } from "../../types";

const dependentSchema = new Schema<IDependent>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
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
    guardianId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Dependent = mongoose.model<IDependent>("Dependent", dependentSchema);
export default Dependent;
