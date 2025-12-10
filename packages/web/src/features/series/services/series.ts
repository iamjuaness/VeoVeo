import { API_BASE_URL } from "../../../shared/utils/urls";

const API_URL = API_BASE_URL + "api/user";
const token = localStorage.getItem("authToken");

export async function toggleSeriesWatchLaterApi(data: { seriesId: string }) {
  const res = await fetch(`${API_URL}/series/watch-later`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  return result;
}

export async function getUserSeriesStatus() {
  const res = await fetch(`${API_URL}/series/status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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
  const res = await fetch(`${API_URL}/series/episodes/watched`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  return result;
}

export async function markSeasonWatchedApi(data: {
  seriesId: string;
  seasonNumber: number;
  episodes?: { episodeNumber: number }[];
  increment?: boolean;
}) {
  const res = await fetch(`${API_URL}/series/season/watched`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  return result;
}

export async function markAllEpisodesWatchedApi(data: {
  seriesId: string;
  seasons?: { seasonNumber: number; episodeCount: number }[];
  increment?: boolean;
}) {
  const res = await fetch(`${API_URL}/series/mark-all-watched`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  return result;
}

export async function toggleSeriesCompletedApi(data: {
  seriesId: string;
  isCompleted: boolean;
}) {
  const res = await fetch(`${API_URL}/series/completed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  return result;
}

export async function getSeriesProgressApi(seriesId: string) {
  const res = await fetch(`${API_URL}/series/${seriesId}/progress`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const result = await res.json();
  return result;
}
export async function resetSeriesWatchedApi(data: { seriesId: string }) {
  const res = await fetch(`${API_URL}/series/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  return result;
}
