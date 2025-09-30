import Dependent from "../../models/userModels/dependent";
import User from "../../models/userModels/user";
import { Request, Response } from "express";

// Add a Dependent
const addDependent = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, dependentType, guardianId } =
      req.body;

    //Basic Validations
    if (
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !gender ||
      !dependentType ||
      !guardianId
    ) {
      return res.status(400).json({ message: "All fields are required!!" });
    }

    //Create dependent
    const newDependent = new Dependent({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      dependentType,
      guardianId,
    });

    const savedDependent = await newDependent.save();

    // //Check if guardian exists
    // const guardian = await User.findById(guardianId);
    // if (!guardian) {
    //   return res.status(404).json({ message: "Guardian not found" });

    //   //Delete the created dependent if guardian doesn't exist
    //   await Dependent.findByIdAndDelete(savedDependent._id);
    // }

    //Add dependent to guardian's dependents array
    await User.findByIdAndUpdate(
      guardianId,
      { $push: { dependents: savedDependent._id } },
      { new: true }
    );

    return res
      .status(201)
      .json({
        message: "Dependent added successfully",
        dependent: savedDependent,
      });
  } catch (error) {
    console.error("Error adding dependent:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get dependents by guardian ID
const getDependentsByGuardian = async (req: Request, res: Response) => {
  try {
    const { guardianId } = req.params;

    if (!guardianId) {
      return res.status(400).json({ message: "Guardian ID is required" });
    }

    // Check if guardian exists
    const guardian = await User.findById(guardianId);
    if (!guardian) {
      return res.status(404).json({ message: "Guardian not found" });
    }

    // Get all dependents for this guardian
    const dependents = await Dependent.find({ guardianId }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Dependents retrieved successfully",
      dependents: dependents
    });
  } catch (error) {
    console.error("Error getting dependents:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export { addDependent, getDependentsByGuardian };
