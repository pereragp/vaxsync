import { Request, Response } from "express";
import HealthCard from "../../models/healthCard/healthcardModel";
import User from "../../models/userModels/user";
import Dependent from "../../models/userModels/dependent";

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
    const dependentsData = [];
    if (user.dependents && user.dependents.length > 0) {
      for (const dependentId of user.dependents) {
        const dependent = await Dependent.findById(dependentId);
        
        if (dependent) {
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
    const user = await User.findById(userId).populate('dependents');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const createdCards = [];
    const existingCards = [];


    
    const dependentsData = [];
    if (user.dependents && user.dependents.length > 0) {
      for (const dependentId of user.dependents) {
        const dependent = await Dependent.findById(dependentId);

        
        if (dependent) {
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
    if (user.dependents && user.dependents.length > 0) {
      for (const dependentId of user.dependents) {
        const dependent = await Dependent.findById(dependentId);
        if (dependent) {
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

    // Get user and populate dependents
    const user = await User.findById(userId).populate('dependents');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const healthCards = [];

    // Get user's health card
    const userHealthCard = await HealthCard.findOne({ userId, cardType: "user" });
    if (userHealthCard) {
      healthCards.push(userHealthCard);
    }

    // Get dependents' health cards
    if (user.dependents && user.dependents.length > 0) {
      for (const dependentId of user.dependents) {
        const dependentHealthCard = await HealthCard.findOne({ 
          dependentId, 
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

export {
  createUserHealthCard,
  createDependentHealthCard,
  createHealthCardsForUserAndDependents,
  getHealthCardByUserId,
  getHealthCardByDependentId,
  getAllHealthCardsByUserId
};
