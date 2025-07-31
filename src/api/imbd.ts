const API_URL = "https://api.imdbapi.dev";

export async function getMoviesByGenres(genre: string) {
  const res = await fetch(`${API_URL}/titles?genres=${genre}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const result = await res.json();
  return result;
}

export async function getMovieById(id: string) {
  const res = await fetch(`${API_URL}/movie/${id}`);
  const result = await res.json();
  return result;
}