import mongoose, { Document, Model } from "mongoose";

export interface IStat extends Document {
  label: string;
  value: string;
  description: string;
  icon: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const statSchema = new mongoose.Schema<IStat>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },

    value: {
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
      default: "Award",
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

const Stat: Model<IStat> =
  mongoose.models.Stat ||
  mongoose.model<IStat>("Stat", statSchema);

export default Stat;