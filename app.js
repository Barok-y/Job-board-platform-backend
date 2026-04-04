import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";

import { apiLimiter } from "./middleware/rateLimiter.js";
import { globalErrorHandler, AppError } from "./middleware/errorMiddleware.js";
import logger from "./config/logger.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

// Body parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Rate limiting
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

// Health check
app.get("/health", (req, res) =>
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
);

// Not found handler
app.all("/{*any}", (req, res, next) =>
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404))
);

// Global error handler
app.use(globalErrorHandler);

export default app;