import { Request, Response } from "express";
import { AuthRequest } from "../../types";
import HealthCard from "../../models/healthCard/healthcardModel";
import User from "../../models/userModels/user";
import Dependent from "../../models/userModels/dependent";
import VaccinationRecord from "../../models/scheduleModels/vaccineScheduleModel";
import Vaccine from "../../models/scheduleModels/vaccinesModel";
import { Types } from "mongoose";
import { VaccinationCertificateService, VaccinationCertificateData } from "../../services/vaccinationCertificateService";

// Helper function to sync completed vaccines to health card
export const syncVaccinesToHealthCard = async (scheduleId: string) => {
  try {
    // Get the completed schedule
    const schedule = await VaccinationRecord.findById(scheduleId).populate('vaccineId', 'name manufacturer');
    if (!schedule) {
      console.log(`Schedule ${scheduleId} not found for sync`);
      return;
    }

    // Get completed and cancelled doses
    const completedDoses = schedule.doses.filter(dose => dose.status === 'completed');
    const cancelledDoses = schedule.doses.filter(dose => dose.status === 'cancelled');
    
    if (completedDoses.length === 0 && cancelledDoses.length === 0) {
      console.log(`No completed or cancelled doses found in schedule ${scheduleId}`);
      return;
    }

    // Calculate active doses (excluding cancelled)
    const activeDoses = schedule.totalDoses - cancelledDoses.length;

    // Prepare vaccination data for completed doses
    const completedVaccinationData = completedDoses.map(dose => ({
      vaccineName: schedule.vaccineName,
      manufacturer: (schedule.vaccineId as any)?.manufacturer || 'Unknown',
      doseNumber: dose.doseNumber,
      totalDoses: schedule.totalDoses, // Keep original total
      dateCompleted: dose.dateCompleted || new Date(),
      administeredBy: schedule.healthcareProvider?.name || 'Unknown',
      facility: 'Health Center',
      certificateNumber: `CERT-${Date.now()}-${dose.doseNumber}`,
      notes: dose.notes || '',
      status: 'completed' as const
    }));

    // Prepare vaccination data for cancelled doses
    const cancelledVaccinationData = cancelledDoses.map(dose => ({
      vaccineName: schedule.vaccineName,
      manufacturer: (schedule.vaccineId as any)?.manufacturer || 'Unknown',
      doseNumber: dose.doseNumber,
      totalDoses: schedule.totalDoses, // Keep original total
      dateCompleted: new Date(dose.dateScheduled), // Use scheduled date
      administeredBy: schedule.healthcareProvider?.name || 'Unknown',
      facility: 'Health Center',
      certificateNumber: `CANCELLED-${Date.now()}-${dose.doseNumber}`,
      notes: dose.notes || 'Dose cancelled',
      status: 'cancelled' as const
    }));

    const vaccinationData = [...completedVaccinationData, ...cancelledVaccinationData];

    // Determine if this is for user or dependent
    const isUserSchedule = !schedule.dependentIds || schedule.dependentIds.length === 0;

    if (isUserSchedule) {
      // Sync to user's health card
      const userHealthCard = await HealthCard.findOne({ 
        userId: schedule.userId, 
        cardType: "user" 
      });

      if (userHealthCard) {
        // Merge with existing vaccinations (update if exists, add if new)
        const existingVaccinations = userHealthCard.completedVaccinations || [];
        const updatedVaccinations = [...existingVaccinations];
        
        vaccinationData.forEach(newVaccine => {
          const existingIndex = existingVaccinations.findIndex(existing => 
            existing.vaccineName === newVaccine.vaccineName && 
            existing.doseNumber === newVaccine.doseNumber
          );
          
          if (existingIndex >= 0) {
            // Update existing vaccination with new status
            updatedVaccinations[existingIndex] = newVaccine;
          } else {
            // Add new vaccination
            updatedVaccinations.push(newVaccine);
          }
        });
        
        userHealthCard.completedVaccinations = updatedVaccinations;
        await userHealthCard.save();
        console.log(`Synced ${vaccinationData.length} vaccines to user health card ${userHealthCard._id}`);
      }
    } else {
      // Sync to dependent's health card
      for (const dependentId of schedule.dependentIds || []) {
        const dependentHealthCard = await HealthCard.findOne({ 
          dependentId: dependentId, 
          cardType: "dependent" 
        });

        if (dependentHealthCard) {
          // Merge with existing vaccinations (update if exists, add if new)
          const existingVaccinations = dependentHealthCard.completedVaccinations || [];
          const updatedVaccinations = [...existingVaccinations];
          
          vaccinationData.forEach(newVaccine => {
            const existingIndex = existingVaccinations.findIndex(existing => 
              existing.vaccineName === newVaccine.vaccineName && 
              existing.doseNumber === newVaccine.doseNumber
            );
            
            if (existingIndex >= 0) {
              // Update existing vaccination with new status
              updatedVaccinations[existingIndex] = newVaccine;
            } else {
              // Add new vaccination
              updatedVaccinations.push(newVaccine);
            }
          });
          
          dependentHealthCard.completedVaccinations = updatedVaccinations;
          await dependentHealthCard.save();
          console.log(`Synced ${vaccinationData.length} vaccines to dependent health card ${dependentHealthCard._id}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error syncing vaccines to health card for schedule ${scheduleId}:`, error);
  }
};

// Create health card for a main user
const createUserHealthCard = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if health card already exists for this user
    const existingCard = await HealthCard.findOne({ userId, cardType: "user" });
    if (existingCard) {
      return res.status(400).json({ 
        message: "Health card already exists for this user",
        healthCard: existingCard
      });
    }



    // Get dependents data if any
    const dependents = await Dependent.find({ guardianId: userId });
    const dependentsData = [];
    if (dependents && dependents.length > 0) {
      for (const dependent of dependents) {
        const dependentData = {
          _id: dependent._id, // Include the ObjectId
          dependentId: dependent._id,
          fullName: `${dependent.firstName} ${dependent.lastName}`,
          dateOfBirth: dependent.dateOfBirth,
          gender: dependent.gender,
          dependentType: dependent.dependentType
        };
        dependentsData.push(dependentData);
      }
    }
    

    // Create health card for the user
    const healthCard = new HealthCard({
      fullName: `${user.firstName} ${user.lastName}`,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      userId: user._id,
      cardType: "user",
      dependents: dependentsData
    });

    const savedHealthCard = await healthCard.save();

    return res.status(201).json({
      message: "Health card created successfully",
      healthCard: savedHealthCard
    });
  } catch (error) {
    console.error("Error creating user health card:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Create health card for a dependent
const createDependentHealthCard = async (req: Request, res: Response) => {
  try {
    const { dependentId } = req.params;

    // Check if dependent exists
    const dependent = await Dependent.findById(dependentId);
    if (!dependent) {
      return res.status(404).json({ message: "Dependent not found" });
    }

    // Check if health card already exists for this dependent
    const existingCard = await HealthCard.findOne({ dependentId, cardType: "dependent" });
    if (existingCard) {
      return res.status(400).json({ 
        message: "Health card already exists for this dependent",
        healthCard: existingCard
      });
    }

    // Create health card for the dependent
    const healthCard = new HealthCard({
      fullName: `${dependent.firstName} ${dependent.lastName}`,
      gender: dependent.gender,
      dateOfBirth: dependent.dateOfBirth,
      dependentId: dependent._id,
      cardType: "dependent"
    });

    const savedHealthCard = await healthCard.save();

    return res.status(201).json({
      message: "Health card created successfully for dependent",
      healthCard: savedHealthCard
    });
  } catch (error) {
    console.error("Error creating dependent health card:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Create health cards for user and all their dependents
const createHealthCardsForUserAndDependents = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const createdCards = [];
    const existingCards = [];

    // Get dependents for this user from the Dependent model
    const dependents = await Dependent.find({ guardianId: userId });
    
    const dependentsData = [];
    if (dependents && dependents.length > 0) {
      for (const dependent of dependents) {
        const dependentData = {
          _id: dependent._id,
          dependentId: dependent._id,
          fullName: `${dependent.firstName} ${dependent.lastName}`,
          dateOfBirth: dependent.dateOfBirth,
          gender: dependent.gender,
          dependentType: dependent.dependentType
        };
        dependentsData.push(dependentData);
      }
    }
    

    // Create health card for the main user
    const existingUserCard = await HealthCard.findOne({ userId, cardType: "user" });
    if (!existingUserCard) {
      const userHealthCard = new HealthCard({
        fullName: `${user.firstName} ${user.lastName}`,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        userId: user._id,
        cardType: "user",
        dependents: dependentsData
      });
      const savedUserCard = await userHealthCard.save();
      createdCards.push(savedUserCard);
    } else {
      existingCards.push(existingUserCard);
    }

    // Create health cards for all dependents
    if (dependents && dependents.length > 0) {
      for (const dependent of dependents) {
        const existingDependentCard = await HealthCard.findOne({ 
          dependentId: dependent._id, 
          cardType: "dependent" 
        });
        
        if (!existingDependentCard) {
          const dependentHealthCard = new HealthCard({
            fullName: `${dependent.firstName} ${dependent.lastName}`,
            gender: dependent.gender,
            dateOfBirth: dependent.dateOfBirth,
            dependentId: dependent._id,
            cardType: "dependent"
          });
          const savedDependentCard = await dependentHealthCard.save();
          createdCards.push(savedDependentCard);
        } else {
          existingCards.push(existingDependentCard);
        }
      }
    }

    return res.status(201).json({
      message: "Health cards processing completed",
      createdCards: createdCards,
      existingCards: existingCards,
      summary: {
        totalCreated: createdCards.length,
        totalExisting: existingCards.length
      }
    });
  } catch (error) {
    console.error("Error creating health cards:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get health card by user ID
const getHealthCardByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const healthCard = await HealthCard.findOne({ userId, cardType: "user" });
    if (!healthCard) {
      return res.status(404).json({ message: "Health card not found for this user" });
    }

    return res.status(200).json({
      message: "Health card retrieved successfully",
      healthCard
    });
  } catch (error) {
    console.error("Error retrieving health card:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get health card by dependent ID
const getHealthCardByDependentId = async (req: Request, res: Response) => {
  try {
    const { dependentId } = req.params;

    const healthCard = await HealthCard.findOne({ dependentId, cardType: "dependent" });
    if (!healthCard) {
      return res.status(404).json({ message: "Health card not found for this dependent" });
    }

    return res.status(200).json({
      message: "Health card retrieved successfully",
      healthCard
    });
  } catch (error) {
    console.error("Error retrieving dependent health card:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get all health cards for a user and their dependents
const getAllHealthCardsByUserId = async (req: AuthRequest, res: Response) => {
  try {
    // Get user ID from authenticated user instead of URL parameter
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const healthCards = [];

    // Get user's health card
    const userHealthCard = await HealthCard.findOne({ userId, cardType: "user" });
    if (userHealthCard) {
      healthCards.push(userHealthCard);
    }

    // Get dependents for this user
    const dependents = await Dependent.find({ guardianId: userId });

    // Get dependents' health cards
    if (dependents && dependents.length > 0) {
      for (const dependent of dependents) {
        const dependentHealthCard = await HealthCard.findOne({ 
          dependentId: dependent._id, 
          cardType: "dependent" 
        });
        if (dependentHealthCard) {
          healthCards.push(dependentHealthCard);
        }
      }
    }

    return res.status(200).json({
      message: "Health cards retrieved successfully",
      healthCards,
      count: healthCards.length
    });
  } catch (error) {
    console.error("Error retrieving health cards:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Sync completed vaccines from schedule to health card
const syncCompletedVaccinesToHealthCard = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all completed vaccine schedules for the user (their own and dependents')
    const completedSchedules = await VaccinationRecord.find({
      userId: new Types.ObjectId(userId),
      overallStatus: "completed"
    }).populate('vaccineId', 'name manufacturer');

    const syncResults = [];

    // Sync user's own completed vaccines
    const userSchedules = completedSchedules.filter(schedule => 
      !schedule.dependentIds || schedule.dependentIds.length === 0
    );

    if (userSchedules.length > 0) {
      const userHealthCard = await HealthCard.findOne({ 
        userId: new Types.ObjectId(userId), 
        cardType: "user" 
      });

      if (userHealthCard) {
        const allVaccines = [];
        
        for (const schedule of userSchedules) {
          const completedDoses = schedule.doses.filter(dose => dose.status === 'completed');
          const cancelledDoses = schedule.doses.filter(dose => dose.status === 'cancelled');
          
          // Add completed doses
          for (const dose of completedDoses) {
            allVaccines.push({
              vaccineName: schedule.vaccineName,
              manufacturer: (schedule.vaccineId as any)?.manufacturer || 'Unknown',
              doseNumber: dose.doseNumber,
              totalDoses: schedule.totalDoses,
              dateCompleted: dose.dateCompleted || new Date(),
              administeredBy: schedule.healthcareProvider?.name || 'Unknown',
              facility: 'Health Center',
              certificateNumber: `CERT-${Date.now()}-${dose.doseNumber}`,
              notes: dose.notes || '',
              status: 'completed' as const
            });
          }
          
          // Add cancelled doses
          for (const dose of cancelledDoses) {
            allVaccines.push({
              vaccineName: schedule.vaccineName,
              manufacturer: (schedule.vaccineId as any)?.manufacturer || 'Unknown',
              doseNumber: dose.doseNumber,
              totalDoses: schedule.totalDoses,
              dateCompleted: new Date(dose.dateScheduled),
              administeredBy: schedule.healthcareProvider?.name || 'Unknown',
              facility: 'Health Center',
              certificateNumber: `CANCELLED-${Date.now()}-${dose.doseNumber}`,
              notes: dose.notes || 'Dose cancelled',
              status: 'cancelled' as const
            });
          }
        }

        // Update user's health card with all vaccinations (completed + cancelled)
        userHealthCard.completedVaccinations = allVaccines;
        await userHealthCard.save();
        
        syncResults.push({
          cardType: 'user',
          cardId: userHealthCard._id,
          vaccinesAdded: allVaccines.length
        });
      }
    }

    // Sync dependents' completed vaccines
    const dependentSchedules = completedSchedules.filter(schedule => 
      schedule.dependentIds && schedule.dependentIds.length > 0
    );

    for (const schedule of dependentSchedules) {
      for (const dependentId of schedule.dependentIds || []) {
        const dependentHealthCard = await HealthCard.findOne({ 
          dependentId: dependentId, 
          cardType: "dependent" 
        });

        if (dependentHealthCard) {
          const completedDoses = schedule.doses.filter(dose => dose.status === 'completed');
          const cancelledDosesArr = schedule.doses.filter(dose => dose.status === 'cancelled');
          const allVaccines = [];
          
          // Add completed doses
          for (const dose of completedDoses) {
            allVaccines.push({
              vaccineName: schedule.vaccineName,
              manufacturer: (schedule.vaccineId as any)?.manufacturer || 'Unknown',
              doseNumber: dose.doseNumber,
              totalDoses: schedule.totalDoses,
              dateCompleted: dose.dateCompleted || new Date(),
              administeredBy: schedule.healthcareProvider?.name || 'Unknown',
              facility: 'Health Center',
              certificateNumber: `CERT-${Date.now()}-${dose.doseNumber}`,
              notes: dose.notes || '',
              status: 'completed' as const
            });
          }
          
          // Add cancelled doses
          for (const dose of cancelledDosesArr) {
            allVaccines.push({
              vaccineName: schedule.vaccineName,
              manufacturer: (schedule.vaccineId as any)?.manufacturer || 'Unknown',
              doseNumber: dose.doseNumber,
              totalDoses: schedule.totalDoses,
              dateCompleted: new Date(dose.dateScheduled),
              administeredBy: schedule.healthcareProvider?.name || 'Unknown',
              facility: 'Health Center',
              certificateNumber: `CANCELLED-${Date.now()}-${dose.doseNumber}`,
              notes: dose.notes || 'Dose cancelled',
              status: 'cancelled' as const
            });
          }

          // Update dependent's health card
          dependentHealthCard.completedVaccinations = allVaccines;
          await dependentHealthCard.save();
          
          syncResults.push({
            cardType: 'dependent',
            cardId: dependentHealthCard._id,
            dependentId: dependentId,
            vaccinesAdded: allVaccines.length
          });
        }
      }
    }

    return res.status(200).json({
      message: "Vaccination sync completed successfully",
      syncResults,
      summary: {
        totalCardsUpdated: syncResults.length,
        totalVaccinesSynced: syncResults.reduce((sum, result) => sum + result.vaccinesAdded, 0)
      }
    });
  } catch (error) {
    console.error("Error syncing vaccines to health card:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get health card with completed vaccinations
const getHealthCardWithVaccinations = async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;

    const healthCard = await HealthCard.findById(cardId);
    if (!healthCard) {
      return res.status(404).json({ message: "Health card not found" });
    }

    // Get vaccination statistics
    const completedVaccinations = healthCard.completedVaccinations || [];
    const vaccinationStats = {
      totalVaccinations: completedVaccinations.length,
      lastVaccinationDate: completedVaccinations.length > 0 
        ? completedVaccinations.reduce((latest, vaccine) => 
            new Date(vaccine.dateCompleted) > new Date(latest.dateCompleted) ? vaccine : latest
          ).dateCompleted
        : null,
      vaccinesByType: completedVaccinations.reduce((acc, vaccine) => {
        acc[vaccine.vaccineName] = (acc[vaccine.vaccineName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return res.status(200).json({
      message: "Health card with vaccinations retrieved successfully",
      healthCard,
      vaccinationStats
    });
  } catch (error) {
    console.error("Error retrieving health card with vaccinations:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Delete a specific vaccination from health card
const deleteVaccinationFromHealthCard = async (req: Request, res: Response) => {
  try {
    const { cardId, vaccineName, doseNumber } = req.params;

    // Find the health card
    const healthCard = await HealthCard.findById(cardId);
    if (!healthCard) {
      return res.status(404).json({ message: "Health card not found" });
    }

    // Check if the health card has completed vaccinations
    if (!healthCard.completedVaccinations || healthCard.completedVaccinations.length === 0) {
      return res.status(404).json({ message: "No vaccinations found in this health card" });
    }

    // Decode the vaccine name to handle URL encoding
    const decodedVaccineName = decodeURIComponent(vaccineName);

    // Find the vaccination to delete
    const vaccinationIndex = healthCard.completedVaccinations.findIndex(
      vaccination => 
        vaccination.vaccineName === decodedVaccineName && 
        vaccination.doseNumber === parseInt(doseNumber)
    );

    if (vaccinationIndex === -1) {
      return res.status(404).json({ 
        message: `Vaccination not found: ${decodedVaccineName} dose ${doseNumber}` 
      });
    }

    // Remove the vaccination from the array
    const deletedVaccination = healthCard.completedVaccinations[vaccinationIndex];
    healthCard.completedVaccinations.splice(vaccinationIndex, 1);

    // Save the updated health card
    await healthCard.save();

    return res.status(200).json({
      message: "Vaccination deleted successfully",
      deletedVaccination: {
        vaccineName: deletedVaccination.vaccineName,
        doseNumber: deletedVaccination.doseNumber,
        dateCompleted: deletedVaccination.dateCompleted
      },
      remainingVaccinations: healthCard.completedVaccinations.length
    });
  } catch (error: any) {
    console.error("Error deleting vaccination from health card:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Download vaccination certificate as PDF
const downloadVaccinationCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { cardId } = req.params;
    const { token } = req.query;

    // If token is provided in query, verify it
    if (token && typeof token === 'string') {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Token is valid, continue with download
      } catch (tokenError) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
    } else if (req.user) {
      // JWT middleware has already verified the user
      // Continue with download
    } else {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Find the health card
    const healthCard = await HealthCard.findById(cardId);
    if (!healthCard) {
      return res.status(404).json({ message: "Health card not found" });
    }

    // Check if the health card has completed vaccinations
    if (!healthCard.completedVaccinations || healthCard.completedVaccinations.length === 0) {
      return res.status(404).json({ message: "No vaccinations found to generate certificate" });
    }

    // Generate certificate data
    const certificateData: VaccinationCertificateData = {
      healthCard: healthCard,
      generatedAt: new Date(),
      certificateId: VaccinationCertificateService.generateCertificateId(healthCard._id.toString())
    };

    // Generate PDF certificate
    const pdfBuffer = await VaccinationCertificateService.generateCertificate(certificateData);

    // Set response headers for PDF download
    const fileName = `vaccination-certificate-${healthCard.fullName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    // Send the PDF
    return res.send(pdfBuffer);

  } catch (error: any) {
    console.error("Error generating vaccination certificate:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export {
  createUserHealthCard,
  createDependentHealthCard,
  createHealthCardsForUserAndDependents,
  getHealthCardByUserId,
  getHealthCardByDependentId,
  getAllHealthCardsByUserId,
  syncCompletedVaccinesToHealthCard,
  getHealthCardWithVaccinations,
  deleteVaccinationFromHealthCard,
  downloadVaccinationCertificate
};
