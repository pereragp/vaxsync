import { Request, Response } from 'express';
import VaccinationRecord from '../../models/scheduleModels/vaccineScheduleModel';
import Vaccine from '../../models/scheduleModels/vaccinesModel';
import User from '../../models/userModels/user';
import Dependent from '../../models/userModels/dependent';
import DigitalHealthCard from '../../models/healthCard/healthcardModel';
import { AuthRequest, ApiResponse, PaginationInfo, IVaccinationRecord } from '../../types';
import mongoose, { Types } from 'mongoose';
import { syncVaccinesToHealthCard } from '../healthCard/healthCardController';

export class ScheduleController {
  // Create new vaccine schedule for parent users (for themselves or their dependents)
  static async createVaccineSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { 
        vaccineId, 
        vaccineName, 
        totalDoses, 
        interval, 
        dependentId, 
        healthcareProvider, 
        notes,
        scheduleDate 
      } = req.body;

      // const userId = req.user?._id;
      // if (!userId) {
      //   res.status(401).json({
      //     success: false,
      //     message: "User not authenticated"
      //   } as ApiResponse);
      //   return;
      // }
      
      // Temporary hardcoded user ID for testing
      const userId = new Types.ObjectId("68cfcf945e1c53a931fa032e");

      // If vaccineId is provided, get vaccine details from database
      let vaccineData = null;
      if (vaccineId) {
        vaccineData = await Vaccine.findById(vaccineId);
        if (!vaccineData) {
          res.status(404).json({
            success: false,
            message: "Vaccine not found"
          } as ApiResponse);
          return;
        }
      }

      // If dependentId is provided, validate the dependent belongs to the user
      let dependentIds: Types.ObjectId[] = [];
      if (dependentId) {
        const dependent = await Dependent.findOne({ 
          _id: dependentId, 
          guardianId: userId 
        });
        if (!dependent) {
          res.status(404).json({
            success: false,
            message: "Dependent not found or not authorized"
          } as ApiResponse);
          return;
        }
        dependentIds = [new Types.ObjectId(dependentId)];
      }

      // Calculate start date - use provided scheduleDate or current date
      const startDate = scheduleDate ? new Date(scheduleDate) : new Date();
      
      // Create the vaccination record
      const vaccinationRecord = new VaccinationRecord({
        userId,
        dependentIds,
        vaccineId: vaccineId || null,
        vaccineName: vaccineName || vaccineData?.name,
        totalDoses,
        interval,
        healthcareProvider: healthcareProvider ? { name: healthcareProvider } : undefined,
        notes,
        doses: Array.from({ length: totalDoses }, (_, index) => ({
          doseNumber: index + 1,
          dateScheduled: new Date(startDate.getTime() + (index * interval * 24 * 60 * 60 * 1000)),
          status: "scheduled"
        }))
      });

      const savedRecord = await vaccinationRecord.save();

      res.status(201).json({
        success: true,
        message: "Vaccine schedule created successfully",
        data: savedRecord
      } as ApiResponse<IVaccinationRecord>);
    } catch (error: any) {
      console.error("Error creating vaccine schedule:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create vaccine schedule",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // Get all vaccine schedules for parent users (their own and their dependents')
  static async getAllVaccineSchedules(req: Request, res: Response): Promise<void> {
    try {
      // const userId = req.user?._id;
      // if (!userId) {
      //   res.status(401).json({
      //     success: false,
      //     message: "User not authenticated"
      //   } as ApiResponse);
      //   return;
      // }
      
      // Temporary hardcoded user ID for testing
      const userId = new Types.ObjectId("68cfcf945e1c53a931fa032e");

      const { 
        page = 1, 
        limit = 10, 
        dependentId, 
        overallStatus, 
        vaccineName 
      } = req.query;

      // Build filter
      const filter: any = { userId };
      
      if (dependentId) {
        filter.dependentIds = { $in: [dependentId] };
      }
      if (overallStatus) {
        filter.overallStatus = overallStatus;
      }
      if (vaccineName) {
        filter.vaccineName = { $regex: vaccineName, $options: 'i' };
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const schedules = await VaccinationRecord.find(filter)
        .populate('vaccineId', 'name manufacturer type')
        .populate('dependentIds', 'firstName lastName dateOfBirth gender dependentType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      const totalSchedules = await VaccinationRecord.countDocuments(filter);
      const totalPages = Math.ceil(totalSchedules / limitNum);

      res.status(200).json({
        success: true,
        message: "Vaccine schedules retrieved successfully",
        data: schedules,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalRecords: totalSchedules,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1
        }
      } as ApiResponse<IVaccinationRecord[]>);
    } catch (error: any) {
      console.error("Error fetching vaccine schedules:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vaccine schedules",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // Update vaccine schedule for parent users
  static async updateVaccineSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { vaccineName, healthcareProvider, notes, scheduleDate, interval } = req.body;

      // const userId = req.user?._id;
      // if (!userId) {
      //   res.status(401).json({
      //     success: false,
      //     message: "User not authenticated"
      //   } as ApiResponse);
      //   return;
      // }
      
      // Temporary hardcoded user ID for testing
      const userId = new Types.ObjectId("68cfcf945e1c53a931fa032e");

      // Validate ObjectId
      if (!Types.ObjectId.isValid(scheduleId)) {
        res.status(400).json({
          success: false,
          message: "Invalid schedule ID format"
        } as ApiResponse);
        return;
      }

      // Check if schedule exists and belongs to user
      const existingSchedule = await VaccinationRecord.findOne({ 
        _id: scheduleId, 
        userId 
      });
      
      if (!existingSchedule) {
        res.status(404).json({
          success: false,
          message: "Schedule not found or not authorized"
        } as ApiResponse);
        return;
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date()
      };

      // Update basic fields
      if (vaccineName) updateData.vaccineName = vaccineName;
      if (healthcareProvider) updateData.healthcareProvider = healthcareProvider;
      if (notes !== undefined) updateData.notes = notes;
      if (interval !== undefined) updateData.interval = interval;

      // If schedule date or interval is updated, recalculate all dose dates
      if (scheduleDate || interval !== undefined) {
        const startDate = scheduleDate ? new Date(scheduleDate) : new Date(existingSchedule.doses[0].dateScheduled);
        const intervalDays = interval !== undefined ? interval : existingSchedule.interval;
        
        // Recalculate all dose dates
        updateData.doses = existingSchedule.doses.map((dose: any, index: number) => ({
          ...dose.toObject(),
          dateScheduled: new Date(startDate.getTime() + (index * intervalDays * 24 * 60 * 60 * 1000))
        }));
      }

      // Update the schedule
      const updatedSchedule = await VaccinationRecord.findByIdAndUpdate(
        scheduleId,
        updateData,
        { new: true, runValidators: true }
      ).populate('vaccineId', 'name manufacturer type')
       .populate('dependentIds', 'firstName lastName dateOfBirth gender dependentType');

      // Trigger automatic sync if overall status changed to completed
      if (updateData.overallStatus === 'completed') {
        console.log(`Schedule ${scheduleId} marked as completed, triggering health card sync`);
        await syncVaccinesToHealthCard(scheduleId);
      }

      res.status(200).json({
        success: true,
        message: "Vaccine schedule updated successfully",
        data: updatedSchedule
      } as ApiResponse<IVaccinationRecord>);
    } catch (error: any) {
      console.error("Error updating vaccine schedule:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update vaccine schedule",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // Update each dose status and overall status for parent users
  static async updateDoseStatus(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId, doseNumber } = req.params;
      const { status, dateCompleted, notes } = req.body;

      // const userId = req.user?._id;
      // if (!userId) {
      //   res.status(401).json({
      //     success: false,
      //     message: "User not authenticated"
      //   } as ApiResponse);
      //   return;
      // }
      
      // Temporary hardcoded user ID for testing
      const userId = new Types.ObjectId("68cfcf945e1c53a931fa032e");

      // Validate ObjectId
      if (!Types.ObjectId.isValid(scheduleId)) {
        res.status(400).json({
          success: false,
          message: "Invalid schedule ID format"
        } as ApiResponse);
        return;
      }

      // Find the schedule
      const schedule = await VaccinationRecord.findOne({ 
        _id: scheduleId, 
        userId 
      });
      
      if (!schedule) {
        res.status(404).json({
          success: false,
          message: "Schedule not found or not authorized"
        } as ApiResponse);
        return;
      }

      // Find and update the specific dose
      const doseIndex = schedule.doses.findIndex(dose => dose.doseNumber === parseInt(doseNumber));
      if (doseIndex === -1) {
        res.status(404).json({
          success: false,
          message: "Dose not found"
        } as ApiResponse);
        return;
      }

      // Update dose status
      schedule.doses[doseIndex].status = status;
      if (dateCompleted) {
        schedule.doses[doseIndex].dateCompleted = new Date(dateCompleted);
      }
      if (notes) {
        schedule.doses[doseIndex].notes = notes;
      }

      // Update overall status based on dose statuses
      const allCompleted = schedule.doses.every(dose => dose.status === 'completed');
      const anyCancelled = schedule.doses.some(dose => dose.status === 'cancelled');
      
      if (allCompleted) {
        schedule.overallStatus = 'completed';
      } else if (anyCancelled) {
        schedule.overallStatus = 'cancelled';
      } else {
        schedule.overallStatus = 'in_progress';
      }

      await schedule.save();

      // Trigger automatic sync to health card if dose was completed
      if (status === 'completed') {
        console.log(`Dose ${doseNumber} completed, triggering health card sync for schedule ${scheduleId}`);
        await syncVaccinesToHealthCard(scheduleId);
      }

      res.status(200).json({
        success: true,
        message: "Dose status updated successfully",
        data: schedule
      } as ApiResponse<IVaccinationRecord>);
    } catch (error: any) {
      console.error("Error updating dose status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update dose status",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // Delete vaccine schedule for parent users
  static async deleteVaccineSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;

      // const userId = req.user?._id;
      // if (!userId) {
      //   res.status(401).json({
      //     success: false,
      //     message: "User not authenticated"
      //   } as ApiResponse);
      //   return;
      // }
      
      // Temporary hardcoded user ID for testing
      const userId = new Types.ObjectId("68cfcf945e1c53a931fa032e");

      // Validate ObjectId
      if (!Types.ObjectId.isValid(scheduleId)) {
        res.status(400).json({
          success: false,
          message: "Invalid schedule ID format"
        } as ApiResponse);
        return;
      }

      // Check if schedule exists and belongs to user
      const schedule = await VaccinationRecord.findOne({ 
        _id: scheduleId, 
        userId 
      });
      
      if (!schedule) {
        res.status(404).json({
          success: false,
          message: "Schedule not found or not authorized"
        } as ApiResponse);
        return;
      }

      // Delete the schedule
      await VaccinationRecord.findByIdAndDelete(scheduleId);

      res.status(200).json({
        success: true,
        message: "Vaccine schedule deleted successfully",
        data: { 
          id: schedule._id, 
          vaccineName: schedule.vaccineName,
          dependentIds: schedule.dependentIds 
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error deleting vaccine schedule:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete vaccine schedule",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }
}