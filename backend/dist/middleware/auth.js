"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../models/userModels/user"));
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Not Authorized" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await user_1.default.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        req.user = user;
        next();
        return;
    }
    catch (error) {
        res.status(401).json({ message: "Token Failed!!" });
        return;
    }
};
exports.default = protect;
//# sourceMappingURL=auth.js.map