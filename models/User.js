import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["job_seeker", "employer", "admin"],
        message: "Role must be job_seeker, employer, or admin",
      },
      default: "job_seeker",
    },
    requestedRole: {
      type: String,
      enum: {
        values: ["employer"],
        message: "Only employer role requests are supported",
      },
    },
    roleRequestStatus: {
      type: String,
      enum: {
        values: ["none", "pending", "approved", "rejected"],
        message: "Role request status must be none, pending, approved, or rejected",
      },
      default: "none",
    },
    roleRequestNote: {
      type: String,
      trim: true,
      maxlength: [500, "Role request note cannot exceed 500 characters"],
    },
    employerRequest: {
      companyName: {
        type: String,
        trim: true,
      },
      companyEmail: {
        type: String,
        trim: true,
        lowercase: true,
      },
      companyWebsite: {
        type: String,
        trim: true,
      },
      businessRegistrationNumber: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      requestReason: {
        type: String,
        trim: true,
        maxlength: [1000, "Request reason cannot exceed 1000 characters"],
      },
      documentLinks: [
        {
          type: String,
          trim: true,
        },
      ],
      adminReviewNote: {
        type: String,
        trim: true,
        maxlength: [1000, "Admin review note cannot exceed 1000 characters"],
      },
    },
    roleRequestedAt: {
      type: Date,
    },
    roleReviewedAt: {
      type: Date,
    },
    roleReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);