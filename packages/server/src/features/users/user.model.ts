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
  friends: string[];
  friendRequests: {
    _id?: any;
    from: string;
    status: "pending" | "accepted" | "rejected";
    createdAt: Date;
    isRead: boolean;
  }[];
  sentRequests: {
    to: string;
    status: "pending" | "accepted" | "rejected";
    createdAt: Date;
  }[];
  recommendations: {
    from: string;
    mediaId: string;
    mediaType: "movie" | "series";
    mediaTitle?: string;
    mediaPoster?: string;
    message?: string;
    createdAt: Date;
    isRead: boolean;
  }[];
  bio?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    other?: string;
  };
  notificationPreferences: {
    email: boolean;
    push: boolean;
    weekly: boolean;
  };
  privacyPreferences: {
    publicProfile: boolean;
    showActivity: boolean;
    dataAnalytics: boolean;
  };
  appearancePreferences: {
    theme: "light" | "dark";
    language: string;
    region: string;
  };
  publicKey?: string;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  selectedAvatar: { type: String, required: false },
  friends: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  friendRequests: [
    {
      from: { type: Schema.Types.ObjectId, ref: "User", required: true },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      createdAt: { type: Date, default: Date.now },
      isRead: { type: Boolean, default: false },
    },
  ],
  sentRequests: [
    {
      to: { type: Schema.Types.ObjectId, ref: "User", required: true },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  recommendations: [
    {
      from: { type: Schema.Types.ObjectId, ref: "User", required: true },
      mediaId: { type: String, required: true },
      mediaType: { type: String, enum: ["movie", "series"], required: true },
      mediaTitle: { type: String },
      mediaPoster: { type: String },
      message: { type: String },
      createdAt: { type: Date, default: Date.now },
      isRead: { type: Boolean, default: false },
    },
  ],
  bio: { type: String, default: "" },
  socialLinks: {
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    facebook: { type: String, default: "" },
    other: { type: String, default: "" },
  },
  notificationPreferences: {
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
    weekly: { type: Boolean, default: true },
  },
  privacyPreferences: {
    publicProfile: { type: Boolean, default: false },
    showActivity: { type: Boolean, default: true },
    dataAnalytics: { type: Boolean, default: true },
  },
  appearancePreferences: {
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    language: { type: String, default: "Español" },
    region: { type: String, default: "España" },
  },
  publicKey: { type: String, default: "" },
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
