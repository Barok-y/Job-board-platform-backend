import express from "express";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60000,
  legacyHeaders: false,
  standardHeaders: true,
  max: 100,
});

const app = express();

app.use(express.json());
app.use("/api/auth", apiLimiter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

export default app;