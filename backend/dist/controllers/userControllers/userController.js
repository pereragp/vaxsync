"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.logoutUser = exports.getMyProfile = exports.loginUser = exports.getUserById = exports.registerUser = void 0;
const user_1 = __importDefault(require("../../models/userModels/user"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const healthcardModel_1 = __importDefault(require("../../models/healthCard/healthcardModel"));
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
        try {
            const userHealthCard = new healthcardModel_1.default({
                fullName: `${savedUser.firstName} ${savedUser.lastName}`,
                gender: savedUser.gender,
                dateOfBirth: savedUser.dateOfBirth,
                userId: savedUser._id,
                cardType: "user",
                dependents: []
            });
            await userHealthCard.save();
            console.log(`Health card automatically created for user: ${savedUser._id}`);
        }
        catch (healthCardError) {
            console.error("Error creating health card during registration:", healthCardError);
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
        updatedAt: user.updatedAt,
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
                message: "Invalid Email",
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid password",
            });
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET environment variable is not set");
        }
        const token = jsonwebtoken_1.default.sign({ userId: existingUser._id, email: existingUser.email }, jwtSecret, { expiresIn: "60d" });
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
    }
    catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.loginUser = loginUser;
const getMyProfile = async (req, res) => {
    try {
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
            phone: user.phone,
            avatar: user.avatar,
            dependents: user.dependents,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.getMyProfile = getMyProfile;
const logoutUser = async (req, res) => {
    try {
        return res.status(200).json({
            message: "Logged out successfully",
            success: true,
        });
    }
    catch (error) {
        console.error("Error during logout: ", error);
        return res
            .status(500)
            .json({ message: "Server error during logout", error });
    }
};
exports.logoutUser = logoutUser;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { firstName, lastName, dateOfBirth, gender, phone } = req.body;
        const user = await user_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const updatedData = {};
        if (firstName)
            updatedData.firstName = firstName;
        if (lastName)
            updatedData.lastName = lastName;
        if (dateOfBirth)
            updatedData.dateOfBirth = dateOfBirth;
        if (gender)
            updatedData.gender = gender;
        if (phone)
            updatedData.phone = phone;
        const updatedUser = await user_1.default.findByIdAndUpdate(userId, updatedData, {
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
                phone: updatedUser.phone,
                avatar: updatedUser.avatar,
                dependents: updatedUser.dependents,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
            },
        });
    }
    catch (error) {
        console.error("Error updating user profile: ", error);
        return res.status(500).json({ message: "Server error.", error });
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=userController.js.map