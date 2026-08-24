import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import Career from "../models/Career.js";

const router = express.Router();
const uploadDir = path.join(process.cwd(), "uploads", "resumes");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}


const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb
  ) => {
    cb(null, uploadDir);
  },

  filename: (
    req: Request,
    file: Express.Multer.File,
    cb
  ) => {
    const extension = path.extname(file.originalname);

    const filename =
      `resume-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(null, filename);
  },
});


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



const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});


router.get(
  "/",
  async (req: Request, res: Response) => {
    try {
      const applications = await Career.find()
        .sort({ createdAt: -1 });

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

router.post(
  "/apply",
  upload.single("resume"),
  async (req: Request, res: Response) => {
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


      if (
        !name ||
        !email ||
        !phone ||
        !position ||
        !experience
      ) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(400).json({
          success: false,
          message:
            "Name, email, phone, position and experience are required.",
        });
      }

      // ===============================================
      // RESUME REQUIRED
      // ===============================================

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Resume is required.",
        });
      }


      const career = await Career.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        position: position.trim(),
        experience: experience.trim(),

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
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          mimetype: req.file.mimetype,
          size: req.file.size,
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
          position: career.position,
          status: career.status,
        },
      });
    } catch (error) {
      console.error(
        "Career Application Error:",
        error
      );



      if (req.file) {
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (fileError) {
          console.error(
            "Resume Delete Error:",
            fileError
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


router.use(
  (
    error: any,
    req: Request,
    res: Response,
    next: express.NextFunction
  ) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
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
        message: error.message,
      });
    }

    next();
  }
);

// =====================================================
// DELETE CAREER APPLICATION
// =====================================================

router.delete(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const career = await Career.findById(id);

      if (!career) {
        return res.status(404).json({
          success: false,
          message: "Career application not found.",
        });
      }

      // Delete uploaded resume from server
      if (career.resume?.path) {
        try {
          if (fs.existsSync(career.resume.path)) {
            fs.unlinkSync(career.resume.path);
          }
        } catch (fileError) {
          console.error(
            "Resume Delete Error:",
            fileError
          );
        }
      }

      // Delete application from MongoDB
      await Career.findByIdAndDelete(id);

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