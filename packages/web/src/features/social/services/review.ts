import { API_BASE_URL } from "../../../shared/utils/urls";
import { apiClient } from "../../../core/api/apiClient";
import type { Review } from "@veoveo/shared";

const API_URL = API_BASE_URL + "api/user/reviews";

export async function upsertReview(data: {
  mediaId: string;
  mediaType: "movie" | "series";
  rating: number;
  comment?: string;
}) {
  const res = await apiClient(API_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function getUserReviews(): Promise<Review[]> {
  const res = await apiClient(API_URL, {
    method: "GET",
  });
  return await res.json();
}

export async function getReviewByMediaId(
  mediaId: string,
): Promise<Review | null> {
  const res = await apiClient(`${API_URL}/${mediaId}`, {
    method: "GET",
  });
  return await res.json();
}
