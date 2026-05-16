import { API_BASE_URL } from "../utils/urls";
import { apiClient } from "../../core/api/apiClient";

export async function getUserProfile() {
  const response = await apiClient(`${API_BASE_URL}api/user/profile`);
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
}

export async function updateUserProfile(data: {
  name?: string;
  email?: string;
  bio?: string;
  selectedAvatar?: string;
}) {
  const response = await apiClient(`${API_BASE_URL}api/user/profile`, {
    method: "PATCH",
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
  const response = await apiClient(`${API_BASE_URL}api/user/settings`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update settings");
  return response.json();
}
