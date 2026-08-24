import express, {
  Request,
  Response,
} from "express";

import Project from "../models/Project.js";

import {
  verifyAdmin,
  AuthRequest,
} from "../middleware/authMiddleware.js";

import upload from "../middleware/upload.js";

import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/*
========================================
UPLOAD IMAGE TO CLOUDINARY
========================================
*/

const uploadToCloudinary = (
  file: Express.Multer.File
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder: "codenexa/projects",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

    uploadStream.end(file.buffer);
  });
};


/*
========================================
GET ALL PROJECTS - PUBLIC
========================================
*/

router.get(
  "/",
  async (req: Request, res: Response) => {
    try {
      const projects = await Project.find()
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        success: true,
        projects,
      });

    } catch (error) {
      console.error(
        "Fetch Projects Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch projects",
      });
    }
  }
);


/*
========================================
GET ALL PROJECTS - ADMIN
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
      const projects = await Project.find()
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        success: true,
        projects,
      });

    } catch (error) {
      console.error(
        "Admin Projects Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch projects",
      });
    }
  }
);


/*
========================================
CREATE PROJECT
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
        title,
        slug,
        description,
        category,
        technologies,
        liveUrl,
        githubUrl,
        featured,
      } = req.body;


      /*
      ================================
      VALIDATION
      ================================
      */

      if (
        !title ||
        !slug ||
        !description ||
        !category
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Title, slug, description and category are required",
        });
      }


      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Project image is required",
        });
      }


      /*
      ================================
      CHECK SLUG
      ================================
      */

      const existingProject =
        await Project.findOne({
          slug,
        });

      if (existingProject) {
        return res.status(400).json({
          success: false,
          message:
            "A project with this slug already exists",
        });
      }


      /*
      ================================
      UPLOAD TO CLOUDINARY
      ================================
      */

      const uploadedImage =
        await uploadToCloudinary(
          req.file
        );


      /*
      ================================
      TECHNOLOGIES
      ================================
      */

      let parsedTechnologies: string[] = [];

      if (technologies) {
        try {
          parsedTechnologies =
            typeof technologies === "string"
              ? JSON.parse(technologies)
              : technologies;
        } catch {
          parsedTechnologies =
            technologies
              .split(",")
              .map((item: string) =>
                item.trim()
              )
              .filter(Boolean);
        }
      }


      /*
      ================================
      CREATE PROJECT
      ================================
      */

      const project =
        await Project.create({
          title,
          slug,
          description,

          image:
            uploadedImage.secure_url,

          category,

          technologies:
            parsedTechnologies,

          liveUrl:
            liveUrl || "",

          githubUrl:
            githubUrl || "",

          featured:
            featured === "true" ||
            featured === true,
        });


      return res.status(201).json({
        success: true,
        message:
          "Project created successfully",

        project,
      });

    } catch (error) {
      console.error(
        "Create Project Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create project",
      });
    }
  }
);


/*
========================================
UPDATE PROJECT
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

      const {
        title,
        slug,
        description,
        category,
        technologies,
        liveUrl,
        githubUrl,
        featured,
      } = req.body;


      /*
      ================================
      FIND PROJECT
      ================================
      */

      const project =
        await Project.findById(
          req.params.id
        );

      if (!project) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found",
        });
      }


      /*
      ================================
      UPDATE DATA
      ================================
      */

      project.title =
        title ?? project.title;

      project.slug =
        slug ?? project.slug;

      project.description =
        description ??
        project.description;

      project.category =
        category ??
        project.category;

      project.liveUrl =
        liveUrl ?? project.liveUrl;

      project.githubUrl =
        githubUrl ??
        project.githubUrl;


      /*
      ================================
      TECHNOLOGIES
      ================================
      */

      if (technologies) {
        try {
          project.technologies =
            typeof technologies === "string"
              ? JSON.parse(technologies)
              : technologies;
        } catch {
          project.technologies =
            technologies
              .split(",")
              .map((item: string) =>
                item.trim()
              )
              .filter(Boolean);
        }
      }


      /*
      ================================
      FEATURED
      ================================
      */

      if (featured !== undefined) {
        project.featured =
          featured === "true" ||
          featured === true;
      }


      /*
      ================================
      NEW IMAGE
      ================================
      */

      if (req.file) {
        const uploadedImage =
          await uploadToCloudinary(
            req.file
          );

        project.image =
          uploadedImage.secure_url;
      }


      /*
      ================================
      SAVE
      ================================
      */

      await project.save();


      return res.status(200).json({
        success: true,
        message:
          "Project updated successfully",

        project,
      });

    } catch (error) {
      console.error(
        "Update Project Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update project",
      });
    }
  }
);


/*
========================================
DELETE PROJECT
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

      const project =
        await Project.findByIdAndDelete(
          req.params.id
        );

      if (!project) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found",
        });
      }


      return res.status(200).json({
        success: true,
        message:
          "Project deleted successfully",
      });

    } catch (error) {
      console.error(
        "Delete Project Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete project",
      });
    }
  }
);


export default router;