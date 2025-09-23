"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const userRoutes_1 = __importDefault(require("./routes/userRoutes/userRoutes"));
const healthCardRoutes_1 = __importDefault(require("./routes/healthCard/healthCardRoutes"));
const scheduleRoutes_1 = __importDefault(require("./routes/scheduleRoutes/scheduleRoutes"));
const vaccineRoutes_1 = __importDefault(require("./routes/scheduleRoutes/vaccineRoutes"));
const doctorRoutes_1 = __importDefault(require("./routes/doctorVaccRoutes/doctorRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "5000", 10);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "VaxSync Backend API is running",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Server is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
app.use("/api/health-card", healthCardRoutes_1.default);
app.use("/api/v1/schedule", scheduleRoutes_1.default);
app.use("/api/user", userRoutes_1.default);
app.use("/api/vaccines", vaccineRoutes_1.default);
app.use("/api/doctors", doctorRoutes_1.default);
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const startServer = async () => {
    try {
        await (0, database_1.connectDB)();
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 VaxSync Backend running on port ${PORT}`);
            console.log(`🔗 Server URL: http://localhost:${PORT}`);
            console.log(`📱 For mobile access: http://192.168.1.32:${PORT}`);
            console.log(`💚 Health Check: http://192.168.1.32:${PORT}/health`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map