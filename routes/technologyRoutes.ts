import express, {
  Request,
  Response,
} from "express";

import multer from "multer";

import Technology from "../models/Technology.js";

import cloudinary from "../config/cloudinary.js";

import {
  verifyAdmin,
  AuthRequest,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
========================================
MULTER
========================================
*/

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/*
========================================
CLOUDINARY IMAGE UPLOAD
========================================
*/

const uploadToCloudinary = (
  buffer: Buffer
): Promise<string> => {
  return new Promise(
    (resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              "codenexa/technologies",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(
                new Error(
                  "Cloudinary upload failed"
                )
              );
              return;
            }

            resolve(
              result.secure_url
            );
          }
        );

      stream.end(buffer);
    }
  );
};

/*
========================================
GET ALL TECHNOLOGIES - PUBLIC
========================================
*/

router.get(
  "/",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const technologies =
        await Technology.find().sort({
          order: 1,
          createdAt: 1,
        });

      return res.status(200).json({
        success: true,
        technologies,
      });
    } catch (error) {
      console.error(
        "Fetch Technologies Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch technologies",
      });
    }
  }
);

/*
========================================
GET ALL TECHNOLOGIES - ADMIN
========================================
*/

router.get(
  "/admin/all",
  verifyAdmin,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const technologies =
        await Technology.find().sort({
          order: 1,
          createdAt: 1,
        });

      return res.status(200).json({
        success: true,
        technologies,
      });
    } catch (error) {
      console.error(
        "Admin Technologies Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch technologies",
      });
    }
  }
);

/*
========================================
CREATE TECHNOLOGY
ADMIN ONLY
========================================
*/

router.post(
  "/",
  verifyAdmin,
  upload.single("image"),
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const {
        name,
        category,
        description,
        order,
      } = req.body;

      /*
      ----------------------------------------
      VALIDATION
      ----------------------------------------
      */

      if (
        !name ||
        !category ||
        !description
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, category and description are required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Technology image is required",
        });
      }

      /*
      ----------------------------------------
      CHECK DUPLICATE
      ----------------------------------------
      */

      const existing =
        await Technology.findOne({
          name: name.trim(),
        });

      if (existing) {
        return res.status(400).json({
          success: false,
          message:
            "Technology already exists",
        });
      }

      /*
      ----------------------------------------
      UPLOAD TO CLOUDINARY
      ----------------------------------------
      */

      const imageUrl =
        await uploadToCloudinary(
          req.file.buffer
        );

      /*
      ----------------------------------------
      CREATE TECHNOLOGY
      ----------------------------------------
      */

      const technology =
        await Technology.create({
          name: name.trim(),
          category: category.trim(),
          description:
            description.trim(),
          image: imageUrl,
          order:
            Number(order) || 0,
        });

      return res.status(201).json({
        success: true,
        message:
          "Technology created successfully",
        technology,
      });
    } catch (error) {
      console.error(
        "Create Technology Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create technology",
      });
    }
  }
);

/*
========================================
UPDATE TECHNOLOGY
ADMIN ONLY
========================================
*/

router.put(
  "/:id",
  verifyAdmin,
  upload.single("image"),
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const technology =
        await Technology.findById(
          req.params.id
        );

      if (!technology) {
        return res.status(404).json({
          success: false,
          message:
            "Technology not found",
        });
      }

      const {
        name,
        category,
        description,
        order,
      } = req.body;

      /*
      ----------------------------------------
      UPDATE BASIC DATA
      ----------------------------------------
      */

      if (name !== undefined) {
        technology.name =
          name.trim();
      }

      if (category !== undefined) {
        technology.category =
          category.trim();
      }

      if (
        description !== undefined
      ) {
        technology.description =
          description.trim();
      }

      if (order !== undefined) {
        technology.order =
          Number(order) || 0;
      }

      /*
      ----------------------------------------
      NEW IMAGE?
      ----------------------------------------
      */

      if (req.file) {
        const imageUrl =
          await uploadToCloudinary(
            req.file.buffer
          );

        technology.image =
          imageUrl;
      }

      /*
      ----------------------------------------
      SAVE
      ----------------------------------------
      */

      await technology.save();

      return res.status(200).json({
        success: true,
        message:
          "Technology updated successfully",
        technology,
      });
    } catch (error) {
      console.error(
        "Update Technology Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update technology",
      });
    }
  }
);

/*
========================================
DELETE TECHNOLOGY
ADMIN ONLY
========================================
*/

router.delete(
  "/:id",
  verifyAdmin,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const technology =
        await Technology.findByIdAndDelete(
          req.params.id
        );

      if (!technology) {
        return res.status(404).json({
          success: false,
          message:
            "Technology not found",
        });
      }

      /*
      ----------------------------------------
      DELETE IMAGE FROM CLOUDINARY
      ----------------------------------------
      */

      // Cloudinary image deletion can be
      // added later using public_id.
      // MongoDB record is deleted here.

      return res.status(200).json({
        success: true,
        message:
          "Technology deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete Technology Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete technology",
      });
    }
  }
);

export default router;