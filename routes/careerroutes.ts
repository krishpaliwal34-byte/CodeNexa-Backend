import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

import Career from "../models/Career.js";

const router = express.Router();

/*CLOUDINARY CONFIG*/

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

/* =====================================================
   FILE FILTER
===================================================== */

const fileFilter: multer.Options["fileFilter"] = (
  req,
  file,
  cb
) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const allowedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
  ];

  if (
    allowedTypes.includes(file.mimetype) &&
    allowedExtensions.includes(extension)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, DOC and DOCX files are allowed."
      )
    );
  }
};

/* =====================================================
   MULTER CONFIG
===================================================== */

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});

/* =====================================================
   HELPER
   Upload resume to Cloudinary
===================================================== */

const uploadResumeToCloudinary = (
  file: Express.Multer.File
): Promise<{
  secure_url: string;
  public_id: string;
}> => {
  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder: "codenexa/resumes",

            resource_type: "raw",

            use_filename: true,

            unique_filename: true,

            filename_override:
              file.originalname,
          },

          (error, result) => {
            if (error || !result) {
              return reject(
                error ||
                  new Error(
                    "Cloudinary upload failed."
                  )
              );
            }

            resolve({
              secure_url:
                result.secure_url,

              public_id:
                result.public_id,
            });
          }
        );

      uploadStream.end(file.buffer);
    }
  );
};

/* =====================================================
   GET ALL CAREER APPLICATIONS
===================================================== */

router.get(
  "/",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const applications =
        await Career.find()
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        applications,
      });
    } catch (error) {
      console.error(
        "Career Fetch Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch career applications.",
      });
    }
  }
);

/* =====================================================
   APPLY FOR CAREER
===================================================== */

router.post(
  "/apply",
  upload.single("resume"),

  async (
    req: Request,
    res: Response
  ) => {
    let uploadedPublicId:
      | string
      | null = null;

    try {
      const {
        name,
        email,
        phone,
        position,
        experience,
        linkedin,
        portfolio,
        message,
      } = req.body;

      /* REQUIRED FIELDS */

      if (
        !name ||
        !email ||
        !phone ||
        !position ||
        !experience
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email, phone, position and experience are required.",
        });
      }

      /* RESUME REQUIRED */

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Resume is required.",
        });
      }

      /* CLOUDINARY UPLOAD */

      console.log(
        "Uploading resume to Cloudinary..."
      );

      const uploaded =
        await uploadResumeToCloudinary(
          req.file
        );

      uploadedPublicId =
        uploaded.public_id;

      console.log(
        "Resume uploaded successfully."
      );

      /* SAVE APPLICATION */

      const career =
        await Career.create({
          name: name.trim(),

          email:
            email
              .trim()
              .toLowerCase(),

          phone: phone.trim(),

          position:
            position.trim(),

          experience:
            experience.trim(),

          linkedin: linkedin
            ? linkedin.trim()
            : "",

          portfolio: portfolio
            ? portfolio.trim()
            : "",

          message: message
            ? message.trim()
            : "",

          resume: {
            filename:
              req.file.originalname,

            originalName:
              req.file.originalname,

            path:
              uploaded.secure_url,

            mimetype:
              req.file.mimetype,

            size:
              req.file.size,

            publicId:
              uploaded.public_id,
          },

          status: "New",
        });

      return res.status(201).json({
        success: true,

        message:
          "Career application submitted successfully.",

        application: {
          id: career._id,

          name: career.name,

          email: career.email,

          position:
            career.position,

          status:
            career.status,
        },
      });
    } catch (error) {
      console.error(
        "Career Application Error:",
        error
      );

      /* =================================================
         IF MONGODB SAVE FAILS AFTER CLOUDINARY UPLOAD,
         DELETE THE CLOUDINARY FILE
      ================================================= */

      if (uploadedPublicId) {
        try {
          await cloudinary.uploader.destroy(
            uploadedPublicId,
            {
              resource_type: "raw",
            }
          );

          console.log(
            "Cloudinary resume deleted after failed application."
          );
        } catch (deleteError) {
          console.error(
            "Cloudinary Cleanup Error:",
            deleteError
          );
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to submit career application.",
      });
    }
  }
);

/* =====================================================
   MULTER ERROR HANDLER
===================================================== */

router.use(
  (
    error: any,
    req: Request,
    res: Response,
    next: express.NextFunction
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Resume size must be less than 5MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    next();
  }
);

/*DELETE CAREER APPLICATION*/

router.delete(
  "/:id",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { id } =
        req.params;

      const career =
        await Career.findById(id);

      if (!career) {
        return res.status(404).json({
          success: false,
          message:
            "Career application not found.",
        });
      }

      /* =================================================
         DELETE RESUME FROM CLOUDINARY
      ================================================= */

      const publicId =
        career.resume?.publicId;

      if (publicId) {
        try {
          await cloudinary.uploader.destroy(
            publicId,
            {
              resource_type: "raw",
            }
          );

          console.log(
            "Resume deleted from Cloudinary."
          );
        } catch (cloudinaryError) {
          console.error(
            "Cloudinary Resume Delete Error:",
            cloudinaryError
          );
        }
      }

      /* DELETE APPLICATION */

      await Career.findByIdAndDelete(
        id
      );

      return res.status(200).json({
        success: true,
        message:
          "Career application deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Career Delete Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete career application.",
      });
    }
  }
);

export default router;