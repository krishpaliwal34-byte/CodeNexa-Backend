import mongoose, {
  Document,
  Model,
} from "mongoose";

export interface ICareer extends Document {
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  linkedin?: string;
  portfolio?: string;
  message?: string;

  resume: {
    filename: string;
    originalName: string;
    path: string;
    mimetype: string;
    size: number;
    publicId: string;
  };

  status:
    | "New"
    | "Reviewing"
    | "Shortlisted"
    | "Rejected"
    | "Hired";

  createdAt: Date;
  updatedAt: Date;
}

const careerSchema =
  new mongoose.Schema<ICareer>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      position: {
        type: String,
        required: true,
        trim: true,
      },

      experience: {
        type: String,
        required: true,
        trim: true,
      },

      linkedin: {
        type: String,
        trim: true,
        default: "",
      },

      portfolio: {
        type: String,
        trim: true,
        default: "",
      },

      message: {
        type: String,
        trim: true,
        default: "",
      },

      /* ==========================================
         RESUME
      ========================================== */

      resume: {
        filename: {
          type: String,
          required: true,
        },

        originalName: {
          type: String,
          required: true,
        },

        path: {
          type: String,
          required: true,
        },

        mimetype: {
          type: String,
          required: true,
        },

        size: {
          type: Number,
          required: true,
        },

        publicId: {
          type: String,
          required: true,
        },
      },

      /* ==========================================
         STATUS
      ========================================== */

      status: {
        type: String,

        enum: [
          "New",
          "Reviewing",
          "Shortlisted",
          "Rejected",
          "Hired",
        ],

        default: "New",
      },
    },

    {
      timestamps: true,
    }
  );

const Career: Model<ICareer> =
  mongoose.models.Career ||
  mongoose.model<ICareer>(
    "Career",
    careerSchema
  );

export default Career;