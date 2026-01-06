import { Schema, model, Document } from "mongoose";

export interface IMediaCache extends Document {
  id: string;
  type: "movie" | "tvSeries" | "tvMiniSeries";
  title: string;
  year: number;
  endYear?: number;
  genres: string[];
  rating: number;
  description: string;
  poster: string;
  backdrop: string;
  lastUpdated: Date;
}

const MediaCacheSchema = new Schema<IMediaCache>({
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  year: { type: Number, required: true },
  endYear: { type: Number },
  genres: [{ type: String }],
  rating: { type: Number, default: 0 },
  description: { type: String, default: "" },
  poster: { type: String, default: "" },
  backdrop: { type: String, default: "" },
  lastUpdated: { type: Date, default: Date.now },
});

const MediaCacheModel = model<IMediaCache>("MediaCache", MediaCacheSchema);

export default MediaCacheModel;
