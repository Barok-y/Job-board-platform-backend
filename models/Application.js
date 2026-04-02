const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
    },
    cvUrl:{
        type: String,
        required: true,
        trim: true,
    },
    status:{
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    
}
, { timestamps: true });

// Prevent duplicate applications: one applicant can apply once per job
applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

export default Application;