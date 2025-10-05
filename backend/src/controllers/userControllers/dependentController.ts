import Dependent from "../../models/userModels/dependent";
import User from "../../models/userModels/user";
import { Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Add a Dependent
const addDependent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      dependentType,
      guardianId,
    } = req.body;

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

    // Ensure user can only add dependents to their own profile
    if (req.user._id.toString() !== guardianId) {
      return res.status(403).json({
        message: "You can only add dependents to your own profile",
      });
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

    //Add dependent to guardian's dependents array
    await User.findByIdAndUpdate(
      guardianId,
      { $push: { dependents: savedDependent._id } },
      { new: true }
    );

    return res.status(201).json({
      message: "Dependent added successfully",
      dependent: savedDependent,
    });
  } catch (error) {
    console.error("Error adding dependent:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get dependents by guardian ID
const getDependentsByGuardian = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { guardianId } = req.params;

    if (!guardianId) {
      return res.status(400).json({ message: "Guardian ID is required" });
    }

    // Ensure user can only view their own dependents
    if (req.user._id.toString() !== guardianId) {
      return res.status(403).json({
        message: "You can only view your own dependents",
      });
    }

    // Check if guardian exists
    const guardian = await User.findById(guardianId);
    if (!guardian) {
      return res.status(404).json({ message: "Guardian not found" });
    }

    // Get all dependents for this guardian
    const dependents = await Dependent.find({ guardianId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      message: "Dependents retrieved successfully",
      dependents: dependents,
    });
  } catch (error) {
    console.error("Error getting dependents:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Remove a Dependent
const removeDependent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dependentId, guardianId } = req.params;

    // Basic validation
    if (!dependentId || !guardianId) {
      return res.status(400).json({
        message: "Both dependent ID and guardian ID are required",
      });
    }

    // Ensure user can only remove their own dependents
    if (req.user._id.toString() !== guardianId) {
      return res.status(403).json({
        message: "You can only remove your own dependents",
      });
    }

    // Check if dependent exists
    const dependent = await Dependent.findById(dependentId);
    if (!dependent) {
      return res.status(404).json({ message: "Dependent not found" });
    }

    // Verify that the dependent belongs to the specified guardian
    if (dependent.guardianId.toString() !== guardianId) {
      return res.status(403).json({
        message: "Not authorized to remove this dependent",
      });
    }

    // Check if guardian exists
    const guardian = await User.findById(guardianId);
    if (!guardian) {
      return res.status(404).json({ message: "Guardian not found" });
    }

    // Remove dependent from the Dependent collection
    await Dependent.findByIdAndDelete(dependentId);

    // Remove dependent ID from guardian's dependents array
    await User.findByIdAndUpdate(
      guardianId,
      { $pull: { dependents: dependentId } },
      { new: true }
    );

    return res.status(200).json({
      message: "Dependent removed successfully",
      removedDependentId: dependentId,
    });
  } catch (error) {
    console.error("Error removing dependent:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export { addDependent, getDependentsByGuardian, removeDependent };
