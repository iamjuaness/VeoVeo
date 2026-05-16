import { API_BASE_URL } from "../../../shared/utils/urls";
import { apiClient } from "../../../core/api/apiClient";

const API_URL = API_BASE_URL + "api/user";

export async function addOrIncrementWatched(data: {
  movieId: string;
  duration: number;
  watchedAt: string[];
}) {
  const res = await apiClient(`${API_URL}/movies/watched`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  const result = await res.json();
  return result;
}

export async function resetWatched(data: { movieId: string }) {
  const res = await apiClient(`${API_URL}/movies/reset`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  const result = await res.json();
  return result;
}

export async function toggleWatchLaterApi(data: { movieId: string }) {
  const res = await apiClient(`${API_URL}/movies/watch-later`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  const result = await res.json();
  return result;
}

export async function getUserMovieStatus() {
  const res = await apiClient(`${API_URL}/movies/status`, {
    method: "GET",
  });
  const result = await res.json();
  return result;
}

export async function getMovieWatchCount(movieId: string) {
  const res = await apiClient(`${API_URL}/count/${movieId}`, {
    method: "GET",
  });
  const result = await res.json();
  return result;
}

export async function getMovieInWatchLater(movieId: string) {
  const res = await apiClient(`${API_URL}/in-watch-later/${movieId}`, {
    method: "GET",
  });
  const result = await res.json();
  return result;
}
