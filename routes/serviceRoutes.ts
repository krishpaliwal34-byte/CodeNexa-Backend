import express, {
  Request,
  Response,
} from "express";

import Service from "../models/Service.js";

import {
  verifyAdmin,
  AuthRequest,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
========================================
GET ALL SERVICES - PUBLIC
Website ke liye
========================================
*/

router.get(
  "/",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const services =
        await Service.find().sort({
          order: 1,
          createdAt: 1,
        });

      return res.status(200).json({
        success: true,
        services,
      });
    } catch (error) {
      console.error(
        "Fetch Services Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch services",
      });
    }
  }
);

/*
========================================
GET ALL SERVICES - ADMIN
Published / all services
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
      const services =
        await Service.find().sort({
          order: 1,
          createdAt: 1,
        });

      return res.status(200).json({
        success: true,
        services,
      });
    } catch (error) {
      console.error(
        "Admin Services Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch services",
      });
    }
  }
);

/*
========================================
CREATE SERVICE
ADMIN ONLY
========================================
*/

router.post(
  "/",
  verifyAdmin,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const {
        title,
        description,
        icon,
        features,
        order,
      } = req.body;

      /*
      ----------------------------------------
      VALIDATION
      ----------------------------------------
      */

      if (
        !title ||
        !description ||
        !icon
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Title, description and icon are required",
        });
      }

      /*
      ----------------------------------------
      CREATE
      ----------------------------------------
      */

      const service =
        await Service.create({
          title: title.trim(),

          description:
            description.trim(),

          icon: icon.trim(),

          features:
            Array.isArray(features)
              ? features
              : [],

          order:
            Number(order) || 0,
        });

      return res.status(201).json({
        success: true,
        message:
          "Service created successfully",
        service,
      });
    } catch (error) {
      console.error(
        "Create Service Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create service",
      });
    }
  }
);

/*
========================================
UPDATE SERVICE
ADMIN ONLY
========================================
*/

router.put(
  "/:id",
  verifyAdmin,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const {
        title,
        description,
        icon,
        features,
        order,
      } = req.body;

      const service =
        await Service.findByIdAndUpdate(
          req.params.id,
          {
            ...(title !== undefined && {
              title: title.trim(),
            }),

            ...(description !== undefined && {
              description:
                description.trim(),
            }),

            ...(icon !== undefined && {
              icon: icon.trim(),
            }),

            ...(features !== undefined && {
              features:
                Array.isArray(features)
                  ? features
                  : [],
            }),

            ...(order !== undefined && {
              order:
                Number(order) || 0,
            }),
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!service) {
        return res.status(404).json({
          success: false,
          message:
            "Service not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Service updated successfully",
        service,
      });
    } catch (error) {
      console.error(
        "Update Service Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update service",
      });
    }
  }
);

/*
========================================
DELETE SERVICE
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
      const service =
        await Service.findByIdAndDelete(
          req.params.id
        );

      if (!service) {
        return res.status(404).json({
          success: false,
          message:
            "Service not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Service deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete Service Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete service",
      });
    }
  }
);

export default router;