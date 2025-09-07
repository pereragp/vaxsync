import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "./config/database";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import userRoutes from "./routes/userRoutes";

// Routes
// import reportRoutes from './routes/reportRoutes/reportRoutes';
// import healthCardRoutes from './routes/reportRoutes/healthCardRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// API routes
// app.use('/api/reports', reportRoutes);
// app.use('/api/health-card', healthCardRoutes);
app.use("/api/user", userRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 VaxSync Backend running on port ${PORT}`);
      console.log(`🔗 Server URL: http://localhost:${PORT}`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
