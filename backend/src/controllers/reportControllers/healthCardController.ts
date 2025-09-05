import { Response } from 'express';
import DigitalHealthCard from '../../models/reportModels/digitalHealthCard';
import VaccinationRecord from '../../models/scheduleModels/vaccineScheduleModel';
import User from '../../models/userModels/user';
import { AuthRequest, ApiResponse } from '../../types';

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
        status: 'completed'
      }).sort({ dateAdministered: -1 });

      // Create health card
      const healthCard = new DigitalHealthCard({
        userId,
        userInfo: {
          fullName: user.name,
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
        healthCard.completedVaccinations.push({
          vaccineName: vaccination.vaccineName,
          manufacturer: 'Unknown', // Not available in VaccinationRecord
          batchNumber: vaccination.batchNumber,
          doseNumber: vaccination.doseNumber,
          totalDoses: vaccination.totalDoses,
          dateAdministered: vaccination.dateAdministered,
          administeredBy: vaccination.healthcareProvider.name,
          facility: vaccination.healthcareProvider.facility,
          certificateNumber: vaccination.certificate.certificateNumber || '',
          nextDueDate: vaccination.nextDueDate
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
          status: 'completed'
        }).sort({ dateAdministered: -1 });

        // Clear existing vaccinations and re-add all completed ones
        healthCard.completedVaccinations = [];
        
        for (const vaccination of completedVaccinations) {
          healthCard.completedVaccinations.push({
            vaccineName: vaccination.vaccineName,
            manufacturer: 'Unknown', // Not available in VaccinationRecord
            batchNumber: vaccination.batchNumber,
            doseNumber: vaccination.doseNumber,
            totalDoses: vaccination.totalDoses,
            dateAdministered: vaccination.dateAdministered,
            administeredBy: vaccination.healthcareProvider.name,
            facility: vaccination.healthcareProvider.facility,
            certificateNumber: vaccination.certificate.certificateNumber || '',
            nextDueDate: vaccination.nextDueDate
          });
        }

        await healthCard.save();
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
          .sort((a: any, b: any) => new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime())
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


}