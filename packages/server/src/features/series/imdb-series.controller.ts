import { Request, Response } from "express";

const API_URL = "https://api.imdbapi.dev";

export async function fetchSeriesBatchRaw(
  ids: string[] | undefined | null,
  options?: {
    concurrentRequests?: number;
    delayMs?: number;
  },
) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) return null;

  const { concurrentRequests = 4, delayMs = 1000 } = options || {};

  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += concurrentRequests) {
    batches.push(ids.slice(i, i + concurrentRequests));
  }

  const results: any[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const promises = batch.map(async (id) => {
      if (!id || typeof id !== "string" || !id.trim()) return null;
      const url = `${API_URL}/titles/${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const idStr = typeof id === "string" ? id : JSON.stringify(id);
        console.error(
          `Error al obtener serie con ID ${idStr}:`,
          res.statusText,
        );
        return null;
      }
      return await res.json();
    });
    const series = await Promise.all(promises);
    results.push(...series.filter(Boolean));

    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

export async function fetchSeriesBatchRawController(
  req: Request,
  res: Response,
) {
  const { ids, options } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "IDs inválidos" });
  }

  try {
    const result = await fetchSeriesBatchRaw(ids, options);
    res.json({ series: result });
  } catch (err) {
    res.status(500).json({ error: "Error interno: " + String(err) });
  }
}

// Fetch series detail with seasons
export async function fetchSeriesDetail(req: Request, res: Response) {
  const { id } = req.params;

  try {
    // Fetch series basic info
    const seriesUrl = `${API_URL}/titles/${encodeURIComponent(id)}`;
    const seriesRes = await fetch(seriesUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!seriesRes.ok) {
      return res.status(404).json({ error: "Serie no encontrada" });
    }

    const seriesData = await seriesRes.json();

    // Fetch seasons
    const seasonsUrl = `${API_URL}/titles/${encodeURIComponent(id)}/seasons`;
    const seasonsRes = await fetch(seasonsUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    let seasons = [];
    if (seasonsRes.ok) {
      const seasonsData = await seasonsRes.json();
      seasons = seasonsData.seasons || [];
    }

    res.json({
      ...seriesData,
      seasons,
    });
  } catch (err) {
    res.status(500).json({ error: "Error interno: " + String(err) });
  }
}

// Fetch episodes for a specific season
export async function fetchSeasonEpisodes(req: Request, res: Response) {
  const { id, season } = req.params;

  try {
    const episodesUrl = `${API_URL}/titles/${encodeURIComponent(
      id,
    )}/episodes?season=${season}`;
    const episodesRes = await fetch(episodesUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!episodesRes.ok) {
      return res.status(404).json({ error: "Episodios no encontrados" });
    }

    const episodesData = await episodesRes.json();
    res.json(episodesData);
  } catch (err) {
    res.status(500).json({ error: "Error interno: " + String(err) });
  }
}
// Helper for internal use
export async function getSeriesSeasonsInternal(id: string) {
  try {
    // Fetch ALL episodes with pagination support to get accurate season/episode counts
    let allEpisodes: any[] = [];
    let currentPageToken: string | undefined = undefined;

    do {
      const episodesUrl = `${API_URL}/titles/${encodeURIComponent(
        id,
      )}/episodes${currentPageToken ? `?pageToken=${currentPageToken}` : ""}`;

      const episodesRes: any = await fetch(episodesUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (episodesRes.ok) {
        const data = await episodesRes.json();
        const episodes = data.episodes || [];
        allEpisodes.push(...episodes);
        currentPageToken = data.nextPageToken;
      } else {
        break;
      }
    } while (currentPageToken);

    // Group by season to reconstruct the metadata structure
    const seasonMap = new Map<string, number>();

    allEpisodes.forEach((ep: any) => {
      if (ep.season) {
        const s = String(ep.season);
        seasonMap.set(s, (seasonMap.get(s) || 0) + 1);
      }
    });

    const uniqueSeasons = Array.from(seasonMap.entries()).map(
      ([season, count]) => ({
        season,
        episodeCount: count,
      }),
    );

    // Sort numerically
    return uniqueSeasons.sort((a, b) => Number(a.season) - Number(b.season));
  } catch (err) {
    console.error("Error fetching internal seasons:", err);
  }
  return [];
}

// Helper for internal use
export async function getSeasonEpisodesInternal(
  id: string,
  season: string,
): Promise<any[]> {
  try {
    // We can optimize this by using the seasons we already fetched,
    // but for now let's just make it call the episodes endpoint for THAT season if possible.
    // Actually, the API might not support filtering by season directly in a clean way
    // that returns ALL episodes of that season without pagination issues if there are many.

    // For now, let's use the same paginated approach but only return the requested season.
    // This is still better than the previous one which was called in a loop.
    const allEpisodes = await getAllEpisodesInternal(id);
    return allEpisodes.filter((e: any) => String(e.season) === String(season));
  } catch (err) {
    console.error("Error fetching internal season episodes:", err);
  }
  return [];
}

// New helper to avoid redundant calls
export async function getAllEpisodesInternal(id: string): Promise<any[]> {
  let allEpisodes: any[] = [];
  let currentPageToken: string | undefined = undefined;

  try {
    do {
      const url = `${API_URL}/titles/${encodeURIComponent(id)}/episodes${
        currentPageToken ? `?pageToken=${currentPageToken}` : ""
      }`;
      const res: any = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        allEpisodes.push(...(data.episodes || []));
        currentPageToken = data.nextPageToken;
      } else {
        break;
      }
    } while (currentPageToken);
  } catch (err) {
    console.error("Error in getAllEpisodesInternal:", err);
  }
  return allEpisodes;
}
