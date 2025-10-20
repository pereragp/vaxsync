import { Request, Response } from 'express';
import geminiService from '../services/geminiService';
import { ApiResponse, AuthRequest } from '../types';

export class GeminiController {
  /**
   * Generate post-vaccination instructions using Gemini AI and send as push notification
   */
  static async generateVaccineInstructions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        dateOfBirth,
        gender,
        vaccineName,
        totalDoses,
        vaccineDate,
        completedDoseNo,
        expoPushToken, // Add this field for push notifications
        userId // Add this to identify the user
      } = req.body;

      // Validate required fields
      if (!dateOfBirth || !vaccineName || !totalDoses || !vaccineDate || !completedDoseNo) {
        res.status(400).json({
          success: false,
          message: "Missing required fields: dateOfBirth, vaccineName, totalDoses, vaccineDate, completedDoseNo"
        } as ApiResponse);
        return;
      }

      // Validate data types
      if (typeof totalDoses !== 'number' || typeof completedDoseNo !== 'number') {
        res.status(400).json({
          success: false,
          message: "totalDoses and completedDoseNo must be numbers"
        } as ApiResponse);
        return;
      }

      if (completedDoseNo > totalDoses) {
        res.status(400).json({
          success: false,
          message: "completedDoseNo cannot be greater than totalDoses"
        } as ApiResponse);
        return;
      }

      // Generate instructions using Gemini service
      const instructions = await geminiService.generateVaccineInstructions({
        dateOfBirth: new Date(dateOfBirth),
        gender,
        vaccineName,
        totalDoses,
        vaccineDate: new Date(vaccineDate),
        completedDoseNo
      });

      res.status(200).json({
        success: true,
        message: "Vaccine instructions generated successfully",
        data: {
          instructions,
          metadata: {
            vaccineName,
            totalDoses,
            completedDoseNo,
            remainingDoses: totalDoses - completedDoseNo,
            generatedAt: new Date()
          }
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Error generating vaccine instructions:', error);
      res.status(500).json({
        success: false,
        message: "Failed to generate vaccine instructions",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }
}