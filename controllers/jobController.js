const Job = require('../models/job.js');

exports.createJob = async (req, res, next) => {
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
    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    next(error);
  }
};

exports.updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ error: "Job not found" });

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized: You do not own this listing" });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: "Job updated", job });
  } catch (error) {
    next(error);
  }
};


exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ error: "Job not found" });

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await job.deleteOne();
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    next(error);
  }
};