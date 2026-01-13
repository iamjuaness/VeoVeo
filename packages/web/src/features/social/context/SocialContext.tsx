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
import { generateKeyPair, encryptMessage, decryptMessage } from "../services/crypto";
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
    publicKey?: string;
  }) => Promise<void>;
  sendMessage: (toId: string, content: string) => Promise<void>;
  getMessages: (friendId: string) => Promise<void>;
  deleteChat: (friendId: string) => Promise<void>;
  recommend: (data: {
    toId: string;
    mediaId: string;
    mediaType: "movie" | "series";
    mediaTitle?: string;
    mediaPoster?: string;
    message?: string;
  }) => Promise<void>;
  search: (query: string) => Promise<any[]>;
  publicKey: string | null;
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
  const [keys, setKeys] = useState<{
    publicKey: string;
    privateKey: string;
  } | null>(null);

  // Load or generate keys
  useEffect(() => {
    const loadKeys = async () => {
      const stored = localStorage.getItem("veoveo_chat_keys");
      if (stored) {
        const parsed = JSON.parse(stored);
        setKeys(parsed);
        // Sync public key with server if not already there
        if (token) {
          SocialService.updateProfile({ publicKey: parsed.publicKey }, token);
        }
      } else {
        const newKeys = await generateKeyPair();
        localStorage.setItem("veoveo_chat_keys", JSON.stringify(newKeys));
        setKeys(newKeys);
        if (token) {
          SocialService.updateProfile({ publicKey: newKeys.publicKey }, token);
        }
      }
    };
    if (user && token) {
      loadKeys();
    }
  }, [user, token]);

  const decryptMessageItem = useCallback(
    async (m: any) => {
      if (!keys?.privateKey || !m.encryptedKey || !m.iv) return m;
      const decrypted = await decryptMessage(
        m.content,
        m.encryptedKey,
        m.iv,
        keys.privateKey
      );
      return { ...m, content: decrypted };
    },
    [keys]
  );

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

      socketRef.current.on("new-message", async (message) => {
        const decrypted = await decryptMessageItem(message);
        setMessages((prev) => {
          if (
            prev.some((m) => (m._id || m.id) === (decrypted._id || decrypted.id))
          )
            return prev;
          return [...prev, decrypted];
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
    if (!token || !keys) return;
    try {
      // 1. Get recipient's public key
      const { publicKey: recipientPublicKey } = await SocialService.getPublicKey(
        toId,
        token
      );

      if (!recipientPublicKey) {
        throw new Error("Recipient does not have E2EE enabled");
      }

      // 2. Encrypt message
      const encrypted = await encryptMessage(content, recipientPublicKey);

      // 3. Send encrypted blob
      await SocialService.sendMessage(
        toId,
        encrypted.encryptedContent,
        token,
        encrypted.encryptedKey,
        encrypted.iv
      );
    } catch (err) {
      console.error("Error sending E2EE message:", err);
      // Fallback or alert user
    }
  };

  const getMessages = async (friendId: string) => {
    if (!token) return;
    const msgs = await SocialService.getMessages(friendId, token);
    const decryptedMsgs = await Promise.all(
      msgs.map((m: any) => decryptMessageItem(m))
    );
    setMessages(decryptedMsgs);
  };

  const deleteChat = async (friendId: string) => {
    if (!token) return;
    await SocialService.deleteChat(friendId, token);
    setMessages([]);
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
        deleteChat,
        recommend,
        search,
        publicKey: keys?.publicKey || null,
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
