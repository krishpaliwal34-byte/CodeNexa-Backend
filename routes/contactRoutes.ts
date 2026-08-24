import express, { Request, Response } from "express";
import Contact from "../models/schema.js";

const router = express.Router();

/*
========================================
CREATE CONTACT INQUIRY
========================================
*/

router.post(
  "/",
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        projectType,
        message,
      } = req.body;

      // Validation
      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and message are required.",
        });
      }

      const contact = await Contact.create({
        name,
        email,
        projectType,
        message,
      });

      return res.status(201).json({
        success: true,
        message:
          "Project inquiry submitted successfully.",
        contact,
      });
    } catch (error) {
      console.error("Contact Error:", error);

      return res.status(500).json({
        success: false,
        message:
          "Failed to submit project inquiry.",
      });
    }
  }
);


/*
========================================
DELETE CONTACT INQUIRY
========================================
*/

router.delete(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const contact = await Contact.findByIdAndDelete(id);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Inquiry not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Inquiry deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete Contact Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to delete inquiry.",
      });
    }
  }
);


/*
========================================
GET ALL CONTACT INQUIRIES
========================================
*/

router.get(
  "/",
  async (req: Request, res: Response) => {
    try {
      const contacts = await Contact.find().sort({
        createdAt: -1,
      });

      return res.status(200).json({
        success: true,
        contacts,
      });
    } catch (error) {
      console.error(
        "Fetch Contacts Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch contacts.",
      });
    }
  }
);

export default router;