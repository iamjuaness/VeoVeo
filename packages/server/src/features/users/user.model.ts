import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  selectedAvatar: string;
  moviesWatched: {
    movieId: string;
    count: number;
    duration: number;
    watchedAt: string[];
  }[];
  watchLater: string[];
  seriesWatchLater: string[];
  seriesWatched: {
    seriesId: string;
    episodes: {
      seasonNumber: number;
      episodeNumber: number;
      watchedAt: Date;
    }[];
    isCompleted?: boolean;
  }[];
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  selectedAvatar: { type: String, required: false },
  moviesWatched: [
    {
      movieId: { type: String, required: true },
      count: { type: Number, default: 1 },
      duration: { type: Number, required: true },
      watchedAt: { type: [String], default: [] },
    },
  ],
  watchLater: [String],
  seriesWatchLater: [String],
  seriesWatched: [
    {
      seriesId: { type: String, required: true },
      episodes: [
        {
          seasonNumber: { type: Number, required: true },
          episodeNumber: { type: Number, required: true },
          watchedAt: { type: Date, required: true },
          count: { type: Number, default: 1 },
        },
      ],
      isCompleted: { type: Boolean, default: false },
    },
  ],
});

export default model<IUser>("User", userSchema);
