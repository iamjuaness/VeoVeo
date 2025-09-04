import { Request, Response } from "express";
// const API_URL = "https://api.themoviedb.org/3";
const API_URL = "https://api.imdbapi.dev/";

// No se usa localStorage ni checkpoint

export async function fetchMoviesBatchRaw(
  ids: string[] | undefined | null,
  options?: {
    concurrentRequests?: number;
    delayMs?: number;
  }
) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) return null;

  const {
    concurrentRequests = 4,
    delayMs = 1000,
  } = options || {};

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
        console.error("Error al obtener película:", res.statusText, id);
        return null;
      }
      return await res.json();
    });
    const movies = await Promise.all(promises);
    results.push(...movies.filter(Boolean));

    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

export async function fetchMoviesBatchRawController(req: Request, res: Response) {
  const { ids, options } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "IDs inválidos" });
  }

  try {
    const result = await fetchMoviesBatchRaw(ids, options);
    res.json({ movies: result });
  } catch (err) {
    res.status(500).json({ error: "Error interno: " + String(err) });
  }
}
