import { API_BASE_URL } from "../utils/urls";

const getHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export async function getUserProfile() {
  const response = await fetch(`${API_BASE_URL}api/user/profile`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
}

export async function updateUserProfile(data: {
  name?: string;
  email?: string;
  bio?: string;
  selectedAvatar?: string;
}) {
  const response = await fetch(`${API_BASE_URL}api/user/profile`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
}

export async function updateUserSettings(data: {
  notificationPreferences?: any;
  privacyPreferences?: any;
  appearancePreferences?: any;
}) {
  const response = await fetch(`${API_BASE_URL}api/user/settings`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update settings");
  return response.json();
}
