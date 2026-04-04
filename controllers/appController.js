import Application from "../models/Application.js";
import Job from "../models/job.js";

export const createApplication = async (req, res) => {
  try {
    const { jobId, cvUrl } = req.body;

    if (!jobId || !cvUrl) {
      return res.status(400).json({
        error: "jobId and cvUrl are required fields",
      });
    }

    if (!req.user || req.user.role !== "job_seeker") {
      return res.status(403).json({
        error: "Only job seekers can apply for jobs.",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        error: "Job not found.",
      });
    }

    const existingApplication = await Application.findOne({
      jobId,
      applicantId: req.user.id,
    });
    if (existingApplication) {
      return res.status(409).json({
        error: "You have already applied for this job.",
      });
    }

    const application = await Application.create({
      jobId,
      applicantId: req.user.id,
      cvUrl,
      status: "pending",
    });

    return res.status(201).json({
      message: "Application created successfully.",
      application,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "You have already applied for this job.",
      });
    }

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
};


export const getApplications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const role = req.user?.role;
    const userId = req.user?.id;

    if (!role || !userId) {
      return res.status(401).json({
        error: "Unauthorized.",
      });
    }

    let query = {};

    if (role === "job_seeker") {
      query = { applicantId: userId };
    } else if (role === "employer") {
      const employerJobs = await Job.find({ employer: userId }).select("_id");
      const employerJobIds = employerJobs.map((job) => job._id);

      query = { jobId: { $in: employerJobIds } };
    } else if (role === "admin") {
      query = {};
    } else {
      return res.status(403).json({
        error: "Access denied.",
      });
    }

    const [data, total] = await Promise.all([
      Application.find(query)
        .populate("jobId", "title company location employer")
        .populate("applicantId", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments(query),
    ]);

    return res.status(200).json({
      data,
      page,
      limit,
      total,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!req.user || req.user.role !== "employer") {
      return res.status(403).json({
        error: "Only employers can update application status.",
      });
    }

    // Validate status
    if (!status) {
      return res.status(400).json({
        error: "status is required.",
      });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        error: "status must be either accepted or rejected.",
      });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        error: "Application not found.",
      });
    }

    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(404).json({
        error: "Job not found.",
      });
    }

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        error: "You are not authorized to update this application.",
      });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({
      message: "Application status updated successfully.",
      application,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
};