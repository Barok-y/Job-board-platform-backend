const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");
const { globalErrorHandler, AppError } = require("./middleware/errorMiddleware");
const logger = require("./config/logger");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined", { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use("/api", apiLimiter);

app.get("/health", (req, res) => res.status(200).json({ status: "ok", timestamp: new Date().toISOString() }));

// app.use("/api/auth",         require("./routes/authRoutes"));
// app.use("/api/users",        require("./routes/userRoutes"));
// app.use("/api/jobs",         require("./routes/jobRoutes"));
// app.use("/api/applications", require("./routes/applicationRoutes"));

app.all("/{*any}", (req, res, next) => next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404)));
app.use(globalErrorHandler);

module.exports = app;