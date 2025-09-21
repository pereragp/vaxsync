import { Request, Response } from "express";
import VaccineSchedule from "../../models/scheduleModels/vaccineScheduleModel";
import User from "../../models/userModels/user";
import mongoose from "mongoose";

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  error?: string;
}

export class VaccineScheduleController {
  // Create vaccine schedule
  static async createSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        targetUserId, // For dependents
        vaccineId,
        vaccineName,
        totalDoses,
        doses,
        healthcareProvider,
        notes,
      } = req.body;

      const authenticatedUserId = req.user?.userId;

      if (!authenticatedUserId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        } as ApiResponse);
        return;
      }

      // Determine which user the schedule is for
      let scheduleUserId = authenticatedUserId;

      if (targetUserId) {
        // Check if targetUserId is a dependent of the authenticated user
        const parentUser = await User.findById(authenticatedUserId);
        if (!parentUser || !parentUser.dependents?.includes(targetUserId)) {
          res.status(403).json({
            success: false,
            message: "You can only create schedules for your dependents",
          } as ApiResponse);
          return;
        }
        scheduleUserId = targetUserId;
      }

      // Validate required fields
      if (!vaccineName || !totalDoses) {
        res.status(400).json({
          success: false,
          message: "Vaccine name and total doses are required",
        } as ApiResponse);
        return;
      }

      // Check if schedule already exists for this user and vaccine
      const existingSchedule = await VaccineSchedule.findOne({
        userId: scheduleUserId,
        vaccineName: { $regex: new RegExp(`^${vaccineName}$`, "i") },
        overallStatus: { $in: ["in_progress", "completed"] },
      });

      if (existingSchedule) {
        res.status(400).json({
          success: false,
          message: "Schedule already exists for this vaccine",
        } as ApiResponse);
        return;
      }

      // Create doses array
      let dosesArray = [];
      if (doses && Array.isArray(doses)) {
        dosesArray = doses.map((dose: any, index: number) => ({
          doseNumber: index + 1,
          dateScheduled: new Date(dose.dateScheduled),
          status: "scheduled",
          notes: dose.notes || "",
        }));
      } else {
        // Create default doses with monthly intervals
        const baseDate = new Date();
        for (let i = 1; i <= totalDoses; i++) {
          const doseDate = new Date(baseDate);
          doseDate.setMonth(baseDate.getMonth() + (i - 1));

          dosesArray.push({
            doseNumber: i,
            dateScheduled: doseDate,
            status: "scheduled",
            notes: "",
          });
        }
      }

      const schedule = new VaccineSchedule({
        userId: scheduleUserId,
        vaccineId: vaccineId || undefined,
        vaccineName,
        totalDoses,
        doses: dosesArray,
        overallStatus: "in_progress",
        healthcareProvider,
        notes,
      });

      const savedSchedule = await schedule.save();
      await savedSchedule.populate("userId", "name email");

      res.status(201).json({
        success: true,
        message: "Vaccine schedule created successfully",
        data: savedSchedule,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse);
    }
  }

  // Get schedule by ID
  static async getScheduleById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const authenticatedUserId = req.user?.userId;

      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        res.status(400).json({
          success: false,
          message: "Invalid schedule ID",
        } as ApiResponse);
        return;
      }

      const schedule = await VaccineSchedule.findById(scheduleId)
        .populate("userId", "name email")
        .populate("vaccineId", "name manufacturer");

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: "Schedule not found",
        } as ApiResponse);
        return;
      }

      // Check access rights
      const hasAccess = await VaccineScheduleController.checkAccess(
        authenticatedUserId!,
        schedule.userId.toString()
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: "Schedule retrieved successfully",
        data: schedule,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse);
    }
  }

  // Get schedules with filtering and pagination
  static async getSchedules(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        targetUserId,
        status,
        vaccineName,
        includeDependents = "false",
      } = req.query;

      const authenticatedUserId = req.user?.userId;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Get user IDs to query
      let userIds: string[] = [];

      if (targetUserId) {
        // Specific user (must be authenticated user or their dependent)
        const hasAccess = await VaccineScheduleController.checkAccess(
          authenticatedUserId!,
          targetUserId as string
        );
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            message: "Access denied",
          } as ApiResponse);
          return;
        }
        userIds = [targetUserId as string];
      } else if (includeDependents === "true") {
        // Include authenticated user and all dependents
        const user = await User.findById(authenticatedUserId);
        userIds = [authenticatedUserId!];
        if (user && user.dependents) {
          userIds = [
            ...userIds,
            ...user.dependents.map((dep) => dep.toString()),
          ];
        }
      } else {
        // Only authenticated user
        userIds = [authenticatedUserId!];
      }

      // Build filter
      const filter: any = {
        userId: { $in: userIds },
      };

      if (status) {
        filter.overallStatus = status;
      }

      if (vaccineName) {
        filter.vaccineName = { $regex: vaccineName, $options: "i" };
      }

      // Get schedules
      const schedules = await VaccineSchedule.find(filter)
        .populate("userId", "name email")
        .populate("vaccineId", "name manufacturer")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await VaccineSchedule.countDocuments(filter);

      const pagination = {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalRecords: total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPreviousPage: pageNum > 1,
      };

      res.status(200).json({
        success: true,
        message: "Schedules retrieved successfully",
        data: schedules,
        pagination,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse);
    }
  }

  // Update schedule
  static async updateSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const {
        vaccineName,
        totalDoses,
        healthcareProvider,
        notes,
        overallStatus,
      } = req.body;
      const authenticatedUserId = req.user?.userId;

      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        res.status(400).json({
          success: false,
          message: "Invalid schedule ID",
        } as ApiResponse);
        return;
      }

      const schedule = await VaccineSchedule.findById(scheduleId);

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: "Schedule not found",
        } as ApiResponse);
        return;
      }

      // Check access rights
      const hasAccess = await VaccineScheduleController.checkAccess(
        authenticatedUserId!,
        schedule.userId.toString()
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        } as ApiResponse);
        return;
      }

      // Update fields
      if (vaccineName) schedule.vaccineName = vaccineName;
      if (totalDoses) schedule.totalDoses = totalDoses;
      if (healthcareProvider) schedule.healthcareProvider = healthcareProvider;
      if (notes !== undefined) schedule.notes = notes;
      if (overallStatus) schedule.overallStatus = overallStatus;

      const updatedSchedule = await schedule.save();

      res.status(200).json({
        success: true,
        message: "Schedule updated successfully",
        data: updatedSchedule,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse);
    }
  }

  // Delete schedule
  static async deleteSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const authenticatedUserId = req.user?.userId;

      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        res.status(400).json({
          success: false,
          message: "Invalid schedule ID",
        } as ApiResponse);
        return;
      }

      const schedule = await VaccineSchedule.findById(scheduleId);

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: "Schedule not found",
        } as ApiResponse);
        return;
      }

      // Check access rights
      const hasAccess = await VaccineScheduleController.checkAccess(
        authenticatedUserId!,
        schedule.userId.toString()
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        } as ApiResponse);
        return;
      }

      await VaccineSchedule.findByIdAndDelete(scheduleId);

      res.status(200).json({
        success: true,
        message: "Schedule deleted successfully",
        data: schedule,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse);
    }
  }

  // Get upcoming vaccines
  static async getUpcomingVaccines(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        days = 30,
        targetUserId,
        includeDependents = "false",
      } = req.query;

      const authenticatedUserId = req.user?.userId;
      const daysNum = parseInt(days as string);

      const currentDate = new Date();
      const futureDate = new Date();
      futureDate.setDate(currentDate.getDate() + daysNum);

      // Get user IDs
      let userIds: string[] = [];

      if (targetUserId) {
        const hasAccess = await VaccineScheduleController.checkAccess(
          authenticatedUserId!,
          targetUserId as string
        );
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            message: "Access denied",
          } as ApiResponse);
          return;
        }
        userIds = [targetUserId as string];
      } else if (includeDependents === "true") {
        const user = await User.findById(authenticatedUserId);
        userIds = [authenticatedUserId!];
        if (user && user.dependents) {
          userIds = [
            ...userIds,
            ...user.dependents.map((dep) => dep.toString()),
          ];
        }
      } else {
        userIds = [authenticatedUserId!];
      }

      const upcomingVaccines = await VaccineSchedule.aggregate([
        {
          $match: {
            userId: {
              $in: userIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
            overallStatus: "in_progress",
          },
        },
        { $unwind: "$doses" },
        {
          $match: {
            "doses.status": "scheduled",
            "doses.dateScheduled": {
              $gte: currentDate,
              $lte: futureDate,
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $project: {
            recordId: 1,
            vaccineName: 1,
            "doses.doseNumber": 1,
            "doses.dateScheduled": 1,
            totalDoses: 1,
            "user.name": 1,
            healthcareProvider: 1,
          },
        },
        { $sort: { "doses.dateScheduled": 1 } },
      ]);

      res.status(200).json({
        success: true,
        message: "Upcoming vaccines retrieved successfully",
        data: upcomingVaccines,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse);
    }
  }

  // Get overdue vaccines
  static async getOverdueVaccines(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        targetUserId,
        includeDependents = "false",
        gracePeriod = 0,
      } = req.query;

      const authenticatedUserId = req.user?.userId;
      const gracePeriodDays = parseInt(gracePeriod as string);

      const currentDate = new Date();
      const overdueDate = new Date();
      overdueDate.setDate(currentDate.getDate() - gracePeriodDays);

      // Get user IDs
      let userIds: string[] = [];

      if (targetUserId) {
        const hasAccess = await VaccineScheduleController.checkAccess(
          authenticatedUserId!,
          targetUserId as string
        );
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            message: "Access denied",
          } as ApiResponse);
          return;
        }
        userIds = [targetUserId as string];
      } else if (includeDependents === "true") {
        const user = await User.findById(authenticatedUserId);
        userIds = [authenticatedUserId!];
        if (user && user.dependents) {
          userIds = [
            ...userIds,
            ...user.dependents.map((dep) => dep.toString()),
          ];
        }
      } else {
        userIds = [authenticatedUserId!];
      }

      const overdueVaccines = await VaccineSchedule.aggregate([
        {
          $match: {
            userId: {
              $in: userIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
            overallStatus: "in_progress",
          },
        },
        { $unwind: "$doses" },
        {
          $match: {
            "doses.status": "scheduled",
            "doses.dateScheduled": { $lt: overdueDate },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $addFields: {
            daysOverdue: {
              $ceil: {
                $divide: [
                  { $subtract: [currentDate, "$doses.dateScheduled"] },
                  1000 * 60 * 60 * 24,
                ],
              },
            },
          },
        },
        {
          $project: {
            recordId: 1,
            vaccineName: 1,
            "doses.doseNumber": 1,
            "doses.dateScheduled": 1,
            totalDoses: 1,
            daysOverdue: 1,
            "user.name": 1,
            healthcareProvider: 1,
          },
        },
        { $sort: { daysOverdue: -1 } },
      ]);

      res.status(200).json({
        success: true,
        message: "Overdue vaccines retrieved successfully",
        data: overdueVaccines,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse);
    }
  }

  // Update dose status
  static async updateDoseStatus(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { scheduleId, doseNumber } = req.params;
      const { status, dateCompleted, batchNo, vaccinatedLocation, notes } =
        req.body;
      const authenticatedUserId = req.user?.userId;

      const schedule = await VaccineSchedule.findById(scheduleId);

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: "Schedule not found",
        } as ApiResponse);
        return;
      }

      // Check access rights
      const hasAccess = await VaccineScheduleController.checkAccess(
        authenticatedUserId!,
        schedule.userId.toString()
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        } as ApiResponse);
        return;
      }

      const doseIndex = schedule.doses.findIndex(
        (dose) => dose.doseNumber === parseInt(doseNumber)
      );

      if (doseIndex === -1) {
        res.status(404).json({
          success: false,
          message: "Dose not found",
        } as ApiResponse);
        return;
      }

      // Update dose
      if (status) schedule.doses[doseIndex].status = status;
      if (dateCompleted)
        schedule.doses[doseIndex].dateCompleted = new Date(dateCompleted);
      if (batchNo) schedule.doses[doseIndex].batchNo = batchNo;
      if (vaccinatedLocation)
        schedule.doses[doseIndex].vaccinatedLocation = vaccinatedLocation;
      if (notes !== undefined) schedule.doses[doseIndex].notes = notes;

      // Auto-set completion date if marked as completed
      if (status === "completed" && !dateCompleted) {
        schedule.doses[doseIndex].dateCompleted = new Date();
      }

      // Update overall status
      const completedDoses = schedule.doses.filter(
        (dose) => dose.status === "completed"
      ).length;
      if (completedDoses === schedule.totalDoses) {
        schedule.overallStatus = "completed";
      }

      await schedule.save();

      res.status(200).json({
        success: true,
        message: "Dose status updated successfully",
        data: schedule,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse);
    }
  }

  // Helper method to check access rights
  private static async checkAccess(
    authenticatedUserId: string,
    targetUserId: string
  ): Promise<boolean> {
    if (authenticatedUserId === targetUserId) {
      return true;
    }

    // Check if target user is a dependent
    const user = await User.findById(authenticatedUserId);
    if (
      user &&
      user.dependents &&
      user.dependents.includes(new mongoose.Types.ObjectId(targetUserId))
    ) {
      return true;
    }

    return false;
  }
}
