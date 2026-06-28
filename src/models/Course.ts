import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  title: string;
  shortDescription: string;
  overview: string;
  thumbnailUrl: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  price: number;
  rating: number;
  ratingCount: number;
  durationHours: number;
  instructor: mongoose.Types.ObjectId;
  curriculum: { title: string; durationMinutes: number }[];
  tags: string[];
  createdAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, maxlength: 200 },
    overview: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    category: { type: String, required: true, index: true },
    level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    price: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    durationHours: { type: Number, required: true },
    instructor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    curriculum: [
      {
        title: { type: String, required: true },
        durationMinutes: { type: Number, required: true },
      },
    ],
    tags: [{ type: String, index: true }],
  },
  { timestamps: true }
);

courseSchema.index({ title: "text", shortDescription: "text", tags: "text" });

export default mongoose.model<ICourse>("Course", courseSchema);
