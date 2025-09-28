import { Request, Response } from "express";
import Doctor from "../../models/doctorVaccModels/doctorModel";
import { IDoctor } from "../../types";

// @desc   Create a new doctor
// @route  POST /api/doctors/add
// @access Public (later: secure with auth)
export const createDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, specialty, hospitals, phoneNumber, rating, availability, imageUrls, doc990Id, doc990Link } = req.body;

    // Manual validation for required fields, now including phoneNumber
    if (!name || !specialty || !hospitals || !phoneNumber || !availability || !imageUrls || !doc990Id || !doc990Link) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const doctor: IDoctor = await Doctor.create({
      name,
      specialty,
      hospitals,
      phoneNumber,
      rating: rating || 0,
      availability,
      imageUrls,
      doc990Id,
      doc990Link,
    });

    res.status(201).json({ success: true, message: "Doctor created successfully", data: doctor });
  } catch (error: any) {
    console.error("Error creating doctor:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      res.status(400).json({ success: false, message: messages.join(", ") });
      return;
    }

    res.status(500).json({ success: false, message: "Failed to add doctor" });
  }
};

// @desc   Get all doctors
// @route  GET /api/doctors
// @access Public (later: secure with auth)
export const getDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Doctors retrieved successfully", data: doctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ success: false, message: "Failed to fetch doctors" });
  }
};

// @desc   Get doctor by ID
// @route  GET /api/doctors/:id
// @access Public (later: secure with auth)
export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      res.status(404).json({ success: false, message: "Doctor not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Doctor retrieved successfully", data: doctor });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({ success: false, message: "Failed to fetch doctor" });
  }
};
