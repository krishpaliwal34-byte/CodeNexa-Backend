import mongoose, { Document, Schema } from "mongoose";

export interface IService extends Document {
  title: string;
  description: string;
  icon: string;
  features: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    icon: {
      type: String,
      required: true,
      trim: true,
    },

    features: {
      type: [String],
      default: [],
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Service =
  mongoose.models.Service ||
  mongoose.model<IService>("Service", serviceSchema);

export default Service;