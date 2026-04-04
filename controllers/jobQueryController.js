import Job from "../models/job.js";

export const getJobs = async (req, res) => {
  try {
    const { keyword, location, minSalary, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { company: { $regex: keyword, $options: "i" } }
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (minSalary) {
      filter.salary = { $gte: Number(minSalary) };
    }

    const skip = (page - 1) * limit;
    const totalJobs = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      total: totalJobs,
      currentPage: Number(page),
      totalPages: Math.ceil(totalJobs / limit),
      jobs
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch jobs." });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("employer", "name email");
    if (!job) return res.status(404).json({ error: "Job not found" });
    
    return res.status(200).json(job);
  } catch (error) {
    if (error.kind === 'ObjectId') return res.status(400).json({ error: "Invalid ID format" });
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const createJob = async (req, res) => {
  try {
    const { title, description, location, salary, company, requirements } = req.body;
    
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
    return res.status(500).json({ error: "Failed to create job." });
  }
};

export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: You didn't post this job" });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({ message: "Job updated", job: updatedJob });
  } catch (error) {
    if (error.kind === 'ObjectId') return res.status(400).json({ error: "Invalid ID format" });
    return res.status(500).json({ error: "Update failed." });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await job.deleteOne();
    return res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    if (error.kind === 'ObjectId') return res.status(400).json({ error: "Invalid ID format" });
    return res.status(500).json({ error: "Deletion failed." });
  }
};