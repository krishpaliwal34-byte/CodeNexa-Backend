import mongoose, { Document, Model } from "mongoose";

export interface IContact extends Document {
  name: string;
  email: string;
  projectType: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new mongoose.Schema<IContact>(
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

    projectType: {
      type: String,
      required: true,
      default: "Web Development",
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Contact: Model<IContact> =
  mongoose.models.Contact ||
  mongoose.model<IContact>("Contact", contactSchema);

export default Contact;