import express from "express";
import { getJobs, getJobById } from "../controllers/jobQueryController.js";

const router = express.Router();

router.get("/", getJobs);
router.get("/:id", getJobById);


export default router;