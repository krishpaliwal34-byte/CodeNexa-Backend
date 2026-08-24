import express, { Request, Response } from "express";
import multer from "multer";
import Blog from "../models/Blog.js";

import {
  verifyAdmin,
  AuthRequest,
} from "../middleware/authMiddleware.js";

import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/*
========================================
MULTER CONFIG
========================================
*/

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});


/*
========================================
GET ALL BLOGS - ADMIN
========================================
*/

router.get(
  "/admin/all",
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const blogs = await Blog.find().sort({
        createdAt: -1,
      });

      return res.status(200).json({
        success: true,
        blogs,
      });
    } catch (error) {
      console.error(
        "Fetch Admin Blogs Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch blogs",
      });
    }
  }
);


/*
========================================
GET ALL PUBLISHED BLOGS - PUBLIC
========================================
*/

router.get(
  "/",
  async (req: Request, res: Response) => {
    try {
      const blogs = await Blog.find({
        published: true,
      }).sort({
        createdAt: -1,
      });

      return res.status(200).json({
        success: true,
        blogs,
      });
    } catch (error) {
      console.error(
        "Fetch Blogs Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch blogs",
      });
    }
  }
);


/*
========================================
GET SINGLE BLOG BY SLUG
PUBLIC
========================================
*/

router.get(
  "/:slug",
  async (req: Request, res: Response) => {
    try {
      const blog = await Blog.findOne({
        slug: req.params.slug,
        published: true,
      });

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      return res.status(200).json({
        success: true,
        blog,
      });
    } catch (error) {
      console.error(
        "Fetch Blog Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch blog",
      });
    }
  }
);


/*
========================================
CREATE BLOG
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
        title,
        slug,
        excerpt,
        content,
        category,
        author,
        published,
      } = req.body;

      /*
      -------------------------------
      VALIDATION
      -------------------------------
      */

      if (
        !title ||
        !slug ||
        !excerpt ||
        !content ||
        !category
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Required fields are missing",
        });
      }

      /*
      -------------------------------
      CHECK SLUG
      -------------------------------
      */

      const existingBlog =
        await Blog.findOne({ slug });

      if (existingBlog) {
        return res.status(400).json({
          success: false,
          message:
            "A blog with this slug already exists",
        });
      }

      /*
      -------------------------------
      IMAGE REQUIRED
      -------------------------------
      */

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Blog image is required",
        });
      }

      /*
      -------------------------------
      UPLOAD TO CLOUDINARY
      -------------------------------
      */

      const imageUrl =
        await new Promise<string>(
          (resolve, reject) => {
            const uploadStream =
              cloudinary.uploader.upload_stream(
                {
                  folder:
                    "codenexa/blogs",
                  resource_type: "image",
                },
                (
                  error,
                  result
                ) => {
                  if (error) {
                    reject(error);
                  } else if (
                    result?.secure_url
                  ) {
                    resolve(
                      result.secure_url
                    );
                  } else {
                    reject(
                      new Error(
                        "Cloudinary upload failed"
                      )
                    );
                  }
                }
              );

            uploadStream.end(
              req.file!.buffer
            );
          }
        );

      /*
      -------------------------------
      CREATE BLOG
      -------------------------------
      */

      const blog =
        await Blog.create({
          title,
          slug,
          excerpt,
          content,
          image: imageUrl,
          category,
          author:
            author || "CodeNexa",
          published:
            published === "true" ||
            published === true,
        });

      return res.status(201).json({
        success: true,
        message:
          "Blog created successfully",
        blog,
      });
    } catch (error) {
      console.error(
        "Create Blog Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create blog",
      });
    }
  }
);


/*
========================================
UPDATE BLOG
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
      const blog =
        await Blog.findById(
          req.params.id
        );

      if (!blog) {
        return res.status(404).json({
          success: false,
          message:
            "Blog not found",
        });
      }

      /*
      -------------------------------
      UPDATE BASIC FIELDS
      -------------------------------
      */

      const {
        title,
        slug,
        excerpt,
        content,
        category,
        author,
        published,
      } = req.body;

      if (title !== undefined)
        blog.title = title;

      if (slug !== undefined)
        blog.slug = slug;

      if (excerpt !== undefined)
        blog.excerpt = excerpt;

      if (content !== undefined)
        blog.content = content;

      if (category !== undefined)
        blog.category = category;

      if (author !== undefined)
        blog.author = author;

      if (published !== undefined) {
        blog.published =
          published === "true" ||
          published === true;
      }

      /*
      -------------------------------
      NEW IMAGE UPLOAD
      -------------------------------
      */

      if (req.file) {
        const imageUrl =
          await new Promise<string>(
            (resolve, reject) => {
              const uploadStream =
                cloudinary.uploader.upload_stream(
                  {
                    folder:
                      "codenexa/blogs",
                    resource_type:
                      "image",
                  },
                  (
                    error,
                    result
                  ) => {
                    if (error) {
                      reject(error);
                    } else if (
                      result?.secure_url
                    ) {
                      resolve(
                        result.secure_url
                      );
                    } else {
                      reject(
                        new Error(
                          "Cloudinary upload failed"
                        )
                      );
                    }
                  }
                );

              uploadStream.end(
                req.file!.buffer
              );
            }
          );

        blog.image = imageUrl;
      }

      await blog.save();

      return res.status(200).json({
        success: true,
        message:
          "Blog updated successfully",
        blog,
      });
    } catch (error) {
      console.error(
        "Update Blog Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update blog",
      });
    }
  }
);


/*
========================================
DELETE BLOG
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
      const blog =
        await Blog.findByIdAndDelete(
          req.params.id
        );

      if (!blog) {
        return res.status(404).json({
          success: false,
          message:
            "Blog not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Blog deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete Blog Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete blog",
      });
    }
  }
);


export default router;