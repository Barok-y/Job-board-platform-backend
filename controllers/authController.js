import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import RefreshToken from "../models/refreshTokenModel.js";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenService.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const role = "job_seeker";

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required."
      });
    }
    if (password.length < 8) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long." 
    });
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
      email: emailNormalized,
      password: hashedPassword,
      role,
    });

    const access_token = generateAccessToken(newUser);
    const refresh_token = generateRefreshToken(newUser);
    const hashed_token = await bcrypt.hash(refresh_token, 10);

    let expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 90);

    await RefreshToken.create({
      refresh_token: hashed_token,
      user_id: newUser._id,
      expiresAt: expires_at,
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60000
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
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal server error.",
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
    const user = await User.findOne({ email: emailNormalized }).select("+password");
  
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials."
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid credentials."
      });
    }

    const access_token = generateAccessToken(user);
    const refresh_token = generateRefreshToken(user);
    const hashed_token = await bcrypt.hash(refresh_token, 10);

    let expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 90);

    await RefreshToken.findOneAndUpdate(
      {user_id: user._id,},
      { refresh_token: hashed_token,
        expiresAt: expires_at
      },
      {upsert: true, new: true}
    );

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60000
    });

    return res.status(200).json({
      access_token: access_token,
      user: {
        id: user._id,
        role: user.role,
      },
    });
    } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
};

export const logout = async (req, res) => {
    const refresh_token = req.cookies.refresh_token;
    
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax"
    });

    if (refresh_token) {
      try{
        const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
        await RefreshToken.deleteOne({ user_id: decoded.id, });
      }catch(err){
          console.log("Logout token verification/deletion failed: ", err.message);
      }
    }

    return res.status(200).json({
      message: "Logged out successfully.",
    });
};

export const refreshToken = async (req, res) => {
  try {
    const refresh_token = req.cookies.refresh_token;
    if (!refresh_token) {
      return res.status(401).json({
        error: "Refresh token missing.",
      });
    }

    let decoded;
    try{
      decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    }catch(err){
      return res.status(403).json({
        error: "Invalid refresh token."
      });
    }

    const user = await User.findById(decoded.id);
    if(!user){
      return res.status(403).json({
        error: "Invalid refresh token."
      });
    }
    
    const token = await RefreshToken.findOne({ user_id: decoded.id});
    if(!token){
      return res.status(403).json({
        error: "Invalid refresh token."
      });
    }
    if (token.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ user_id: decoded.id});
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax"
      });

      return res.status(403).json({
        error: "Refresh token expired."
      });
    }
    
    const isMatching = await bcrypt.compare(refresh_token, token.refresh_token);
    if (!isMatching) {
      await RefreshToken.deleteOne({ user_id: decoded.id});
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax"
      });

      return res.status(403).json({
        error: "Invalid refresh token."
      });
    }

    const newAccess_token = generateAccessToken(user);
    const newRefresh_token = generateRefreshToken(user);
    const hashed_token = await bcrypt.hash(newRefresh_token,10);

    let expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 90);
    await RefreshToken.findOneAndUpdate(
      { user_id: user._id},
      { refresh_token: hashed_token,
        expiresAt: expires_at,
      }
    );
    res.cookie("refresh_token", newRefresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60000
    });

    return res.json({ access_token: newAccess_token });
  } catch (err) {
    return res.status(403).json({
      error: "Invalid or expired refresh token.",
    });
  }
};
