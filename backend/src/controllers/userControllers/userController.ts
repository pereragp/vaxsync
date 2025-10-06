import { Request, Response } from "express";
import User from "../../models/userModels/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import HealthCard from "../../models/healthCard/healthcardModel";

interface AuthenticatedRequest extends Request {
  user?: any;
}

// User Registration
const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      username,
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      gender,
      bloodType,
      phone,
      avatar,
    } = req.body;

    // Basic validation
    if (
      !username ||
      !firstName ||
      !lastName ||
      !email ||
      !gender ||
      !bloodType ||
      !password ||
      !dateOfBirth ||
      !phone
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate blood type
    const validBloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (!validBloodTypes.includes(bloodType)) {
      return res.status(400).json({
        message:
          "Invalid blood type. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-",
      });
    }

    //username validation
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this username or email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      dateOfBirth,
      gender,
      bloodType,
      phone,
      avatar,
    });

    //Save user to database
    const savedUser = await newUser.save();

    // Automatically create health card for the new user
    try {
      const userHealthCard = new HealthCard({
        fullName: `${savedUser.firstName} ${savedUser.lastName}`,
        gender: savedUser.gender,
        dateOfBirth: savedUser.dateOfBirth,
        userId: savedUser._id,
        cardType: "user",
        dependents: [] // Will be empty initially
      });
      
      await userHealthCard.save();
      console.log(`Health card automatically created for user: ${savedUser._id}`);
    } catch (healthCardError) {
      console.error("Error creating health card during registration:", healthCardError);
      // Don't fail the registration if health card creation fails
    }

    return res.status(201).json({
      message: "User registered successfully",
      _id: savedUser._id,
      username: savedUser.username,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      dateOfBirth: savedUser.dateOfBirth,
      gender: savedUser.gender,
      bloodType: savedUser.bloodType,
      phone: savedUser.phone,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// fetch single user details
const getUserById = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found!!" });
  }

  return res.json({
    _id: user._id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    bloodType: user.bloodType,
    phone: user.phone,
    avatar: user.avatar,
    dependents: user.dependents,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
};

// User Login Controller
const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(401).json({
        message: "Invalid Email",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    //Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }
    const token = jwt.sign(
      { userId: existingUser._id, email: existingUser.email },
      jwtSecret,
      { expiresIn: "60d" }
    );

    // Send user data (excluding sensitive information)
    return res.status(200).json({
      token,
      existingUser: {
        _id: existingUser._id,
        username: existingUser.username,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get Current User Profile (Protected Route)
const getMyProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // The user is already attached to req.user by the auth middleware
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      bloodType: user.bloodType,
      phone: user.phone,
      avatar: user.avatar,
      dependents: user.dependents,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

//Logout Controller
const logoutUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    return res.status(200).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error during logout: ", error);
    return res
      .status(500)
      .json({ message: "Server error during logout", error });
  }
};

//Update user details
const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, dateOfBirth, gender, bloodType, phone } =
      req.body;

    //find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //Update object
    const updatedData: any = {};

    if (firstName) updatedData.firstName = firstName;
    if (lastName) updatedData.lastName = lastName;
    if (dateOfBirth) updatedData.dateOfBirth = dateOfBirth;
    if (gender) updatedData.gender = gender;
    if (bloodType) {
      // Validate blood type if provided
      const validBloodTypes = [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
      ];
      if (!validBloodTypes.includes(bloodType)) {
        return res.status(400).json({
          message:
            "Invalid blood type. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-",
        });
      }
      updatedData.bloodType = bloodType;
    }
    if (phone) updatedData.phone = phone;

    //Update the user
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        bloodType: updatedUser.bloodType,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        dependents: updatedUser.dependents,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating user profile: ", error);
    return res.status(500).json({ message: "Server error.", error });
  }
};

export {
  registerUser,
  getUserById,
  loginUser,
  getMyProfile,
  logoutUser,
  updateProfile,
};
