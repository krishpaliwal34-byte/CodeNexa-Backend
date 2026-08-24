import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  "/image",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Image is required",
        });
      }

      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder: "codenexa",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              console.error(
                "Cloudinary Upload Error:",
                error
              );

              return res.status(500).json({
                success: false,
                message: "Failed to upload image",
              });
            }

            return res.status(200).json({
              success: true,
              message: "Image uploaded successfully",
              url: result?.secure_url,
            });
          }
        );

      uploadStream.end(req.file.buffer);
    } catch (error) {
      console.error("Upload Route Error:", error);

      return res.status(500).json({
        success: false,
        message: "Image upload failed",
      });
    }
  }
);

export default router;