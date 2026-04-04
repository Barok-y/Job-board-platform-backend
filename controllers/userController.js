import User from "../models/User.js";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }
    res.status(200).json({
      message: "Users retrieved successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("getAllUsers error:", error.message);
    res.status(500).json({ error: "Server error while fetching users" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    if (req.user.id.toString() === id) {
      return res.status(400).json({ error: "You cannot delete your own admin account" });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await User.findByIdAndDelete(id);
    res.status(200).json({
      message: "User deleted successfully",
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("deleteUser error:", error.message);
    res.status(500).json({ error: "Server error while deleting user" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("getUserById error:", error.message);
    res.status(500).json({ error: "Server error while fetching user" });
  }
};

export const requestEmployerRole = async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      companyWebsite,
      businessRegistrationNumber,
      country,
      address,
      phone,
      requestReason,
      documentLinks,
    } = req.body || {};

    const payload = {
      companyName: normalizeText(companyName),
      companyEmail: normalizeText(companyEmail).toLowerCase(),
      companyWebsite: normalizeText(companyWebsite),
      businessRegistrationNumber: normalizeText(businessRegistrationNumber),
      country: normalizeText(country),
      address: normalizeText(address),
      phone: normalizeText(phone),
      requestReason: normalizeText(requestReason),
      documentLinks: Array.isArray(documentLinks)
        ? documentLinks.filter((link) => typeof link === "string" && link.trim()).map((link) => link.trim())
        : [],
    };

    const missingFields = Object.entries({
      companyName: payload.companyName,
      companyEmail: payload.companyEmail,
      companyWebsite: payload.companyWebsite,
      businessRegistrationNumber: payload.businessRegistrationNumber,
      country: payload.country,
      address: payload.address,
      phone: payload.phone,
      requestReason: payload.requestReason,
    })
      .filter(([, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "employer") {
      return res.status(400).json({ error: "User is already an employer" });
    }

    if (user.roleRequestStatus === "pending") {
      return res.status(409).json({ error: "Employer request is already pending" });
    }

    user.requestedRole = "employer";
    user.roleRequestStatus = "pending";
    user.roleRequestNote = payload.requestReason;
    user.employerRequest = {
      ...payload,
      adminReviewNote: undefined,
    };
    user.roleRequestedAt = new Date();
    user.roleReviewedAt = undefined;
    user.roleReviewedBy = undefined;

    await user.save();

    return res.status(200).json({
      message: "Employer role request submitted successfully",
      request: {
        requestedRole: user.requestedRole,
        roleRequestStatus: user.roleRequestStatus,
        roleRequestNote: user.roleRequestNote,
        employerRequest: user.employerRequest,
        roleRequestedAt: user.roleRequestedAt,
      },
    });
  } catch (error) {
    console.error("requestEmployerRole error:", error.message);
    return res.status(500).json({ error: "Server error while requesting employer role" });
  }
};

export const getEmployerRoleRequests = async (req, res) => {
  try {
    const requests = await User.find({
      requestedRole: "employer",
      roleRequestStatus: "pending",
    })
      .select(
        "name email requestedRole roleRequestStatus roleRequestNote employerRequest roleRequestedAt"
      )
      .sort({ roleRequestedAt: -1 });

    return res.status(200).json({
      message: "Employer role requests retrieved successfully",
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("getEmployerRoleRequests error:", error.message);
    return res.status(500).json({ error: "Server error while fetching employer role requests" });
  }
};

export const approveEmployerRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.roleRequestStatus !== "pending" || user.requestedRole !== "employer") {
      return res.status(400).json({ error: "No pending employer request for this user" });
    }

    user.role = "employer";
    user.roleRequestStatus = "approved";
    user.roleReviewedAt = new Date();
    user.roleReviewedBy = req.user.id;

    await user.save();

    return res.status(200).json({
      message: "Employer role approved successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleRequestStatus: user.roleRequestStatus,
      },
    });
  } catch (error) {
    console.error("approveEmployerRole error:", error.message);
    return res.status(500).json({ error: "Server error while approving employer role" });
  }
};

export const rejectEmployerRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.roleRequestStatus !== "pending" || user.requestedRole !== "employer") {
      return res.status(400).json({ error: "No pending employer request for this user" });
    }

    user.roleRequestStatus = "rejected";
    user.roleReviewedAt = new Date();
    user.roleReviewedBy = req.user.id;
    user.roleRequestNote = typeof reason === "string" && reason.trim() ? reason : user.roleRequestNote;
    user.employerRequest = {
      ...user.employerRequest,
      adminReviewNote:
        typeof reason === "string" && reason.trim()
          ? reason.trim()
          : user.employerRequest?.adminReviewNote,
    };

    await user.save();

    return res.status(200).json({
      message: "Employer role request rejected",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleRequestStatus: user.roleRequestStatus,
      },
    });
  } catch (error) {
    console.error("rejectEmployerRole error:", error.message);
    return res.status(500).json({ error: "Server error while rejecting employer role" });
  }
};