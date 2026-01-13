import { API_BASE_URL } from "../../../shared/utils/urls";

const SOCIAL_API = `${API_BASE_URL}api/social`;

export async function getSocialData(token: string) {
  const response = await fetch(SOCIAL_API, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch social data");
  return response.json();
}

export async function sendFriendRequest(toId: string, token: string) {
  const response = await fetch(`${SOCIAL_API}/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ toId }),
  });
  if (!response.ok) throw new Error("Failed to send friend request");
  return response.json();
}

export async function respondToRequest(
  requestId: string,
  action: "accepted" | "rejected",
  token: string
) {
  const response = await fetch(`${SOCIAL_API}/respond`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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
  },
  token: string
) {
  const response = await fetch(`${SOCIAL_API}/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to send recommendation");
  return response.json();
}

export async function searchUsers(query: string, token: string) {
  const response = await fetch(`${SOCIAL_API}/search?query=${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to search users");
  return response.json();
}

export async function removeFriend(friendId: string, token: string) {
  const response = await fetch(`${SOCIAL_API}/friends/${friendId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to remove friend");
  return response.json();
}

export async function updateProfile(
  data: { bio?: string; socialLinks?: any; name?: string; publicKey?: string },
  token: string
) {
  const response = await fetch(`${SOCIAL_API}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
}

export async function sendMessage(
  toId: string,
  content: string,
  token: string,
  encryptedKey?: string,
  iv?: string
) {
  const response = await fetch(`${SOCIAL_API}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ toId, content, encryptedKey, iv }),
  });
  if (!response.ok) throw new Error("Failed to send message");
  return response.json();
}

export async function getMessages(friendId: string, token: string) {
  const response = await fetch(`${SOCIAL_API}/chat/${friendId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to get messages");
  return response.json();
}

export async function getPublicKey(friendId: string, token: string) {
  const response = await fetch(`${SOCIAL_API}/keys/${friendId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to get public key");
  return response.json();
}

export async function deleteChat(friendId: string, token: string) {
  const response = await fetch(`${SOCIAL_API}/chat/${friendId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to delete chat");
  return response.json();
}

export async function markNotificationsAsRead(token: string) {
  const response = await fetch(`${SOCIAL_API}/mark-read`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to mark notifications as read");
  return response.json();
}

export async function getUserProfile(userId: string, token: string) {
  const response = await fetch(`${SOCIAL_API}/profile/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch user profile");
  return response.json();
}
