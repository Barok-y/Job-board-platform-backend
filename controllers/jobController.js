import Job from "../models/job.js";

export const createJob = async (req, res) => {
  try {
    const { title, description, location, salary, company, requirements } = req.body;

    if (!title || !description || !location || !salary || !company) {
      return res.status(400).json({
        error: "title, description, location, salary, and company are required",
      });
    }
    
    const job = new Job({
      title,
      description,
      location,
      salary,
      company,
      requirements,
      employer: req.user.id 
    });

    await job.save();
    return res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    return res.status(200).json({ count: jobs.length, jobs });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    return res.status(200).json({ job });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ error: "Job not found" });

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized: You do not own this listing" });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ message: "Job updated", job });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};


export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ error: "Job not found" });

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await job.deleteOne();
    return res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};