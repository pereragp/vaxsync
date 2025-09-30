import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDB, disconnectDB } from "./config/database";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import userRoutes from "./routes/userRoutes/userRoutes";

// Routes
import healthCardRoutes from "./routes/healthCard/healthCardRoutes";
import scheduleRoutes from "./routes/scheduleRoutes/scheduleRoutes";
import vaccineRoutes from "./routes/scheduleRoutes/vaccineRoutes";

import doctorRoutes from './routes/doctorVaccRoutes/doctorRoutes';
import geminiRoutes from './routes/geminiRoutes';
import vaccCenterRoutes from './routes/doctorVaccRoutes/vaccinationCenterRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// Health check routes
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

// API routes
app.use("/api/health-card", healthCardRoutes);
app.use("/api/v1/schedule", scheduleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vaccines", vaccineRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/centers", vaccCenterRoutes);
// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 VaxSync Backend running on port ${PORT}`);
      console.log(`🔗 Server URL: http://localhost:${PORT}`);
      console.log(`📱 For mobile access: http://192.168.1.32:${PORT}`);
      console.log(`💚 Health Check: http://192.168.1.32:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
