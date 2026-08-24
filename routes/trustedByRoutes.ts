import express, { Request, Response } from "express";

import TrustedBy from "../models/TrustedBy.js";

import {
  verifyAdmin,
  AuthRequest,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
========================================
GET ALL TRUSTED BY
PUBLIC
========================================
*/

router.get(
  "/",
  async (req: Request, res: Response) => {
    try {
      const trustedBy = await TrustedBy.find()
        .sort({ order: 1, createdAt: 1 });

      return res.status(200).json({
        success: true,
        trustedBy,
      });
    } catch (error) {
      console.error(
        "Fetch Trusted By Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch trusted by",
      });
    }
  }
);


/*
========================================
GET ALL TRUSTED BY
ADMIN
========================================
*/

router.get(
  "/admin/all",
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const trustedBy = await TrustedBy.find()
        .sort({ order: 1, createdAt: 1 });

      return res.status(200).json({
        success: true,
        trustedBy,
      });
    } catch (error) {
      console.error(
        "Admin Trusted By Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch trusted by",
      });
    }
  }
);


/*
========================================
CREATE TRUSTED BY
ADMIN ONLY
========================================
*/

router.post(
  "/",
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        name,
        subtitle,
        logo,
        order,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      const trustedBy = await TrustedBy.create({
        name,
        subtitle: subtitle || "",
        logo: logo || "",
        order: order ?? 0,
      });

      return res.status(201).json({
        success: true,
        message: "Trusted By created successfully",
        trustedBy,
      });
    } catch (error) {
      console.error(
        "Create Trusted By Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to create trusted by",
      });
    }
  }
);


/*
========================================
UPDATE TRUSTED BY
ADMIN ONLY
========================================
*/

router.put(
  "/:id",
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const trustedBy =
        await TrustedBy.findByIdAndUpdate(
          req.params.id,
          {
            name: req.body.name,
            subtitle: req.body.subtitle || "",
            logo: req.body.logo || "",
            order: req.body.order ?? 0,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!trustedBy) {
        return res.status(404).json({
          success: false,
          message: "Trusted By not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Trusted By updated successfully",
        trustedBy,
      });
    } catch (error) {
      console.error(
        "Update Trusted By Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to update trusted by",
      });
    }
  }
);


/*
========================================
DELETE TRUSTED BY
ADMIN ONLY
========================================
*/

router.delete(
  "/:id",
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const trustedBy =
        await TrustedBy.findByIdAndDelete(
          req.params.id
        );

      if (!trustedBy) {
        return res.status(404).json({
          success: false,
          message: "Trusted By not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Trusted By deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete Trusted By Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to delete trusted by",
      });
    }
  }
);

export default router;