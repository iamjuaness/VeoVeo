import { API_BASE_URL } from "../../../shared/utils/urls";
import { apiClient } from "../../../core/api/apiClient";
import { requestQueue } from "../../../core/api/requestQueue";

const API_URL = API_BASE_URL + "api/user";

export async function toggleSeriesWatchLaterApi(data: { seriesId: string }) {
  return requestQueue.enqueue(`series:${data.seriesId}`, async () => {
    const res = await apiClient(`${API_URL}/series/watch-later`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result;
  });
}

export async function getUserSeriesStatus() {
  const res = await apiClient(`${API_URL}/series/status`, {
    method: "GET",
  });
  const result = await res.json();
  return result;
}

export async function toggleEpisodeWatchedApi(data: {
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  force?: boolean;
}) {
  return requestQueue.enqueue(`series:${data.seriesId}`, async () => {
    const res = await apiClient(`${API_URL}/series/episodes/watched`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result;
  });
}

export async function markSeasonWatchedApi(data: {
  seriesId: string;
  seasonNumber: number;
  episodes?: { episodeNumber: number }[];
  increment?: boolean;
}) {
  return requestQueue.enqueue(`series:${data.seriesId}`, async () => {
    const res = await apiClient(`${API_URL}/series/season/watched`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result;
  });
}

export async function markAllEpisodesWatchedApi(data: {
  seriesId: string;
  seasons?: { seasonNumber: number; episodeCount: number }[];
  increment?: boolean;
}) {
  return requestQueue.enqueue(`series:${data.seriesId}`, async () => {
    const res = await apiClient(`${API_URL}/series/mark-all-watched`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result;
  });
}

export async function toggleSeriesCompletedApi(data: {
  seriesId: string;
  isCompleted: boolean;
}) {
  return requestQueue.enqueue(`series:${data.seriesId}`, async () => {
    const res = await apiClient(`${API_URL}/series/completed`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result;
  });
}

export async function getSeriesProgressApi(seriesId: string) {
  const res = await apiClient(`${API_URL}/series/${seriesId}/progress`, {
    method: "GET",
  });
  const result = await res.json();
  return result;
}

export async function resetSeriesWatchedApi(data: { seriesId: string }) {
  return requestQueue.enqueue(`series:${data.seriesId}`, async () => {
    const res = await apiClient(`${API_URL}/series/reset`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result;
  });
}
