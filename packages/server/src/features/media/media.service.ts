import { IdCard } from "lucide-react";
import MediaCacheModel, { IMediaCache } from "./media.model.js";

const API_URL = "https://api.imdbapi.dev/";

/**
 * Ensures a single media item is in the cache.
 * If not found, fetches from IMDb API and saves to DB.
 * This is called on-demand as movies/series are accessed.
 */
export async function ensureMediaInCache(
  id: string
): Promise<IMediaCache | null> {
  if (!id) return null;

  // Try to find in cache first
  const cached = await MediaCacheModel.findOne({ id });
  if (cached) return cached;

  // If not in cache, fetch from IMDb
  try {
    const url = `${API_URL}titles/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.error(
        `Error fetching from IMDb API for ID ${id}: ${res.statusText}`
      );
      return null;
    }

    const data = await res.json();

    console.log(`Caching ${data.id}:`, {
      title: data.primaryTitle,
      startYear: data.startYear,
      endYear: data.endYear,
      type: data.type,
    });

    // Create new cache entry
    const newMedia = new MediaCacheModel({
      id: data.id,
      type: data.type,
      title: data.primaryTitle || data.originalTitle || "Unknown Title",
      year: data.startYear || 0,
      endYear: data.endYear,
      genres: data.genres || [],
      rating: data.rating?.aggregateRating || 0,
      description: data.plot || "",
      poster: data.primaryImage?.url || "",
      backdrop: data.primaryImage?.url || "",
      lastUpdated: new Date(),
    });

    await newMedia.save();
    return newMedia;
  } catch (error) {
    console.error(`Exception while fetching/caching media ${id}:`, error);
    return null;
  }
}

/**
 * Enriches a list of items with metadata STRICTLY from the database.
 * Does NOT fetch from API if missing (returns item without metadata or partial).
 * @param items List of objects (e.g. from User model)
 * @param idField Field name containing the IMDb ID
 */
export async function enrichMediaList(
  items: any[],
  idField: string
): Promise<any[]> {
  if (!items || items.length === 0) return [];

  // 1. Collect all IDs
  const ids = items.map((item) => item[idField]).filter(Boolean);
  const uniqueIds = [...new Set(ids)];

  // 2. Fetch all metadata from DB in one query
  const cachedDocs = await MediaCacheModel.find({
    id: { $in: uniqueIds },
  });

  // 3. Create a map for quick lookup
  const cacheMap = new Map<string, IMediaCache>();
  cachedDocs.forEach((doc) => {
    cacheMap.set(doc.id, doc);
  });

  // 4. Merge metadata
  return items.map((item) => {
    const id = item[idField];
    const metadata = cacheMap.get(id);

    if (!metadata) {
      // If not in DB, return item as is (or with minimal info if needed)
      // Per requirements: DO NOT fetch from API here.
      return {
        ...item,
        id: id, // Ensure ID is present for frontend
        // Metadata fields will be missing, handled by frontend placeholder/loading
      };
    }

    return {
      ...item,
      id: metadata.id,
      title: metadata.title,
      poster: metadata.poster,
      backdrop: metadata.backdrop,
      year: metadata.year,
      endYear: metadata.endYear,
      genres: metadata.genres,
      rating: metadata.rating,
      description: metadata.description,
      type: metadata.type,
    };
  });
}
