import { Request, Response } from "express";
import User from "../../models/userModels/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
      !password ||
      !dateOfBirth ||
      !phone
    ) {
      return res.status(400).json({ message: "All fields are required" });
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
      phone,
      avatar,
    });

    //Save user to database
    const savedUser = await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
      _id: savedUser._id,
      username: savedUser.username,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      dateOfBirth: savedUser.dateOfBirth,
      gender: savedUser.gender,
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

export { registerUser, getUserById, loginUser };
