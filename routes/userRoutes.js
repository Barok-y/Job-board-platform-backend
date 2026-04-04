import express from "express";
import { getAllUsers, deleteUser, getUserById } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.status(200).json({ message: "User routes are working" });
});

router.get("/", authMiddleware, authorizeRoles("admin"), getAllUsers);
router.get("/:id", authMiddleware, authorizeRoles("admin"), getUserById);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteUser);

export default router;