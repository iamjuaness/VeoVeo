import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import * as SocialService from "../services/social";
import type { FriendRequest, Recommendation } from "@veoveo/shared";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../../../shared/utils/urls";

interface SocialContextType {
  friends: any[];
  requests: FriendRequest[];
  sentRequests: any[];
  recommendations: Recommendation[];
  messages: any[];
  loading: boolean;
  refreshSocialData: () => Promise<void>;
  sendRequest: (toId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  updateProfile: (data: {
    bio?: string;
    socialLinks?: any;
    name?: string;
  }) => Promise<void>;
  sendMessage: (toId: string, content: string) => Promise<void>;
  getMessages: (friendId: string) => Promise<void>;
  recommend: (data: {
    toId: string;
    mediaId: string;
    mediaType: "movie" | "series";
    mediaTitle?: string;
    mediaPoster?: string;
    message?: string;
  }) => Promise<void>;
  search: (query: string) => Promise<any[]>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { token, user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const socketRef = React.useRef<Socket | null>(null);

  const refreshSocialData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await SocialService.getSocialData(token);
      setFriends(data.friends || []);
      setRequests(data.requests || []);
      setSentRequests(data.sentRequests || []);
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Error refreshing social data:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      refreshSocialData();

      // Initialize Socket
      socketRef.current = io(API_BASE_URL, { transports: ["websocket"] });

      socketRef.current.on("connect", () => {
        socketRef.current?.emit("join", user.id || (user as any)._id);
      });

      socketRef.current.on("new-message", (message) => {
        setMessages((prev) => {
          // Prevent duplicates if sender
          if (prev.some((m) => (m._id || m.id) === (message._id || message.id)))
            return prev;
          return [...prev, message];
        });
      });

      socketRef.current.on("friend-request-received", () => {
        refreshSocialData();
      });

      socketRef.current.on("friend-request-response", () => {
        refreshSocialData();
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user, token, refreshSocialData]);

  const sendRequest = async (toId: string) => {
    if (!token) return;
    await SocialService.sendFriendRequest(toId, token);
    await refreshSocialData();
  };

  const acceptRequest = async (requestId: string) => {
    if (!token) return;
    await SocialService.respondToRequest(requestId, "accepted", token);
    await refreshSocialData();
  };

  const rejectRequest = async (requestId: string) => {
    if (!token) return;
    await SocialService.respondToRequest(requestId, "rejected", token);
    await refreshSocialData();
  };

  const removeFriend = async (friendId: string) => {
    if (!token) return;
    await SocialService.removeFriend(friendId, token);
    await refreshSocialData();
  };

  const updateProfile = async (data: {
    bio?: string;
    socialLinks?: any;
    name?: string;
  }) => {
    if (!token) return;
    await SocialService.updateProfile(data, token);
    // Optionally refresh user data if auth context doesn't handle it
  };

  const sendMessage = async (toId: string, content: string) => {
    if (!token) return;
    await SocialService.sendMessage(toId, content, token);
  };

  const getMessages = async (friendId: string) => {
    if (!token) return;
    const msgs = await SocialService.getMessages(friendId, token);
    setMessages(msgs);
  };

  const recommend = async (data: {
    toId: string;
    mediaId: string;
    mediaType: "movie" | "series";
    mediaTitle?: string;
    mediaPoster?: string;
    message?: string;
  }) => {
    if (!token) return;
    await SocialService.recommendMedia(data, token);
  };

  const search = async (query: string) => {
    if (!token) return [];
    return await SocialService.searchUsers(query, token);
  };

  return (
    <SocialContext.Provider
      value={{
        friends,
        requests,
        sentRequests,
        recommendations,
        messages,
        loading,
        refreshSocialData,
        sendRequest,
        acceptRequest,
        rejectRequest,
        removeFriend,
        updateProfile,
        sendMessage,
        getMessages,
        recommend,
        search,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) throw new Error("useSocial must be used within SocialProvider");
  return context;
};
