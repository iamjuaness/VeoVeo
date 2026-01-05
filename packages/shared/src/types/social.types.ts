export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequest {
  id?: string;
  _id?: string;
  from: {
    id?: string;
    _id?: string;
    name: string;
    avatar?: string;
    selectedAvatar?: string;
    email?: string;
  };
  to: {
    id?: string;
    _id?: string;
    name: string;
    avatar?: string;
    selectedAvatar?: string;
  };
  status: FriendRequestStatus;
  createdAt: Date;
}

export interface Recommendation {
  id?: string;
  _id?: string;
  from: {
    id?: string;
    _id?: string;
    name: string;
    selectedAvatar?: string;
  };
  to: string;
  mediaId: string;
  mediaType: "movie" | "series";
  mediaTitle?: string;
  mediaPoster?: string;
  message?: string;
  createdAt: Date;
}

export interface Message {
  id?: string;
  _id?: string;
  from: string;
  to: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface UserProfile {
  _id?: string;
  name: string;
  email?: string;
  selectedAvatar?: string;
  bio?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    other?: string;
  };
}
