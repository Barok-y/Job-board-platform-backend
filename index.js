import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);

    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
    });

    const shutdown = (signal) => {
      logger.warn(`${signal} received. Shutting down...`);
      server.close(() => process.exit(0));
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("unhandledRejection", (err) => {
      logger.error("UNHANDLED REJECTION:", err);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

startServer();