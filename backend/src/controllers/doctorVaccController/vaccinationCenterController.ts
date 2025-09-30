import { Request, Response } from "express";
import VaccinationCenter from "../../models/doctorVaccModels/vaccinationCenterModel";
import { IVaccinationCenter, ApiResponse } from "../../types";

// Add new vaccination center
export const addVaccinationCenter = async (
  req: Request,
  res: Response<ApiResponse<IVaccinationCenter>>
): Promise<Response<ApiResponse<IVaccinationCenter>>> => {
  try {
    const {
      name,
      address,
      district,
      phone,
      latitude,
      longitude,
      vaccineTypes,
      availability,
      openingHours,
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const newCenter = new VaccinationCenter({
      name,
      address,
      district,
      phone,
      location: { type: "Point", coordinates: [longitude, latitude] },
      vaccineTypes,
      availability,
      openingHours,
    });

    const savedCenter = await newCenter.save();

    return res.status(201).json({
      success: true,
      message: "Vaccination center added successfully",
      data: savedCenter,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error adding vaccination center",
      error: error.message,
    });
  }
};

// Get centers (nearby, filter, search)
export const getVaccinationCenters = async (
  req: Request,
  res: Response<ApiResponse<IVaccinationCenter[]>>
): Promise<Response<ApiResponse<IVaccinationCenter[]>>> => {
  try {
    const {
      lat,
      lng,
      radius = "5000",
      limit = "10",
      type,
      district,
      q,
    } = req.query;

    const filter: any = {};

    if (type) filter.vaccineTypes = { $in: [type] };
    if (district) filter.district = new RegExp(district as string, "i");
    if (q) {
      filter.$or = [
        { name: new RegExp(q as string, "i") },
        { address: new RegExp(q as string, "i") },
      ];
    }

    let centers: IVaccinationCenter[];

    if (lat && lng) {
      centers = await VaccinationCenter.find({
        ...filter,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng as string), parseFloat(lat as string)],
            },
            $maxDistance: parseInt(radius as string),
          },
        },
      }).limit(parseInt(limit as string));
    } else {
      centers = await VaccinationCenter.find(filter).limit(parseInt(limit as string));
    }

    return res.json({
      success: true,
      message: "Vaccination centers retrieved successfully",
      data: centers,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching vaccination centers",
      error: error.message,
    });
  }
};

// Get single center by ID
export const getVaccinationCenterById = async (
  req: Request,
  res: Response<ApiResponse<IVaccinationCenter>>
): Promise<Response<ApiResponse<IVaccinationCenter>>> => {
  try {
    const center = await VaccinationCenter.findById(req.params.id);

    if (!center) {
      return res.status(404).json({
        success: false,
        message: "Vaccination center not found",
      });
    }

    return res.json({
      success: true,
      message: "Vaccination center retrieved successfully",
      data: center,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching vaccination center",
      error: error.message,
    });
  }
};
