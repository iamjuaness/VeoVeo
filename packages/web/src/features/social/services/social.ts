import { API_BASE_URL } from "../../../shared/utils/urls";
import { apiClient } from "../../../core/api/apiClient";

const SOCIAL_API = `${API_BASE_URL}api/social`;

export async function getSocialData() {
  const response = await apiClient(SOCIAL_API);
  if (!response.ok) throw new Error("Failed to fetch social data");
  return response.json();
}

export async function sendFriendRequest(toId: string) {
  const response = await apiClient(`${SOCIAL_API}/request`, {
    method: "POST",
    body: JSON.stringify({ toId }),
  });
  if (!response.ok) throw new Error("Failed to send friend request");
  return response.json();
}

export async function respondToRequest(
  requestId: string,
  action: "accepted" | "rejected"
) {
  const response = await apiClient(`${SOCIAL_API}/respond`, {
    method: "POST",
    body: JSON.stringify({ requestId, action }),
  });
  if (!response.ok) throw new Error("Failed to respond to request");
  return response.json();
}

export async function recommendMedia(
  data: {
    toId: string;
    mediaId: string;
    mediaType: "movie" | "series";
    mediaTitle?: string;
    mediaPoster?: string;
    message?: string;
  }
) {
  const response = await apiClient(`${SOCIAL_API}/recommend`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to send recommendation");
  return response.json();
}

export async function searchUsers(query: string) {
  const response = await apiClient(`${SOCIAL_API}/search?query=${query}`);
  if (!response.ok) throw new Error("Failed to search users");
  return response.json();
}

export async function removeFriend(friendId: string) {
  const response = await apiClient(`${SOCIAL_API}/friends/${friendId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to remove friend");
  return response.json();
}

export async function updateProfile(
  data: { bio?: string; socialLinks?: any; name?: string; publicKey?: string }
) {
  const response = await apiClient(`${SOCIAL_API}/profile`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
}

export async function sendMessage(
  toId: string,
  content: string,
  encryptedKey?: string,
  iv?: string
) {
  const response = await apiClient(`${SOCIAL_API}/chat`, {
    method: "POST",
    body: JSON.stringify({ toId, content, encryptedKey, iv }),
  });
  if (!response.ok) throw new Error("Failed to send message");
  return response.json();
}

export async function getMessages(friendId: string) {
  const response = await apiClient(`${SOCIAL_API}/chat/${friendId}`);
  if (!response.ok) throw new Error("Failed to get messages");
  return response.json();
}

export async function getPublicKey(friendId: string) {
  const response = await apiClient(`${SOCIAL_API}/keys/${friendId}`);
  if (!response.ok) throw new Error("Failed to get public key");
  return response.json();
}

export async function deleteChat(friendId: string) {
  const response = await apiClient(`${SOCIAL_API}/chat/${friendId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete chat");
  return response.json();
}

export async function markNotificationsAsRead() {
  const response = await apiClient(`${SOCIAL_API}/mark-read`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to mark notifications as read");
  return response.json();
}

export async function getUserProfile(userId: string) {
  const response = await apiClient(`${SOCIAL_API}/profile/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch user profile");
  return response.json();
}
