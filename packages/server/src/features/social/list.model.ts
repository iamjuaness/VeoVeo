import { Schema, model, Document } from "mongoose";

export interface ICustomList extends Document {
  userId: Schema.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  title: string;
  description?: string;
  items: {
    mediaId: string;
    mediaType: "movie" | "series";
    mediaTitle?: string;
    mediaPoster?: string;
    addedAt: Date;
  }[];
  isPublic: boolean;
  likes: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const listSchema = new Schema<ICustomList>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    items: [
      {
        mediaId: { type: String, required: true },
        mediaType: { type: String, enum: ["movie", "series"], required: true },
        mediaTitle: { type: String },
        mediaPoster: { type: String },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    isPublic: { type: Boolean, default: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  },
  { timestamps: true }
);

export default model<ICustomList>("CustomList", listSchema);
