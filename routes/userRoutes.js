import express from "express";
import {
  getAllUsers,
  deleteUser,
  getUserById,
  requestEmployerRole,
  getEmployerRoleRequests,
  approveEmployerRole,
  rejectEmployerRole,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.status(200).json({ message: "User routes are working" });
});

router.post(
  "/request-employer",
  authMiddleware,
  authorizeRoles("job_seeker"),
  requestEmployerRole
);

router.get(
  "/employer-requests",
  authMiddleware,
  authorizeRoles("admin"),
  getEmployerRoleRequests
);

router.patch(
  "/:id/approve-employer",
  authMiddleware,
  authorizeRoles("admin"),
  approveEmployerRole
);

router.patch(
  "/:id/reject-employer",
  authMiddleware,
  authorizeRoles("admin"),
  rejectEmployerRole
);

router.get("/", authMiddleware, authorizeRoles("admin"), getAllUsers);
router.get("/:id", authMiddleware, authorizeRoles("admin"), getUserById);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteUser);

export default router;