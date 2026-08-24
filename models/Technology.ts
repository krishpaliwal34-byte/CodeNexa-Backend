import mongoose, { Document, Schema } from "mongoose";

export interface ITechnology extends Document {
  name: string;
  category: string;
  image: string;
  description: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const technologySchema = new Schema<ITechnology>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
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

const Technology =
  mongoose.models.Technology ||
  mongoose.model<ITechnology>(
    "Technology",
    technologySchema
  );

export default Technology;