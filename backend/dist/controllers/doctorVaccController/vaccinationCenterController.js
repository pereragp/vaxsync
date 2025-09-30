"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVaccinationCenterById = exports.getVaccinationCenters = exports.addVaccinationCenter = void 0;
const vaccinationCenterModel_1 = __importDefault(require("../../models/doctorVaccModels/vaccinationCenterModel"));
const addVaccinationCenter = async (req, res) => {
    try {
        const { name, address, district, phone, latitude, longitude, vaccineTypes, availability, openingHours, } = req.body;
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required",
            });
        }
        const newCenter = new vaccinationCenterModel_1.default({
            name,
            address,
            district,
            phone,
            location: { type: "Point", coordinates: [longitude, latitude] },
            vaccineTypes,
            availability,
            openingHours,
        });
        const savedCenter = await newCenter.save();
        return res.status(201).json({
            success: true,
            message: "Vaccination center added successfully",
            data: savedCenter,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error adding vaccination center",
            error: error.message,
        });
    }
};
exports.addVaccinationCenter = addVaccinationCenter;
const getVaccinationCenters = async (req, res) => {
    try {
        const { lat, lng, radius = "5000", limit = "10", type, district, q, } = req.query;
        const filter = {};
        if (type)
            filter.vaccineTypes = { $in: [type] };
        if (district)
            filter.district = new RegExp(district, "i");
        if (q) {
            filter.$or = [
                { name: new RegExp(q, "i") },
                { address: new RegExp(q, "i") },
            ];
        }
        let centers;
        if (lat && lng) {
            centers = await vaccinationCenterModel_1.default.find({
                ...filter,
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [parseFloat(lng), parseFloat(lat)],
                        },
                        $maxDistance: parseInt(radius),
                    },
                },
            }).limit(parseInt(limit));
        }
        else {
            centers = await vaccinationCenterModel_1.default.find(filter).limit(parseInt(limit));
        }
        return res.json({
            success: true,
            message: "Vaccination centers retrieved successfully",
            data: centers,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching vaccination centers",
            error: error.message,
        });
    }
};
exports.getVaccinationCenters = getVaccinationCenters;
const getVaccinationCenterById = async (req, res) => {
    try {
        const center = await vaccinationCenterModel_1.default.findById(req.params.id);
        if (!center) {
            return res.status(404).json({
                success: false,
                message: "Vaccination center not found",
            });
        }
        return res.json({
            success: true,
            message: "Vaccination center retrieved successfully",
            data: center,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching vaccination center",
            error: error.message,
        });
    }
};
exports.getVaccinationCenterById = getVaccinationCenterById;
//# sourceMappingURL=vaccinationCenterController.js.map