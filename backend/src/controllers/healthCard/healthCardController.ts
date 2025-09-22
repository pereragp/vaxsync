import { Request, Response } from "express";
import HealthCard from "../../models/healthCard/healthcardModel";
import User from "../../models/userModels/user";
import Dependent from "../../models/userModels/dependent";
import VaccinationRecord from "../../models/scheduleModels/vaccineScheduleModel";
import Vaccine from "../../models/scheduleModels/vaccinesModel";
import { Types } from "mongoose";

// Helper function to sync completed vaccines to health card
export const syncVaccinesToHealthCard = async (scheduleId: string) => {
  try {
    // Get the completed schedule
    const schedule = await VaccinationRecord.findById(scheduleId).populate('vaccineId', 'name manufacturer');
    if (!schedule) {
      console.log(`Schedule ${scheduleId} not found for sync`);
      return;
    }

    // Get completed doses
    const completedDoses = schedule.doses.filter(dose => dose.status === 'completed');
    if (completedDoses.length === 0) {
      console.log(`No completed doses found in schedule ${scheduleId}`);
      return;
    }

    // Prepare vaccination data
    const vaccinationData = completedDoses.map(dose => ({
      vaccineName: schedule.vaccineName,
      manufacturer: (schedule.vaccineId as any)?.manufacturer || 'Unknown',
      doseNumber: dose.doseNumber,
      totalDoses: schedule.totalDoses,
      dateCompleted: dose.dateCompleted || new Date(),
      administeredBy: schedule.healthcareProvider?.name || 'Unknown',
      facility: 'Health Center',
      certificateNumber: `CERT-${Date.now()}-${dose.doseNumber}`,
      notes: dose.notes || ''
    }));

    // Determine if this is for user or dependent
    const isUserSchedule = !schedule.dependentIds || schedule.dependentIds.length === 0;

    if (isUserSchedule) {
      // Sync to user's health card
      const userHealthCard = await HealthCard.findOne({ 
        userId: schedule.userId, 
        cardType: "user" 
      });

      if (userHealthCard) {
        // Merge with existing vaccinations (avoid duplicates)
        const existingVaccinations = userHealthCard.completedVaccinations || [];
        const newVaccinations = vaccinationData.filter(newVaccine => 
          !existingVaccinations.some(existing => 
            existing.vaccineName === newVaccine.vaccineName && 
            existing.doseNumber === newVaccine.doseNumber
          )
        );
        
        userHealthCard.completedVaccinations = [...existingVaccinations, ...newVaccinations];
        await userHealthCard.save();
        console.log(`Synced ${newVaccinations.length} vaccines to user health card ${userHealthCard._id}`);
      }
    } else {
      // Sync to dependent's health card
      for (const dependentId of schedule.dependentIds || []) {
        const dependentHealthCard = await HealthCard.findOne({ 
          dependentId: dependentId, 
          cardType: "dependent" 
        });

        if (dependentHealthCard) {
          // Merge with existing vaccinations (avoid duplicates)
          const existingVaccinations = dependentHealthCard.completedVaccinations || [];
          const newVaccinations = vaccinationData.filter(newVaccine => 
            !existingVaccinations.some(existing => 
              existing.vaccineName === newVaccine.vaccineName && 
              existing.doseNumber === newVaccine.doseNumber
            )
          );
          
          dependentHealthCard.completedVaccinations = [...existingVaccinations, ...newVaccinations];
          await dependentHealthCard.save();
          console.log(`Synced ${newVaccinations.length} vaccines to dependent health card ${dependentHealthCard._id}`);
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
const getAllHealthCardsByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

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
        const completedVaccines = [];
        
        for (const schedule of userSchedules) {
          const completedDoses = schedule.doses.filter(dose => dose.status === 'completed');
          
          for (const dose of completedDoses) {
            completedVaccines.push({
              vaccineName: schedule.vaccineName,
              manufacturer: (schedule.vaccineId as any)?.manufacturer || 'Unknown',
              doseNumber: dose.doseNumber,
              totalDoses: schedule.totalDoses,
              dateCompleted: dose.dateCompleted || new Date(),
              administeredBy: schedule.healthcareProvider?.name || 'Unknown',
              facility: 'Health Center', // Default or from schedule
              certificateNumber: `CERT-${Date.now()}-${dose.doseNumber}`,
              notes: dose.notes || ''
            });
          }
        }

        // Update user's health card with completed vaccinations
        userHealthCard.completedVaccinations = completedVaccines;
        await userHealthCard.save();
        
        syncResults.push({
          cardType: 'user',
          cardId: userHealthCard._id,
          vaccinesAdded: completedVaccines.length
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
          const completedVaccines = [];
          
          for (const dose of completedDoses) {
            completedVaccines.push({
              vaccineName: schedule.vaccineName,
              manufacturer: (schedule.vaccineId as any)?.manufacturer || 'Unknown',
              doseNumber: dose.doseNumber,
              totalDoses: schedule.totalDoses,
              dateCompleted: dose.dateCompleted || new Date(),
              administeredBy: schedule.healthcareProvider?.name || 'Unknown',
              facility: 'Health Center',
              certificateNumber: `CERT-${Date.now()}-${dose.doseNumber}`,
              notes: dose.notes || ''
            });
          }

          // Update dependent's health card
          dependentHealthCard.completedVaccinations = completedVaccines;
          await dependentHealthCard.save();
          
          syncResults.push({
            cardType: 'dependent',
            cardId: dependentHealthCard._id,
            dependentId: dependentId,
            vaccinesAdded: completedVaccines.length
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

export {
  createUserHealthCard,
  createDependentHealthCard,
  createHealthCardsForUserAndDependents,
  getHealthCardByUserId,
  getHealthCardByDependentId,
  getAllHealthCardsByUserId,
  syncCompletedVaccinesToHealthCard,
  getHealthCardWithVaccinations
};
