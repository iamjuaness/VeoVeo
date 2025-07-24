import { prod_url } from "../utils/urls";

const API_URL = prod_url + 'api/user';
const token = localStorage.getItem("authToken");

export async function addOrIncrementWatched(data: { movieId: string }) {
  const res = await fetch(`${API_URL}/movies/watched`, {
    method: 'POST',
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  console.log(token);
  return result;
}

export async function resetWatched(data: { movieId: string }) {
  const res = await fetch(`${API_URL}/movies/reset`, {
    method: 'POST',
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  return result;
}

export async function toggleWatchLaterApi(data: { movieId: string }) {
  const res = await fetch(`${API_URL}/movies/watch-later`, {
    method: 'POST',
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  return result;
}

export async function getUserMovieStatus() {
  const res = await fetch(`${API_URL}/movies/status`, {
    method: 'GET',
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
  });
  const result = await res.json();
  return result;
}