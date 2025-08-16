import { genres } from "../components/genres";
import type { Movie } from "../interfaces/Movie";

// const API_URL = "https://api.themoviedb.org/3";
const API_IMAGE_BASE = "https://image.tmdb.org/t/p/original";
const API_KEY = import.meta.env.VITE_IMDB_API_KEY;
const genreMap = Object.fromEntries(genres.map((g) => [g.id, g.name]));
const API_URL = "https://api.imdbapi.dev/";
const MOVIES_PER_PAGE = 24;

export async function getMoviesByGenres(genre: string) {
  const res = await fetch(`${API_URL}?genres=${genre}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const result = await res.json();
  return result;
}

export async function getMovieById(id: string): Promise<Movie> {
  const response = await fetch(`${API_URL}/titles/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  });
  const data = await response.json();
  return {
    id: data.id,
    title: data.title ?? data.original_title,
    year: Number(data.release_date?.slice(0, 4)) || 0,
    genres: data.genre_ids.map((id) => genreMap[id] ?? "Desconocido"),
    rating: data.vote_average ?? 0,
    description: data.overview ?? "",
    poster: data.poster_path ? `${API_IMAGE_BASE}${data.poster_path}` : "",
    backdrop: data.backdrop_path
      ? `${API_IMAGE_BASE}${data.backdrop_path}`
      : "",
    watchCount: 0,
    watchLater: false,
    duration: data.runtime,
  };
}

export async function getMoviesByIds(ids: string[]): Promise<Movie[]> {
  if (!ids.length) return [];

  const batchSize = 5; // máximo permitido por batch
  const maxConcurrent = 4; // máximo permitido en paralelo por la API
  const allBatches: string[][] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    allBatches.push(ids.slice(i, i + batchSize));
  }

  let results: Movie[] = [];

  for (let i = 0; i < allBatches.length; i += maxConcurrent) {
    const concurrentBatches = allBatches.slice(i, i + maxConcurrent);

    const promises = concurrentBatches.map(async (batchIds) => {
      const url = `${API_URL}titles:batchGet?${batchIds
        .map((id) => `titleIds=${encodeURIComponent(id)}`)
        .join("&")}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        console.error("Error al obtener batch de películas:", res.statusText);
        return [];
      }

      const data = await res.json();
      return (data.titles ?? []).map((item: any) => ({
        id: item.id,
        title: item.primaryTitle ?? item.originalTitle ?? "",
        year: item.startYear ?? 0,
        genres: item.genres ?? [],
        rating: item.rating?.aggregateRating ?? 0,
        description: item.plot ?? "",
        poster: item.primaryImage?.url ?? "",
        backdrop: item.primaryImage?.url ?? "",
        watchCount: 0,
        watchLater: false,
        duration: item.runtimeSeconds
          ? Math.floor(item.runtimeSeconds / 60)
          : 0,
      }));
    });

    // Espera a que termine el grupo
    const batchResults = await Promise.all(promises);
    results = [...results, ...batchResults.flat()];

    // Dormir 1 segundo para cumplir la cuota si hay más lotes
    if (i + maxConcurrent < allBatches.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

export async function searchMovies(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];

  const url = `${API_URL}search/titles?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    console.error("Error en búsqueda de películas:", res.statusText);
    return [];
  }

  const data = await res.json();

  // Mapeamos resultados al tipo Movie
  return (data.titles ?? []).map((item: any) => ({
    id: item.id,
    title: item.primaryTitle ?? item.originalTitle ?? "",
    year: item.startYear ?? 0,
    genres: item.genres ?? [],
    rating: item.rating?.aggregateRating ?? 0,
    description: item.plot ?? "",
    poster: item.primaryImage?.url ?? "",
    backdrop: item.primaryImage?.url ?? "",
    watchCount: 0,
    watchLater: false,
    duration: item.runtimeSeconds ? Math.floor(item.runtimeSeconds / 60) : 0,
  }));
}


export async function fetchMoviesFromEndpoint(nextPageToken?: string): Promise<{
  movies: Movie[];
  totalPages: number;
  totalResults: number;
  nextPageToken?: string;
}> {
  const url = `${API_URL}titles?types=MOVIE&limit=${MOVIES_PER_PAGE}&sortBy=SORT_BY_POPULARITY&sortOrder=ASC${
    nextPageToken ? `&pageToken=${nextPageToken}` : ""
  }`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Error al obtener películas: ${res.statusText}`);
  }

  const data = await res.json();

  const movies: Movie[] = (data.titles ?? []).map((item: any) => ({
    id: item.id,
    title: item.primaryTitle ?? item.originalTitle ?? "",
    year: item.startYear ?? 0,
    genres: item.genres ?? [],
    rating: item.rating?.aggregateRating ?? 0,
    description: item.plot ?? "",
    poster: item.primaryImage?.url ?? "",
    backdrop: item.primaryImage?.url ?? "",
    watchCount: 0,
    watchLater: false,
    duration: item.runtimeSeconds ? Math.floor(item.runtimeSeconds / 60) : 0,
  }));

  return {
    movies,
    totalPages: Math.ceil((data.totalCount ?? 0) / MOVIES_PER_PAGE),
    totalResults: data.totalCount ?? 0,
    nextPageToken: data.nextPageToken,
  };
}

export async function getMovieDurationById(id: number): Promise<any> {
  const response = await fetch(`${API_URL}titles/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return {
    duration: data.runtimeSeconds,
  };
}

export async function getMovieGenresById(id: number): Promise<any> {
  const response = await fetch(`${API_URL}titles/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return {
    genres: data.genres
  };
}
