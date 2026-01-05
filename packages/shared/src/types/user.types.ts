export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  moviesWatched?: { movieId: string; count: number; duration: number }[];
  watchLater?: string[];
  friends?: string[];
  friendRequests?: import("./social.types").FriendRequest[];
  recommendations?: import("./social.types").Recommendation[];
  bio?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    weekly: boolean;
  };
  privacyPreferences?: {
    publicProfile: boolean;
    showActivity: boolean;
    dataAnalytics: boolean;
  };
  appearancePreferences?: {
    theme: "light" | "dark";
    language: string;
    region: string;
  };
}

export interface AuthPayload {
  id: string;
  name: string;
  email: string;
  avatar: string;
  exp?: number;
  iat?: number;
}
