import express, { Request, Response } from "express";

import FAQ from "../models/FAQ.js";

import {
  verifyAdmin,
  AuthRequest,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
========================================
PUBLIC FAQs
GET /api/faqs
========================================
*/

router.get(
  "/",
  async (req: Request, res: Response) => {
    try {
      const faqs = await FAQ.find({
        published: true,
      }).sort({
        order: 1,
        createdAt: -1,
      });

      return res.status(200).json({
        success: true,
        faqs,
      });
    } catch (error) {
      console.error("Fetch FAQs Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch FAQs",
      });
    }
  }
);

/*
========================================
ADMIN - GET ALL FAQs
GET /api/faqs/admin/all
========================================
*/

router.get(
  "/admin/all",
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const faqs = await FAQ.find().sort({
        order: 1,
        createdAt: -1,
      });

      return res.status(200).json({
        success: true,
        faqs,
      });
    } catch (error) {
      console.error(
        "Fetch Admin FAQs Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch FAQs",
      });
    }
  }
);

/*
========================================
CREATE FAQ
POST /api/faqs
ADMIN ONLY
========================================
*/

router.post(
  "/",
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        question,
        answer,
        order,
        published,
      } = req.body;

      if (!question || !answer) {
        return res.status(400).json({
          success: false,
          message:
            "Question and answer are required",
        });
      }

      const faq = await FAQ.create({
        question,
        answer,
        order: order ?? 0,
        published: published ?? true,
      });

      return res.status(201).json({
        success: true,
        message: "FAQ created successfully",
        faq,
      });
    } catch (error) {
      console.error("Create FAQ Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create FAQ",
      });
    }
  }
);

/*
========================================
UPDATE FAQ
PUT /api/faqs/:id
ADMIN ONLY
========================================
*/

router.put(
  "/:id",
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const faq = await FAQ.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!faq) {
        return res.status(404).json({
          success: false,
          message: "FAQ not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "FAQ updated successfully",
        faq,
      });
    } catch (error) {
      console.error("Update FAQ Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update FAQ",
      });
    }
  }
);

/*
========================================
DELETE FAQ
DELETE /api/faqs/:id
ADMIN ONLY
========================================
*/

router.delete(
  "/:id",
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const faq = await FAQ.findByIdAndDelete(
        req.params.id
      );

      if (!faq) {
        return res.status(404).json({
          success: false,
          message: "FAQ not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "FAQ deleted successfully",
      });
    } catch (error) {
      console.error("Delete FAQ Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete FAQ",
      });
    }
  }
);

export default router;