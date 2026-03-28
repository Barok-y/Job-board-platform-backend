import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import RefreshToken from "../models/refreshTokenModel.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const role = "job_seeker";

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email and password are required." });
    }
    // Email normalization
    const emailNormalized = email.toLowerCase();
    const emailExists = await User.findOne({ email: emailNormalized });

    if (emailExists) {
      return res.status(409).json({ error: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const access_token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE_DATE,
      }
    );

    const refresh_token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRE_DATE,
      }
    );

    await RefreshToken.create({
      token: refresh_token,
      user: newUser._id,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      access_token: access_token,
      refresh_token: refresh_token,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message, // No guidline put on error messages
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    // Email normalization
    const emailNormalized = email.toLowerCase();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(404).json({
        error: "User not found.", // No guidline put on error messages
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid credential.", // No guidline put on error messages
      });
    }

    const access_token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE_DATE,
      }
    );

    const refresh_token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRE_DATE,
      }
    );

    await RefreshToken.create({
      token: refresh_token,
      user: user._id,
    });

    return res.status(200).json({
      access_token: access_token,
      refresh_token: refresh_token,
      user: {
        id: user._id,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal server error.", // No guidline put on error messages
    });
  }
};

export const logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({
        error: "Refresh token is required.",
      });
    }
    await RefreshToken.deleteOne({ token: refresh_token });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal server error.", // No guidline put on error messages
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(401).json({
        error: "Refresh token missing.",
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refresh_token });
    if (!storedToken) {
      return res.status(403).json({
        error: "Invalid refresh token.",
      });
    }

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);

    const newAccess_token = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE_DATE,
      }
    );

    return res.json({ access_token: newAccess_token });
  } catch (err) {
    return res.status(403).json({
      error: "Invalid or expired refresh token.",
    });
  }
};
