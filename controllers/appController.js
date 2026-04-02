import Application from "../models/Application.js";

export const createApplication = async (req, res) => {
    try{
        const {jobId, cvUrl} = req.body;

        // required validation
        if(!jobId || !cvUrl){
            return res.status(400).json({
                error: "jobId and cvUrl are required fields",
            });
        }

        // Role check: only job seekers can apply for  jobs
        if(!req.user || req.user.role !== "jobseeker"){
            return res.status(403).json({
                error: "only job seekers can apply for jobs"
            });
        }

        // create application with pending status
        const application = await Application.create({
            jobId,
            applicantId: req.user.id,
            cvUrl,
            status: "pending",
        })
        res.status(201).json({
            message: "application created successfully",
            application,
        });
    }catch(err){

        // duplicate key error from unique index(jobId + applicantId)
        if(err.code === 11000){
            return res.status(409).json({
                error: "you have already applied for this job",
            });
        
        }

        return res.status(500).json({
            error: "Internal server error",
        })
    }
}


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

      // Job ownership field is not finalized yet, so employer filtering is blocked for now.
      return res.status(501).json({
        error:
          "Employer application listing is not ready yet. It depends on final job owner field definition in Job model.",
      });
    } else if (role === "admin") {

      // Optional role behavior: admin can view all applications
      query = {};
    } else {
      return res.status(403).json({
        error: "Access denied.",
      });
    }

    const [data, total] = await Promise.all([
      Application.find(query)
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

    // Role check: only employer
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

    // TODO: Replace this temporary response once Job owner field is finalized.
    // Final logic should:
    // 1) Find job by application.jobId
    // 2) Compare job.ownerField with req.user.id
    // 3) Only then update status
    return res.status(501).json({
      error:
        "Status update is temporarily unavailable until Job owner field is finalized for ownership validation.",
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
};