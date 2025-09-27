"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.getUserById = exports.registerUser = void 0;
const user_1 = __importDefault(require("../../models/userModels/user"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const registerUser = async (req, res) => {
    try {
        const { username, firstName, lastName, email, password, dateOfBirth, gender, phone, avatar, } = req.body;
        if (!username ||
            !firstName ||
            !lastName ||
            !email ||
            !gender ||
            !password ||
            !dateOfBirth ||
            !phone) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const userExists = await user_1.default.findOne({ $or: [{ username }, { email }] });
        if (userExists) {
            return res
                .status(400)
                .json({ message: "User with this username or email already exists" });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const newUser = new user_1.default({
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
    }
    catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.registerUser = registerUser;
const getUserById = async (req, res) => {
    const user = await user_1.default.findById(req.params.id);
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
        updatedAt: user.updatedAt
    });
};
exports.getUserById = getUserById;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await user_1.default.findOne({ email });
        if (!existingUser) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid password",
            });
        }
        return res.status(200).json({
            _id: existingUser._id,
            username: existingUser.username,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            email: existingUser.email,
        });
    }
    catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.loginUser = loginUser;
//# sourceMappingURL=userController.js.map