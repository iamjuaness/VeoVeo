import type { Series } from "../../../interfaces/Series";
import type { SeriesDetail } from "../../../interfaces/SeriesDetail";
import type { Episode } from "../../../interfaces/Series";
import { API_BASE_URL } from "../../../shared/utils/urls";

const API_URL = "https://api.imdbapi.dev/";
const SERIES_PER_PAGE = 24;
const token = localStorage.getItem("authToken");

export async function getSeriesDetailById(id: string): Promise<SeriesDetail> {
  const response = await fetch(`${API_URL}titles/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();

  // Fetch seasons separately
  let seasons = [];
  try {
    const seasonsResponse = await fetch(`${API_URL}titles/${id}/seasons`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (seasonsResponse.ok) {
      const seasonsData = await seasonsResponse.json();
      seasons = seasonsData.seasons || [];
    }
  } catch (err) {
    console.error("Error fetching seasons:", err);
  }

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
    endYear: data.endYear,
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
    seasons: seasons,
    watchLater: false,
  };
}

export async function getSeasonEpisodes(
  seriesId: string,
  season: string
): Promise<Episode[]> {
  const response = await fetch(
    `${API_URL}titles/${seriesId}/episodes?season=${season}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();
  return data.episodes ?? [];
}

export async function getSeriesByIds(ids: string[]): Promise<Series[]> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
  if (!token) return [];

  const res = await fetch(`${API_BASE_URL}api/user/series/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ids: ids,
      options: { concurrentRequests: 4, delayMs: 1000 },
    }),
  });

  if (!res.ok) {
    console.error("Error al obtener batch de series:", res.statusText);
    return [];
  }

  const data = await res.json();
  if (!data || !data.series || !Array.isArray(data.series)) {
    return [];
  }

  return data.series.map((item: any) => ({
    id: item.id,
    type: item.type,
    title: item.primaryTitle ?? item.originalTitle ?? "",
    year: item.startYear ?? 0,
    endYear: item.endYear,
    genres: item.genres ?? [],
    rating: item.rating?.aggregateRating ?? 0,
    description: item.plot ?? "",
    poster: item.primaryImage?.url ?? "",
    backdrop: item.primaryImage?.url ?? "",
    watchLater: false,
  }));
}

export async function searchSeries(query: string): Promise<Series[]> {
  if (!query.trim()) return [];

  const url = `${API_URL}search/titles?query=${encodeURIComponent(
    query
  )}&limit=50&countryCodes=US`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    console.error("Error en búsqueda de series:", res.statusText);
    return [];
  }

  const data = await res.json();

  // Filter only TV series and mini series
  return (data.titles ?? [])
    .filter(
      (item: any) => item.type === "tvSeries" || item.type === "tvMiniSeries"
    )
    .map((item: any) => ({
      id: item.id,
      type: item.type,
      title: item.primaryTitle ?? item.originalTitle ?? "",
      year: item.startYear ?? 0,
      endYear: item.endYear,
      genres: item.genres ?? [],
      rating: item.rating?.aggregateRating ?? 0,
      description: item.plot ?? "",
      poster: item.primaryImage?.url ?? "",
      backdrop: item.primaryImage?.url ?? "",
      watchLater: false,
    }));
}

export async function fetchSeriesFromEndpoint(nextPageToken?: string): Promise<{
  series: Series[];
  totalPages: number;
  totalResults: number;
  nextPageToken?: string;
}> {
  const url = `${API_URL}titles?types=TV_SERIES&types=TV_MINI_SERIES&limit=${SERIES_PER_PAGE}&sortBy=SORT_BY_POPULARITY&sortOrder=ASC&countryCodes=US${
    nextPageToken ? `&pageToken=${nextPageToken}` : ""
  }`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Error al obtener series: ${res.statusText}`);
  }

  const data = await res.json();

  const series: Series[] = (data.titles ?? []).map((item: any) => ({
    id: item.id,
    type: item.type,
    title: item.primaryTitle ?? item.originalTitle ?? "",
    year: item.startYear ?? 0,
    endYear: item.endYear,
    genres: item.genres ?? [],
    rating: item.rating?.aggregateRating ?? 0,
    description: item.plot ?? "",
    poster: item.primaryImage?.url ?? "",
    backdrop: item.primaryImage?.url ?? "",
    watchLater: false,
  }));

  return {
    series,
    totalPages: Math.ceil((data.totalCount ?? 0) / SERIES_PER_PAGE),
    totalResults: data.totalCount ?? 0,
    nextPageToken: data.nextPageToken,
  };
}
