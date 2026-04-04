import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { validateJob } from "../validators/jobValidator.js";
import { 
    createJob, 
    deleteJob, 
    getJobById, 
    getJobs, 
    updateJob 
} from "../controllers/jobController.js";

const router = express.Router();


router.get("/", getJobs);
router.get("/:id", getJobById);

router.post(
    "/", 
    authMiddleware, 
    authorizeRoles("employer"), 
    validateJob, 
    createJob
);

router.put(
    "/:id", 
    authMiddleware, 
    authorizeRoles("employer"), 
    validateJob, 
    updateJob
);

router.delete(
    "/:id", 
    authMiddleware, 
    authorizeRoles("employer"), 
    deleteJob
);

export default router;