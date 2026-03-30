import Job from "../models/Job.js";

export const getJobs = async (req, res) => {
  try {

    const { keyword, location } = req.query;

    const filter = {};

    if (keyword) {
      filter.title = { $regex: keyword, $options: "i" };
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    const jobs = await Job.find(filter);

    res.json(jobs);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};