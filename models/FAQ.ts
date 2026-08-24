import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFAQ extends Document {
  question: string;
  answer: string;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      required: true,
      trim: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    published: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const FAQ: Model<IFAQ> =
  mongoose.models.FAQ ||
  mongoose.model<IFAQ>("FAQ", faqSchema);

export default FAQ;