import logger from "../config/logger.js";

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastError = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);
const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} already exists.`, 409);
};
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join(". ")}`, 400);
};
const handleJWTError = () => new AppError("Invalid token. Please log in again.", 401);
const handleJWTExpiredError = () => new AppError("Token expired. Please log in again.", 401);

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    logger.error(err);
    res.status(err.statusCode).json({ error: err.message, stack: err.stack });
  } else {
    let error = { ...err, message: err.message };
    if (err.name === "CastError") error = handleCastError(error);
    if (err.code === 11000) error = handleDuplicateKey(error);
    if (err.name === "ValidationError") error = handleValidationError(error);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

    if (error.isOperational) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error("UNEXPECTED ERROR:", err);
      res.status(500).json({ error: "Something went wrong." });
    }
  }
};