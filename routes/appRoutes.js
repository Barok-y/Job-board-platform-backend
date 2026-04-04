import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';
import { createApplication, getApplications, updateApplicationStatus } from '../controllers/appController.js';

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("job_seeker"), createApplication);
router.get("/", authMiddleware, getApplications);
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("employer"),
  updateApplicationStatus
);

export default router;