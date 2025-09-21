import { Response } from 'express';
import DigitalHealthCard from '../../models/healthCard/healthcardModel';
import VaccinationRecord from '../../models/scheduleModels/vaccineScheduleModel';
import User from '../../models/userModels/user';
import { AuthRequest, ApiResponse } from '../../types';
import geminiService from '../../services/geminiService';

export class HealthCardController {
  /**
   * Get user's digital health card
   */
  static async getHealthCard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      // Find user's health card
      let healthCard = await DigitalHealthCard.findOne({ 
        userId, 
        status: 'active' 
      }).populate('userId', 'name email phone avatar');

      // If no health card exists, create one
      if (!healthCard) {
        const user = await User.findById(userId);
        if (!user) {
          res.status(404).json({
            success: false,
            message: 'User not found'
          } as ApiResponse);
          return;
        }

        healthCard = await HealthCardController.createHealthCard(userId);
      }

      res.status(200).json({
        success: true,
        message: 'Health card retrieved successfully',
        data: {
          healthCard
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Get health card error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve health card',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Create a new health card for user
   */
  static async createHealthCard(userId: string): Promise<any> {
    try {
      // Get user information
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get completed vaccinations
      const completedVaccinations = await VaccinationRecord.find({
        userId,
        'doses.status': 'completed'
      }).sort({ createdAt: -1 });

      // Create health card
      const healthCard = new DigitalHealthCard({
        userId,
        userInfo: {
          fullName: `${user.firstName} ${user.lastName}`,
          dateOfBirth: user.dateOfBirth,
          profilePicture: user.avatar || '',
          emergencyContact: {
            name: '', // You can set this from user profile if available
            phone: user.phone
          }
        },
        completedVaccinations: []
      });

      // Add completed vaccinations to the card
      for (const vaccination of completedVaccinations) {
        // Add each completed dose as a separate entry
        vaccination.doses.forEach((dose: any) => {
          if (dose.status === 'completed') {
            healthCard.completedVaccinations.push({
              vaccineName: vaccination.vaccineName,
              manufacturer: 'Unknown', // Not available in VaccinationRecord
              batchNumber: 'N/A', // Not available in simplified model
              doseNumber: dose.doseNumber,
              totalDoses: vaccination.totalDoses,
              dateScheduled: dose.dateScheduled,
              administeredBy: vaccination.healthcareProvider?.name || 'Unknown',
              facility: vaccination.healthcareProvider?.facility || 'Unknown',
              certificateNumber: 'N/A', // Not available in simplified model
              nextDueDate: undefined // Not available in simplified model
            });
          }
        });
      }

      return await healthCard.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update health card with latest vaccination data
   */
  static async updateHealthCard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      let healthCard = await DigitalHealthCard.findOne({ 
        userId, 
        status: 'active' 
      });

      if (!healthCard) {
        // Create new health card if doesn't exist
        healthCard = await HealthCardController.createHealthCard(userId);
      } else {
        // Sync with latest vaccination records
        const completedVaccinations = await VaccinationRecord.find({
          userId,
          'doses.status': 'completed'
        }).sort({ createdAt: -1 });

        // Clear existing vaccinations and re-add all completed ones
        if (healthCard) {
          healthCard.completedVaccinations = [];
          
          for (const vaccination of completedVaccinations) {
            // Add each completed dose as a separate entry
            vaccination.doses.forEach((dose: any) => {
              if (dose.status === 'completed' && healthCard) {
                healthCard.completedVaccinations.push({
                vaccineName: vaccination.vaccineName,
                manufacturer: 'Unknown', // Not available in VaccinationRecord
                batchNumber: 'N/A', // Not available in simplified model
                doseNumber: dose.doseNumber,
                totalDoses: vaccination.totalDoses,
                dateScheduled: dose.dateScheduled,
                administeredBy: vaccination.healthcareProvider?.name || 'Unknown',
                facility: vaccination.healthcareProvider?.facility || 'Unknown',
                certificateNumber: 'N/A', // Not available in simplified model
                nextDueDate: undefined // Not available in simplified model
              });
            }
          });
        }

        if (healthCard) {
          await healthCard.save();
        }
      }
    }

      res.status(200).json({
        success: true,
        message: 'Health card updated successfully',
        data: {
          healthCard
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Update health card error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update health card',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Get health card by card ID (for verification/sharing)
   */
  static async getHealthCardByCardId(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { cardId } = req.params;

      const healthCard = await DigitalHealthCard.findOne({ 
        cardId, 
        status: 'active' 
      }).populate('userId', 'name email');

      if (!healthCard) {
        res.status(404).json({
          success: false,
          message: 'Health card not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Health card retrieved successfully',
        data: {
          healthCard: {
            cardId: healthCard.cardId,
            cardNumber: healthCard.cardNumber,
            userInfo: healthCard.userInfo,
            completedVaccinations: healthCard.completedVaccinations,
            statistics: healthCard.statistics,
            issuedDate: healthCard.issuedDate,
            lastUpdated: healthCard.lastUpdated
          }
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Get health card by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve health card',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Get health card statistics
   */
  static async getHealthCardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const healthCard = await DigitalHealthCard.findOne({ 
        userId, 
        status: 'active' 
      });

      if (!healthCard) {
        res.status(404).json({
          success: false,
          message: 'Health card not found'
        } as ApiResponse);
        return;
      }

      // Get upcoming vaccinations
      const upcomingVaccinations = await VaccinationRecord.find({
        userId,
        status: 'scheduled',
        dateScheduled: { $gte: new Date() }
      }).limit(5);

      const stats = {
        ...healthCard.statistics,
        upcomingVaccinations: upcomingVaccinations.length,
        cardStatus: healthCard.status,
        cardAge: Math.floor((Date.now() - healthCard.issuedDate.getTime()) / (1000 * 60 * 60 * 24)), // days
        recentVaccinations: healthCard.completedVaccinations
          .sort((a: any, b: any) => new Date(b.dateScheduled).getTime() - new Date(a.dateScheduled).getTime())
          .slice(0, 3)
      };

      res.status(200).json({
        success: true,
        message: 'Health card statistics retrieved successfully',
        data: {
          statistics: stats,
          upcomingVaccinations
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Get health card stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve health card statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Update user info on health card
   */
  static async updateUserInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { fullName, bloodType, emergencyContact, profilePicture } = req.body;

      const healthCard = await DigitalHealthCard.findOne({ 
        userId, 
        status: 'active' 
      });

      if (!healthCard) {
        res.status(404).json({
          success: false,
          message: 'Health card not found'
        } as ApiResponse);
        return;
      }

      // Update user info
      if (fullName) healthCard.userInfo.fullName = fullName;
      if (bloodType) healthCard.userInfo.bloodType = bloodType;
      if (profilePicture) healthCard.userInfo.profilePicture = profilePicture;
      if (emergencyContact) {
        healthCard.userInfo.emergencyContact = {
          name: emergencyContact.name || healthCard.userInfo.emergencyContact?.name || '',
          phone: emergencyContact.phone || healthCard.userInfo.emergencyContact?.phone || ''
        };
      }

      await healthCard.save();

      res.status(200).json({
        success: true,
        message: 'Health card user info updated successfully',
        data: {
          healthCard
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Update user info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user info',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Delete a specific vaccination from health card
   */
  static async deleteVaccination(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, vaccinationId } = req.params;

      const healthCard = await DigitalHealthCard.findOne({ 
        userId, 
        status: 'active' 
      });

      if (!healthCard) {
        res.status(404).json({
          success: false,
          message: 'Health card not found'
        } as ApiResponse);
        return;
      }

      // Find and remove the vaccination
      const vaccinationIndex = healthCard.completedVaccinations.findIndex(
        (vaccination: any) => vaccination._id.toString() === vaccinationId
      );

      if (vaccinationIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Vaccination not found'
        } as ApiResponse);
        return;
      }

      // Remove the vaccination
      healthCard.completedVaccinations.splice(vaccinationIndex, 1);
      healthCard.markModified('completedVaccinations');
      
      await healthCard.save();

      res.status(200).json({
        success: true,
        message: 'Vaccination deleted successfully',
        data: {
          healthCard,
          deletedVaccinationId: vaccinationId
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Delete vaccination error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete vaccination',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Delete multiple vaccinations from health card
   */
  static async deleteMultipleVaccinations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { vaccinationIds } = req.body;

      if (!Array.isArray(vaccinationIds) || vaccinationIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'vaccinationIds must be a non-empty array'
        } as ApiResponse);
        return;
      }

      const healthCard = await DigitalHealthCard.findOne({ 
        userId, 
        status: 'active' 
      });

      if (!healthCard) {
        res.status(404).json({
          success: false,
          message: 'Health card not found'
        } as ApiResponse);
        return;
      }

      // Filter out the vaccinations to be deleted
      const originalCount = healthCard.completedVaccinations.length;
      healthCard.completedVaccinations = healthCard.completedVaccinations.filter(
        (vaccination: any) => !vaccinationIds.includes(vaccination._id.toString())
      );

      const deletedCount = originalCount - healthCard.completedVaccinations.length;
      
      if (deletedCount === 0) {
        res.status(404).json({
          success: false,
          message: 'No vaccinations found with the provided IDs'
        } as ApiResponse);
        return;
      }

      healthCard.markModified('completedVaccinations');
      await healthCard.save();

      res.status(200).json({
        success: true,
        message: `${deletedCount} vaccination(s) deleted successfully`,
        data: {
          healthCard,
          deletedCount,
          deletedVaccinationIds: vaccinationIds
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Delete multiple vaccinations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete vaccinations',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Get AI-generated vaccine instructions for a specific vaccination
   */
  static async getVaccineInstructions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { cardId, vaccinationId } = req.params;

      // Get health card directly using cardId
      const healthCard = await DigitalHealthCard.findOne({ 
        cardId, 
        status: 'active' 
      }).populate('userId', 'gender'); // Populate user to get gender

      if (!healthCard) {
        res.status(404).json({
          success: false,
          message: 'Health card not found'
        } as ApiResponse);
        return;
      }

      // Find specific vaccination record
      const vaccinationRecord = healthCard.completedVaccinations.find(
        (v: any) => v._id.toString() === vaccinationId
      );

      if (!vaccinationRecord) {
        res.status(404).json({
          success: false,
          message: 'Vaccination record not found'
        } as ApiResponse);
        return;
      }

      // Count completed doses for this vaccine
      const completedDosesForVaccine = healthCard.completedVaccinations.filter(
        (v: any) => v.vaccineName === vaccinationRecord.vaccineName
      ).length;

      // Prepare data for Gemini AI
      const userData = {
        dateOfBirth: healthCard.userInfo.dateOfBirth,
       // gender: healthCard.userId?.gender || 'Not specified'
        gender:  'Not specified', // Use populated user's gender
        vaccineName: vaccinationRecord.vaccineName,
        totalDoses: vaccinationRecord.totalDoses,
        vaccineDate: vaccinationRecord.dateScheduled,
        completedDoseNo: completedDosesForVaccine,
        fullName: healthCard.userInfo.fullName // Added fullName
      };

      // Generate AI instructions
      const instructions = await geminiService.generateVaccineInstructions(userData);

      res.status(200).json({
        success: true,
        message: 'Vaccine instructions generated successfully',
        data: {
          vaccinationRecord: {
            vaccineName: vaccinationRecord.vaccineName,
            doseNumber: vaccinationRecord.doseNumber,
            totalDoses: vaccinationRecord.totalDoses,
            dateScheduled: vaccinationRecord.dateScheduled,
            administeredBy: vaccinationRecord.administeredBy,
            facility: vaccinationRecord.facility,
            batchNumber: vaccinationRecord.batchNumber
          },
          instructions
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Get vaccine instructions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate vaccine instructions',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }


}