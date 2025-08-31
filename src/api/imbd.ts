import type { Movie } from "../interfaces/Movie";
import type { MovieDetail } from "../interfaces/MovieDetail";
import { getMovieInWatchLater, getMovieWatchCount } from "./movie";

// const API_URL = "https://api.themoviedb.org/3";
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

export async function getMovieDetailById(
  id: string,
  token?: string
): Promise<MovieDetail> {
  const response = await fetch(`${API_URL}titles/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();

  let watchCount = 0;
  let watchLater = false;

  if (token) {
    [watchCount, watchLater] = await Promise.all([
      getMovieWatchCount(id).then((res) => res.count),
      getMovieInWatchLater(id).then((res) => res.inWatchLater),
    ]);
  }

  console.log(watchCount, watchLater);

  return {
    id: data.id,
    type: data.type,
    primaryTitle: data.primaryTitle ?? data.originalTitle ?? "",
    originalTitle: data.originalTitle ?? data.primaryTitle ?? "",
    primaryImage: {
      url: data.primaryImage?.url || "/placeholder.svg",
      width: data.primaryImage?.width || 0,
      height: data.primaryImage?.height || 0,
    },
    startYear: data.startYear || 0,
    runtimeSeconds: data.runtimeSeconds || 0,
    genres: data.genres ?? [],
    rating: {
      aggregateRating: data.rating?.aggregateRating ?? 0,
      voteCount: data.rating?.voteCount ?? 0,
    },
    plot: data.plot ?? "",
    directors: (data.directors ?? []).map((director: any) => ({
      id: director.id,
      displayName: director.displayName,
      primaryImage: director.primaryImage
        ? {
            url: director.primaryImage.url,
            width: director.primaryImage.width,
            height: director.primaryImage.height,
          }
        : undefined,
    })),
    writers: (data.writers ?? []).map((writer: any) => ({
      id: writer.id,
      displayName: writer.displayName,
      primaryImage: writer.primaryImage
        ? {
            url: writer.primaryImage.url,
            width: writer.primaryImage.width,
            height: writer.primaryImage.height,
          }
        : undefined,
      primaryProfessions: writer.primaryProfessions ?? [],
    })),
    stars: (data.stars ?? []).map((star: any) => ({
      id: star.id,
      displayName: star.displayName,
      alternativeNames: star.alternativeNames ?? [],
      primaryImage: star.primaryImage
        ? {
            url: star.primaryImage.url,
            width: star.primaryImage.width,
            height: star.primaryImage.height,
          }
        : undefined,
      primaryProfessions: star.primaryProfessions ?? [],
    })),
    originCountries: (data.originCountries ?? []).map((country: any) => ({
      code: country.code,
      name: country.name,
    })),
    spokenLanguages: (data.spokenLanguages ?? []).map((lang: any) => ({
      code: lang.code,
      name: lang.name,
    })),
    watchCount,
    watchLater,
  };
}

export async function getMoviesByIds(ids: string[]): Promise<Movie[]> {
  if (!ids.length) return [];

  const batchSize = 5; // máximo permitido por batch
  const maxConcurrent = 2; // máximo permitido en paralelo por la API
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
        type: item.type,
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

  const url = `${API_URL}search/titles?query=${encodeURIComponent(
    query
  )}&limit=50&countryCodes=US`;
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
    type: item.type,
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
  const url = `${API_URL}titles?types=MOVIE&limit=${MOVIES_PER_PAGE}&sortBy=SORT_BY_POPULARITY&sortOrder=ASC&countryCodes=US${
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
    type: item.type,
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

export async function getMovieDurationById(id: string): Promise<any> {
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
    genres: data.genres,
  };
}
