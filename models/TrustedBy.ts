import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITrustedBy extends Document {
  name: string;
  subtitle: string;
  logo?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const trustedBySchema = new Schema<ITrustedBy>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    subtitle: {
      type: String,
      default: "",
      trim: true,
    },

    logo: {
      type: String,
      default: "",
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

const TrustedBy: Model<ITrustedBy> =
  mongoose.models.TrustedBy ||
  mongoose.model<ITrustedBy>("TrustedBy", trustedBySchema);

export default TrustedBy;