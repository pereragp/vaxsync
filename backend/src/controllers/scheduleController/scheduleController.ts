import { Response } from 'express';
import VaccinationRecord from '../../models/scheduleModels/vaccineScheduleModel';
import Vaccine from '../../models/scheduleModels/vaccinesModel';
import User from '../../models/userModels/user';
import DigitalHealthCard from '../../models/healthCard/healthcardModel';
import { AuthRequest, ApiResponse, PaginationInfo } from '../../types';
import mongoose from 'mongoose';

export class ScheduleController {
  /**
   * Helper method to sync completed vaccine dose to digital health card
   */
  private static async syncCompletedDoseToHealthCard(
    userId: string, 
    schedule: any, 
    completedDose: any
  ): Promise<void> {
    try {
      // Find or create health card for user
      let healthCard = await DigitalHealthCard.findOne({ userId });
      
      if (!healthCard) {
        // Get user info for health card
        const user = await User.findById(userId);
        if (!user) {
          console.error('User not found for health card creation');
          return;
        }

        // Create new health card
        healthCard = new DigitalHealthCard({
          userId,
          userInfo: {
            fullName: user.name || 'Unknown User',
            dateOfBirth: user.dateOfBirth,
            profilePicture: user.avatar || '',
            bloodType: '',
            emergencyContact: {
              name: '',
              phone: user.phone || ''
            }
          },
          completedVaccinations: []
        });
      }

      // Generate certificate number for this dose
      const certificateNumber = `VAC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Prepare vaccination data for health card
      const vaccinationData = {
        vaccineName: schedule.vaccineName,
        manufacturer: schedule.manufacturer || 'Unknown',
        batchNumber: `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        doseNumber: completedDose.doseNumber,
        totalDoses: schedule.totalDoses,
        dateScheduled: completedDose.dateCompleted || completedDose.dateScheduled,
        administeredBy: schedule.healthcareProvider?.name || 'Unknown Provider',
        facility: schedule.healthcareProvider?.facility || 'Unknown Facility',
        certificateNumber: certificateNumber,
        nextDueDate: completedDose.doseNumber < schedule.totalDoses ? 
          new Date(completedDose.dateScheduled.getTime() + (schedule.interval * 24 * 60 * 60 * 1000)) : 
          null
      };

      // Add completed vaccination to health card
      (healthCard as any).addCompletedVaccination(vaccinationData);
      
      // Save health card
      await healthCard.save();
      
      console.log(`✅ Completed dose ${completedDose.doseNumber} of ${schedule.vaccineName} synced to health card`);
    } catch (error) {
      console.error('Error syncing completed dose to health card:', error);
    }
  }

  /**
   * Get all available vaccines from the vaccines model
   */
  static async getAvailableVaccines(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, type, search } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter object
      const filter: any = { isActive: true };
      
      if (type) {
        filter.type = type;
      }
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Get vaccines with pagination
      const vaccines = await Vaccine.find(filter)
        .select('vaccineId name description manufacturer type ageGroups sideEffects contraindications')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum);

      // Get total count for pagination
      const total = await Vaccine.countDocuments(filter);

      const pagination: PaginationInfo = {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalRecords: total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPreviousPage: pageNum > 1
      };

      res.status(200).json({
        success: true,
        message: 'Vaccines retrieved successfully',
        data: vaccines,
        pagination
      } as ApiResponse);
    } catch (error) {
      console.error('Error fetching vaccines:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Get a specific vaccine by ID
   */
  static async getVaccineById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { vaccineId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(vaccineId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid vaccine ID format'
        } as ApiResponse);
        return;
      }

      const vaccine = await Vaccine.findById(vaccineId).select('-__v');

      if (!vaccine) {
        res.status(404).json({
          success: false,
          message: 'Vaccine not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Vaccine retrieved successfully',
        data: vaccine
      } as ApiResponse);
    } catch (error) {
      console.error('Error fetching vaccine:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Create a vaccination schedule (supports both manual entry and suggested vaccines)
   */
  static async createSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        vaccineId, // Optional: if provided, use suggested vaccine
        vaccineName, // Required for manual entry
        manufacturer, // Required for manual entry
        totalDoses, // Required for manual entry
        interval, // Required for manual entry
        dateScheduled,
        notes,
        healthcareProvider
      } = req.body;
      
      // Temporary: Use test user ID for testing (replace with your actual test user ID)
      const userId = req.user?.userId || '66b1234567890abcdef12345'; // Replace with your test user ID

      // Validate required fields
      if (!dateScheduled) {
        res.status(400).json({
          success: false,
          message: 'dateScheduled is required'
        } as ApiResponse);
        return;
      }

      let vaccineData: any = {};
      let scheduleData: any = {};

      // Check if using suggested vaccine or manual entry
      if (vaccineId) {
        // Using suggested vaccine from database
        if (!mongoose.Types.ObjectId.isValid(vaccineId)) {
          res.status(400).json({
            success: false,
            message: 'Invalid vaccine ID format'
          } as ApiResponse);
          return;
        }

        // Get vaccine details from database
        const vaccine = await Vaccine.findById(vaccineId);
        if (!vaccine) {
          res.status(404).json({
            success: false,
            message: 'Suggested vaccine not found'
          } as ApiResponse);
          return;
        }

        // Get user details for age validation
        const user = await User.findById(userId);
        if (!user) {
          res.status(404).json({
            success: false,
            message: 'User not found'
          } as ApiResponse);
          return;
        }

        // Calculate user's age
        const userAge = new Date().getFullYear() - user.dateOfBirth.getFullYear();
        
        // Find appropriate age group for the vaccine
        const ageGroup = vaccine.ageGroups.find(ag => 
          userAge >= ag.minAge && userAge <= ag.maxAge
        );

        if (!ageGroup) {
          res.status(400).json({
            success: false,
            message: 'This vaccine is not suitable for your age group'
          } as ApiResponse);
          return;
        }

        vaccineData = {
          vaccineId,
          vaccineName: vaccine.name,
          manufacturer: vaccine.manufacturer,
          totalDoses: ageGroup.doses,
          interval: ageGroup.interval
        };

        scheduleData = {
          userId,
          vaccineId,
          vaccineName: vaccine.name,
          totalDoses: ageGroup.doses,
          interval: ageGroup.interval
        };

        // Check if user already has this vaccine scheduled or completed
        const existingRecord = await VaccinationRecord.findOne({
          userId,
          vaccineId,
          status: { $in: ['scheduled', 'completed'] }
        });

        if (existingRecord) {
          res.status(400).json({
            success: false,
            message: 'This suggested vaccine is already scheduled or completed'
          } as ApiResponse);
          return;
        }
      } else {
        // Manual entry
        if (!vaccineName || !manufacturer || !totalDoses || interval === undefined) {
          res.status(400).json({
            success: false,
            message: 'For manual entry, vaccineName, manufacturer, totalDoses, and interval are required'
          } as ApiResponse);
          return;
        }

        // Validate totalDoses
        if (totalDoses < 1 || totalDoses > 10) {
          res.status(400).json({
            success: false,
            message: 'Total doses must be between 1 and 10'
          } as ApiResponse);
          return;
        }

        // Validate interval
        if (interval < 0) {
          res.status(400).json({
            success: false,
            message: 'Interval cannot be negative'
          } as ApiResponse);
          return;
        }

        vaccineData = {
          vaccineName,
          manufacturer,
          totalDoses,
          interval
        };

        scheduleData = {
          userId,
          vaccineName,
          totalDoses,
          interval
        };

        // Check if user already has this vaccine scheduled or completed
        const existingRecord = await VaccinationRecord.findOne({
          userId,
          vaccineName: { $regex: new RegExp(vaccineName, 'i') },
          status: { $in: ['scheduled', 'completed'] }
        });

        if (existingRecord) {
          res.status(400).json({
            success: false,
            message: 'A similar vaccine is already scheduled or completed'
          } as ApiResponse);
          return;
        }
      }

      // Create vaccination schedule with all doses
      const scheduledDate = new Date(dateScheduled);
      const doses = [];

      for (let doseNumber = 1; doseNumber <= vaccineData.totalDoses; doseNumber++) {
        const doseDate = new Date(scheduledDate);
        doseDate.setDate(doseDate.getDate() + (doseNumber - 1) * vaccineData.interval);

        doses.push({
          doseNumber,
          dateScheduled: doseDate,
          status: 'scheduled',
          notes: notes || ''
        });
      }

      const schedule = new VaccinationRecord({
        ...scheduleData,
        interval: vaccineData.interval,
        doses,
        overallStatus: 'in_progress',
        healthcareProvider: {
          name: healthcareProvider?.name || '',
          facility: healthcareProvider?.facility || '',
          contact: healthcareProvider?.contact || ''
        }
      });

      // Save the schedule
      const savedSchedule = await schedule.save();

      res.status(201).json({
        success: true,
        message: 'Vaccination schedule created successfully',
        data: {
          schedule: savedSchedule,
          vaccine: vaccineData
        }
      } as ApiResponse);
    } catch (error) {
      console.error('Error creating schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Get specific vaccination schedule by ID
   */
  static async getScheduleById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      
      // Temporary: Use test user ID for testing
      const userId = req.user?.userId || '66b1234567890abcdef12345';

      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid schedule ID format'
        } as ApiResponse);
        return;
      }

      const schedule = await VaccinationRecord.findOne({
        _id: scheduleId,
        userId
      }).populate('vaccineId', 'name manufacturer type ageGroups');

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Schedule not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Schedule retrieved successfully',
        data: schedule
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting schedule by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Get user's vaccination schedules
   */
  static async getUserSchedules(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status, vaccineName } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;
      
      // Temporary: Use test user ID for testing (replace with your actual test user ID)
      const userId = req.user?.userId || '66b1234567890abcdef12345'; // Replace with your test user ID

      // Build filter object
      const filter: any = { userId };
      
      if (status) {
        filter.status = status;
      }
      
      if (vaccineName) {
        filter.vaccineName = { $regex: vaccineName, $options: 'i' };
      }

      // Get schedules with pagination
      const schedules = await VaccinationRecord.find(filter)
        .populate('vaccineId', 'name manufacturer type')
        .sort({ dateScheduled: 1 })
        .skip(skip)
        .limit(limitNum);

      // Get total count for pagination
      const total = await VaccinationRecord.countDocuments(filter);

      const pagination: PaginationInfo = {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalRecords: total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPreviousPage: pageNum > 1
      };

      res.status(200).json({
        success: true,
        message: 'Schedules retrieved successfully',
        data: schedules,
        pagination
      } as ApiResponse);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Update vaccination schedule
   */
  static async updateSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { dateScheduled, status, notes, healthcareProvider } = req.body;
      
      // Temporary: Use test user ID for testing (replace with your actual test user ID)
      const userId = req.user?.userId || '66b1234567890abcdef12345'; // Replace with your test user ID

      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid schedule ID format'
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
          message: 'Schedule not found'
        } as ApiResponse);
        return;
      }

      // Update fields
      if (notes !== undefined) {
        schedule.notes = notes;
      }
      if (healthcareProvider) {
        schedule.healthcareProvider = {
          ...schedule.healthcareProvider,
          ...healthcareProvider
        };
      }

      // If marking as completed, set date administered
      if (status === 'completed') {
        // For completed status, we can add a completion date if needed
        // schedule.completedAt = new Date();
      }

      await schedule.save();

      res.status(200).json({
        success: true,
        message: 'Schedule updated successfully',
        data: schedule
      } as ApiResponse);
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Update individual dose status
   */
  static async updateDoseStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId, doseNumber } = req.params;
      const { status, notes, dateCompleted } = req.body;
      
      // Temporary: Use test user ID for testing
      const userId = req.user?.userId || '66b1234567890abcdef12345';

      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid schedule ID format'
        } as ApiResponse);
        return;
      }

      const schedule = await VaccinationRecord.findOne({
        _id: scheduleId,
        userId
      });

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Schedule not found'
        } as ApiResponse);
        return;
      }

      const doseIndex = schedule.doses.findIndex(dose => dose.doseNumber === parseInt(doseNumber));
      
      if (doseIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Dose not found'
        } as ApiResponse);
        return;
      }

      // Update dose status
      if (status) {
        schedule.doses[doseIndex].status = status;
      }

      if (notes) {
        schedule.doses[doseIndex].notes = notes;
      }

      if (dateCompleted) {
        schedule.doses[doseIndex].dateCompleted = new Date(dateCompleted);
      } else if (status === 'completed') {
        schedule.doses[doseIndex].dateCompleted = new Date();
      }

      // Update overall status based on all doses
      const allCompleted = schedule.doses.every(dose => dose.status === 'completed');
      const anyCancelled = schedule.doses.some(dose => dose.status === 'cancelled');
      
      if (allCompleted) {
        schedule.overallStatus = 'completed';
      } else if (anyCancelled) {
        schedule.overallStatus = 'cancelled';
      } else {
        schedule.overallStatus = 'in_progress';
      }

      // Save schedule first
      await schedule.save();

      // If dose was marked as completed, sync to health card
      if (status === 'completed') {
        const completedDose = schedule.doses[doseIndex];
        await ScheduleController.syncCompletedDoseToHealthCard(userId, schedule, completedDose);
      }

      res.status(200).json({
        success: true,
        message: 'Dose status updated successfully',
        data: {
          schedule,
          updatedDose: schedule.doses[doseIndex]
        }
      } as ApiResponse);
    } catch (error) {
      console.error('Error updating dose status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Delete vaccination schedule
   */
  static async deleteSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      
      // Temporary: Use test user ID for testing (replace with your actual test user ID)
      const userId = req.user?.userId || '66b1234567890abcdef12345'; // Replace with your test user ID

      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid schedule ID format'
        } as ApiResponse);
        return;
      }

      // Find and delete the schedule
      const schedule = await VaccinationRecord.findOneAndDelete({
        _id: scheduleId,
        userId
      });

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Schedule not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Schedule deleted successfully',
        data: schedule
      } as ApiResponse);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Sync all completed doses to health card (for existing data)
   */
  static async syncAllCompletedDosesToHealthCard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || '66b1234567890abcdef12345';
      
      // Find all schedules with completed doses
      const schedules = await VaccinationRecord.find({ userId });
      
      let syncedCount = 0;
      
      for (const schedule of schedules) {
        const completedDoses = schedule.doses.filter(dose => dose.status === 'completed');
        
        for (const completedDose of completedDoses) {
          await ScheduleController.syncCompletedDoseToHealthCard(userId, schedule, completedDose);
          syncedCount++;
        }
      }
      
      res.status(200).json({
        success: true,
        message: `Successfully synced ${syncedCount} completed doses to health card`,
        data: { syncedCount }
      } as ApiResponse);
    } catch (error) {
      console.error('Error syncing completed doses:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Get upcoming vaccination schedules
   */
  static async getUpcomingSchedules(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { days = 30 } = req.query;
      const daysNum = parseInt(days as string);
      
      // Temporary: Use test user ID for testing (replace with your actual test user ID)
      const userId = req.user?.userId || '66b1234567890abcdef12345'; // Replace with your test user ID

      const currentDate = new Date();
      const futureDate = new Date();
      futureDate.setDate(currentDate.getDate() + daysNum);

      const upcomingSchedules = await VaccinationRecord.find({
        userId,
        status: 'scheduled',
        dateScheduled: {
          $gte: currentDate,
          $lte: futureDate
        }
      })
        .populate('vaccineId', 'name manufacturer type')
        .sort({ dateScheduled: 1 });

      res.status(200).json({
        success: true,
        message: 'Upcoming schedules retrieved successfully',
        data: upcomingSchedules
      } as ApiResponse);
    } catch (error) {
      console.error('Error fetching upcoming schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }
}
