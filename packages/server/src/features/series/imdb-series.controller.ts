import { Request, Response } from "express";

const API_URL = "https://api.imdbapi.dev/";

export async function fetchSeriesBatchRaw(
  ids: string[] | undefined | null,
  options?: {
    concurrentRequests?: number;
    delayMs?: number;
  }
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
          res.statusText
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
  res: Response
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
      id
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
    const seasonsUrl = `${API_URL}/titles/${encodeURIComponent(id)}/seasons`;
    const seasonsRes = await fetch(seasonsUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (seasonsRes.ok) {
      const seasonsData = await seasonsRes.json();
      return seasonsData.seasons || [];
    }
  } catch (err) {
    console.error("Error fetching internal seasons:", err);
  }
  return [];
}
// Helper for internal use
export async function getSeasonEpisodesInternal(
  id: string,
  season: string,
  pageToken?: string
): Promise<any[]> {
  try {
    const episodesUrl = `${API_URL}/titles/${encodeURIComponent(
      id
    )}/episodes?season=${season}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const episodesRes = await fetch(episodesUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (episodesRes.ok) {
      const episodesData = await episodesRes.json();
      const currentEpisodes = episodesData.episodes || [];

      if (episodesData.nextPageToken) {
        const nextEpisodes = await getSeasonEpisodesInternal(
          id,
          season,
          episodesData.nextPageToken
        );
        return [...currentEpisodes, ...nextEpisodes];
      }

      return currentEpisodes;
    }
  } catch (err) {
    console.error("Error fetching internal season episodes:", err);
  }
  return [];
}
