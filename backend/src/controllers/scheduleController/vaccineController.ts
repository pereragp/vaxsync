import { Request, Response } from "express";
import { Document, Types } from "mongoose";
import Vaccine from "../../models/scheduleModels/vaccinesModel";
import { IVaccine, ApiResponse } from "../../types";

export class VaccinationController {
  // Create a new vaccine record
  static async createVaccine(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, manufacturer, type, targetPopulation } = req.body;

      // Check if vaccine with same name already exists
      const existingVaccine = await Vaccine.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existingVaccine) {
        res.status(409).json({
          success: false,
          message: "Vaccine with this name already exists",
          error: "Duplicate vaccine name"
        } as ApiResponse);
        return;
      }

      const vaccine = new Vaccine({
        name,
        description,
        manufacturer,
        type: type || "routine",
        targetPopulation: targetPopulation || "all"
      });

      const savedVaccine = await vaccine.save();

      res.status(201).json({
        success: true,
        message: "Vaccine created successfully",
        data: savedVaccine
      } as ApiResponse<IVaccine>);
    } catch (error: any) {
      console.error("Error creating vaccine:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create vaccine",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // Get all vaccines from database
  static async getAllVaccines(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, type, targetPopulation, isActive } = req.query;
      
      // Build filter object
      const filter: any = {};
      if (type) filter.type = type;
      if (targetPopulation) filter.targetPopulation = targetPopulation;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      // If no pagination params provided, return all vaccines
      const usePagination = page !== undefined || limit !== undefined;
      
      if (usePagination) {
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;
        const skip = (pageNum - 1) * limitNum;

        const vaccines = await Vaccine.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean();

        const totalVaccines = await Vaccine.countDocuments(filter);
        const totalPages = Math.ceil(totalVaccines / limitNum);

        res.status(200).json({
          success: true,
          message: "Vaccines retrieved successfully",
          data: vaccines,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalRecords: totalVaccines,
            hasNextPage: pageNum < totalPages,
            hasPreviousPage: pageNum > 1
          }
        } as ApiResponse<IVaccine[]>);
      } else {
        // Return all vaccines without pagination
        const vaccines = await Vaccine.find(filter)
          .sort({ createdAt: -1 })
          .lean();

        res.status(200).json({
          success: true,
          message: "Vaccines retrieved successfully",
          data: vaccines,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalRecords: vaccines.length,
            hasNextPage: false,
            hasPreviousPage: false
          }
        } as ApiResponse<IVaccine[]>);
      }
    } catch (error: any) {
      console.error("Error fetching vaccines:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vaccines",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // Get vaccine by ID
  static async getVaccineById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid vaccine ID format",
          error: "Invalid ID format"
        } as ApiResponse);
        return;
      }

      const vaccine = await Vaccine.findById(id);
      if (!vaccine) {
        res.status(404).json({
          success: false,
          message: "Vaccine not found",
          error: "Vaccine with this ID does not exist"
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: "Vaccine retrieved successfully",
        data: vaccine
      } as ApiResponse<IVaccine>);
    } catch (error: any) {
      console.error("Error fetching vaccine:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vaccine",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // Update a vaccine
  static async updateVaccine(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate ObjectId format
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid vaccine ID format",
          error: "Invalid ID format"
        } as ApiResponse);
        return;
      }

      // Check if vaccine exists
      const existingVaccine = await Vaccine.findById(id);
      if (!existingVaccine) {
        res.status(404).json({
          success: false,
          message: "Vaccine not found",
          error: "Vaccine with this ID does not exist"
        } as ApiResponse);
        return;
      }

      // Check for duplicate name if name is being updated
      if (updateData.name && updateData.name !== existingVaccine.name) {
        const duplicateVaccine = await Vaccine.findOne({ 
          name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
          _id: { $ne: id }
        });
        if (duplicateVaccine) {
          res.status(409).json({
            success: false,
            message: "Vaccine with this name already exists",
            error: "Duplicate vaccine name"
          } as ApiResponse);
          return;
        }
      }

      const updatedVaccine = await Vaccine.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: "Vaccine updated successfully",
        data: updatedVaccine
      } as ApiResponse<IVaccine>);
    } catch (error: any) {
      console.error("Error updating vaccine:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update vaccine",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // Delete a vaccine
  static async deleteVaccine(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid vaccine ID format",
          error: "Invalid ID format"
        } as ApiResponse);
        return;
      }

      const vaccine = await Vaccine.findById(id);
      if (!vaccine) {
        res.status(404).json({
          success: false,
          message: "Vaccine not found",
          error: "Vaccine with this ID does not exist"
        } as ApiResponse);
        return;
      }

      // Hard delete - permanently remove the vaccine from database
      await Vaccine.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Vaccine deleted successfully",
        data: { id: vaccine._id, name: vaccine.name }
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error deleting vaccine:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete vaccine",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // Get vaccine by vaccineId (string identifier)
  static async getVaccineByVaccineId(req: Request, res: Response): Promise<void> {
    try {
      const { vaccineId } = req.params;

      const vaccine = await Vaccine.findOne({ vaccineId });
      if (!vaccine) {
        res.status(404).json({
          success: false,
          message: "Vaccine not found",
          error: "Vaccine with this vaccineId does not exist"
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: "Vaccine retrieved successfully",
        data: vaccine
      } as ApiResponse<IVaccine>);
    } catch (error: any) {
      console.error("Error fetching vaccine by vaccineId:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vaccine",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }
}
