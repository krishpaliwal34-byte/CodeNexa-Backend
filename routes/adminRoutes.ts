import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendOTPEmail } from "../utils/sendEmail.js";

import Project from "../models/Project.js";
import Contact from "../models/schema.js";
import Service from "../models/Service.js";
import Technology from "../models/Technology.js";
import Admin from "../models/Admin.js";

import {
  verifyAdmin,
  AuthRequest,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
========================================
ADMIN LOGIN
========================================
*/

router.post(
  "/login",
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const admin = await Admin.findOne({ email });

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        admin.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        return res.status(500).json({
          success: false,
          message: "JWT_SECRET is missing",
        });
      }

      const token = jwt.sign(
        {
          id: admin._id.toString(),
          email: admin.email,
          role: "admin",
        },
        jwtSecret,
        {
          expiresIn: "1d",
        }
      );

      res.cookie("adminToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
        },
      });
    } catch (error) {
      console.error("Admin Login Error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);


/*
========================================
CHECK AUTHENTICATION
========================================
*/

router.get(
  "/me",
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.admin?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const admin = await Admin.findById(
        req.admin.id
      ).select("-password");

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      return res.status(200).json({
        success: true,
        admin,
      });
    } catch (error) {
      console.error("Admin Auth Error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);


/*
========================================
ADMIN DASHBOARD
========================================
*/

router.get(
  "/dashboard",
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const [
        totalProjects,
        totalInquiries,
        totalServices,
        totalTechnologies,
        recentInquiries,
      ] = await Promise.all([
        Project.countDocuments({}),

        Contact.countDocuments({}),

        Service.countDocuments({}),

        Technology.countDocuments({}),

        Contact.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select(
            "name email projectType message createdAt"
          )
          .lean(),
      ]);

      return res.status(200).json({
        success: true,

        stats: {
          totalProjects,
          totalInquiries,
          totalServices,
          totalTechnologies,
        },

        recentInquiries,
      });
    } catch (error) {
      console.error(
        "Admin Dashboard Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to load dashboard data",
      });
    }
  }
);


/*
========================================
LOGOUT
========================================
*/

router.post(
  "/logout",
  (req: Request, res: Response) => {
    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
);


/*
========================================
PROTECTED TEST ROUTE
========================================
*/

router.get(
  "/protected",
  verifyAdmin,
  (req: AuthRequest, res: Response) => {
    return res.status(200).json({
      success: true,
      message:
        "You have access to protected admin API",
      admin: req.admin,
    });
  }
);

// ==========================================
// FORGOT PASSWORD - SEND OTP
// ==========================================

router.post(
  "/forgot-password",
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const normalizedEmail =
        email.toLowerCase().trim();

      const admin = await Admin.findOne({
        email: normalizedEmail,
      });

      // Security:
      // Don't reveal whether the email exists.
      if (!admin) {
        return res.status(200).json({
          success: true,
          message:
            "If an admin account exists with this email, an OTP has been sent.",
        });
      }

      // Generate 6 digit OTP
      const otp = crypto
        .randomInt(100000, 1000000)
        .toString();

      // OTP expires after 10 minutes
      const otpExpires = new Date(
        Date.now() + 10 * 60 * 1000
      );

      // Store OTP
      admin.resetOtp = otp;
      admin.resetOtpExpires = otpExpires;

      await admin.save();

      // Send OTP email
      await sendOTPEmail(
        normalizedEmail,
        otp
      );

      return res.status(200).json({
        success: true,
        message:
          "OTP has been sent to your email.",
      });
    } catch (error) {
      console.error(
        "Forgot Password Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send OTP. Please try again later.",
      });
    }
  }
);


// ==========================================
// VERIFY OTP
// ==========================================

router.post(
  "/verify-otp",
  async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message:
            "Email and OTP are required",
        });
      }

      const normalizedEmail =
        email.toLowerCase().trim();

      const admin = await Admin.findOne({
        email: normalizedEmail,
      });

      if (!admin) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      // Check OTP
      if (
        !admin.resetOtp ||
        admin.resetOtp !== otp
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      // Check expiry
      if (
        !admin.resetOtpExpires ||
        admin.resetOtpExpires.getTime() <
          Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "OTP has expired. Please request a new OTP.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "OTP verified successfully.",
      });
    } catch (error) {
      console.error(
        "Verify OTP Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);


// ==========================================
// RESET PASSWORD
// ==========================================

router.post(
  "/reset-password",
  async (req: Request, res: Response) => {
    try {
      const {
        email,
        otp,
        newPassword,
      } = req.body;

      if (
        !email ||
        !otp ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email, OTP and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters",
        });
      }

      const normalizedEmail =
        email.toLowerCase().trim();

      const admin = await Admin.findOne({
        email: normalizedEmail,
      });

      if (!admin) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
        });
      }

      // Verify OTP again
      if (
        !admin.resetOtp ||
        admin.resetOtp !== otp
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      // Verify expiry again
      if (
        !admin.resetOtpExpires ||
        admin.resetOtpExpires.getTime() <
          Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "OTP has expired. Please request a new OTP.",
        });
      }

      // Hash new password
      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          12
        );

      admin.password = hashedPassword;

      // Invalidate OTP
      admin.resetOtp = undefined;
      admin.resetOtpExpires = undefined;

      await admin.save();

      return res.status(200).json({
        success: true,
        message:
          "Password reset successfully. You can now login.",
      });
    } catch (error) {
      console.error(
        "Reset Password Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

export default router;