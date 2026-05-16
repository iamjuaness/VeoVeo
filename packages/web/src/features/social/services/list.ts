import type { CustomList } from "@veoveo/shared";
import { API_BASE_URL } from "../../../shared/utils/urls";
import { apiClient } from "../../../core/api/apiClient";

const API_URL = API_BASE_URL + "api/social";

export const createList = async (
  listData: Partial<CustomList>,
): Promise<CustomList> => {
  const response = await apiClient(`${API_URL}/lists`, {
    method: "POST",
    body: JSON.stringify(listData),
  });
  if (!response.ok) throw new Error("Error creating list");
  return response.json();
};

export const getMyLists = async (): Promise<CustomList[]> => {
  const response = await apiClient(`${API_URL}/lists/me`);
  if (!response.ok) throw new Error("Error fetching lists");
  return response.json();
};

export const getPublicLists = async (): Promise<CustomList[]> => {
  const response = await apiClient(`${API_URL}/lists/public`);
  if (!response.ok) throw new Error("Error fetching public lists");
  return response.json();
};

export const getListById = async (listId: string): Promise<CustomList> => {
  const response = await apiClient(`${API_URL}/lists/${listId}`);
  if (!response.ok) throw new Error("Error fetching list");
  return response.json();
};

export const updateList = async (
  listId: string,
  listData: Partial<CustomList>,
): Promise<CustomList> => {
  const response = await apiClient(`${API_URL}/lists/${listId}`, {
    method: "PUT",
    body: JSON.stringify(listData),
  });
  if (!response.ok) throw new Error("Error updating list");
  return response.json();
};

export const deleteList = async (listId: string): Promise<void> => {
  const response = await apiClient(`${API_URL}/lists/${listId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting list");
};

export const toggleLikeList = async (
  listId: string,
): Promise<{ likesCount: number; isLiked: boolean }> => {
  const response = await apiClient(`${API_URL}/lists/${listId}/like`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Error toggling like");
  return response.json();
};
