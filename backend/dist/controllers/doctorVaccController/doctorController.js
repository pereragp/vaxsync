"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDoctorById = exports.getDoctors = exports.createDoctor = void 0;
const doctorModel_1 = __importDefault(require("../../models/doctorVaccModels/doctorModel"));
const createDoctor = async (req, res) => {
    try {
        const { name, specialty, hospitals, phoneNumber, rating, availability, imageUrls, doc990Id, doc990Link } = req.body;
        if (!name || !specialty || !hospitals || !phoneNumber || !availability || !imageUrls || !doc990Id || !doc990Link) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }
        const doctor = await doctorModel_1.default.create({
            name,
            specialty,
            hospitals,
            phoneNumber,
            rating: rating || 0,
            availability,
            imageUrls,
            doc990Id,
            doc990Link,
        });
        res.status(201).json({ success: true, message: "Doctor created successfully", data: doctor });
    }
    catch (error) {
        console.error("Error creating doctor:", error);
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((val) => val.message);
            res.status(400).json({ success: false, message: messages.join(", ") });
            return;
        }
        res.status(500).json({ success: false, message: "Failed to add doctor" });
    }
};
exports.createDoctor = createDoctor;
const getDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, message: "Doctors retrieved successfully", data: doctors });
    }
    catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({ success: false, message: "Failed to fetch doctors" });
    }
};
exports.getDoctors = getDoctors;
const getDoctorById = async (req, res) => {
    try {
        const doctor = await doctorModel_1.default.findById(req.params.id);
        if (!doctor) {
            res.status(404).json({ success: false, message: "Doctor not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Doctor retrieved successfully", data: doctor });
    }
    catch (error) {
        console.error("Error fetching doctor:", error);
        res.status(500).json({ success: false, message: "Failed to fetch doctor" });
    }
};
exports.getDoctorById = getDoctorById;
//# sourceMappingURL=doctorController.js.map