import { Request, Response } from "express";
import User from "../users/user.model.js";
import { io } from "../../app.js";
import {
  getSeriesSeasonsInternal,
  getSeasonEpisodesInternal,
} from "./imdb-series.controller.js";

// POST /api/user/series/watch-later
// Body: { seriesId: string }
export async function toggleSeriesWatchLater(req: Request, res: Response) {
  const { id } = req;
  const { seriesId } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.seriesWatchLater.includes(seriesId)) {
    user.seriesWatchLater = user.seriesWatchLater.filter(
      (id) => id !== seriesId
    );
  } else {
    user.seriesWatchLater.push(seriesId);
  }
  await user.save();
  io.to(String(id)).emit("series-watch-later-toggled", {
    seriesId,
    seriesWatchLater: user.seriesWatchLater,
  });
  return res.json({ seriesWatchLater: user.seriesWatchLater });
}

// GET /api/user/series/status
export async function getUserSeriesStatus(req: Request, res: Response) {
  const { id } = req;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({
    seriesWatchLater: user.seriesWatchLater,
    seriesWatched: user.seriesWatched || [],
  });
}

// POST /api/user/series/episodes/watched
// Body: { seriesId: string, seasonNumber: number, episodeNumber: number, force: boolean }
export async function toggleEpisodeWatched(req: Request, res: Response) {
  const { id } = req;
  const { seriesId, seasonNumber, episodeNumber, force } = req.body; // force = true means ADD even if exists (increment)

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Find or create series entry
  let seriesEntry = user.seriesWatched.find((s) => s.seriesId === seriesId);
  if (!seriesEntry) {
    // @ts-ignore
    seriesEntry = { seriesId, episodes: [] };
    user.seriesWatched.push(seriesEntry);
  }

  // Check if episode already watched
  const existingEpValue = seriesEntry.episodes.find(
    (e) => e.seasonNumber === seasonNumber && e.episodeNumber === episodeNumber
  );

  if (existingEpValue) {
    if (force) {
      // Increment count
      // @ts-ignore
      existingEpValue.count = (existingEpValue.count || 1) + 1;
      existingEpValue.watchedAt = new Date();
    } else {
      // Default toggle behavior: If exists, remove it (unless count is high, but standard toggle usually means unwatch)
      // For now, if user clicks standard check, we remove it.
      // Or should we decrement? User asked "cuantas veces".
      // Standard check usually means "I haven't seen it".
      // But maybe we add logic: If count > 1, decrement?
      // Let's stick to standard behavior: Toggle = Remove if exists, unless we add specific "Increment" UI.
      // Actually, if simply toggling off, remove entirely.
      // Rewatch logic will use 'force' or explicit increment.
      const idx = seriesEntry.episodes.indexOf(existingEpValue);
      seriesEntry.episodes.splice(idx, 1);
    }
  } else {
    // Add episode (mark as watched)
    seriesEntry.episodes.push({
      seasonNumber,
      episodeNumber,
      watchedAt: new Date(),
      // @ts-ignore
      count: 1,
    });
  }

  // Clean up if empty
  if (seriesEntry.episodes.length === 0) {
    user.seriesWatched = user.seriesWatched.filter(
      (s) => s.seriesId !== seriesId
    );
  }

  // Check completion after toggle
  await checkSeriesCompletion(seriesId, seriesEntry);

  await user.save();

  io.to(String(id)).emit("episode-watched-toggled", {
    seriesId,
    seasonNumber,
    episodeNumber,
    seriesWatched: user.seriesWatched,
  });

  return res.json({ seriesWatched: user.seriesWatched });
}

/**
 * Helper to check if a series is fully watched
 */
async function checkSeriesCompletion(seriesId: string, seriesEntry: any) {
  try {
    const seasons = await getSeriesSeasonsInternal(seriesId);
    let totalEpisodesCount = 0;

    for (const season of seasons) {
      const eps = await getSeasonEpisodesInternal(seriesId, season.season);
      totalEpisodesCount += eps.length;
    }

    if (
      seriesEntry.episodes.length >= totalEpisodesCount &&
      totalEpisodesCount > 0
    ) {
      seriesEntry.isCompleted = true;
    } else {
      seriesEntry.isCompleted = false;
    }
  } catch (err) {
    console.error("Error checking series completion:", err);
  }
}

// POST /api/user/series/season/watched
// Body: { seriesId: string, seasonNumber: number, episodes?: { episodeNumber: number }[], increment?: boolean }
export async function markSeasonWatched(req: Request, res: Response) {
  const { id } = req;
  const { seriesId, seasonNumber, episodes, increment } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Find or create series entry
  let seriesEntry = user.seriesWatched.find((s) => s.seriesId === seriesId);
  if (!seriesEntry) {
    // @ts-ignore
    seriesEntry = { seriesId, episodes: [] };
    user.seriesWatched.push(seriesEntry);
  }

  const now = new Date();
  let madeChanges = false;
  let targetEpisodes: { episodeNumber: number }[] = [];

  // 1. Determine Episode List (Client provided OR Server Fetch)
  if (Array.isArray(episodes) && episodes.length > 0) {
    targetEpisodes = episodes;
  } else {
    // Server-side fetch (Auth source)
    try {
      const fetchedEps = await getSeasonEpisodesInternal(
        seriesId,
        String(seasonNumber)
      );
      targetEpisodes = fetchedEps.map((e: any) => ({
        episodeNumber: Number(e.episodeNumber),
      }));
      // Filter valid
      targetEpisodes = targetEpisodes.filter(
        (e) => !isNaN(e.episodeNumber) && e.episodeNumber > 0
      );
    } catch (err) {
      console.error(
        `Failed to fetch internal episodes for season ${seasonNumber}`,
        err
      );
      return res
        .status(500)
        .json({ message: "Error fetching season episodes" });
    }
  }

  // 2. Process Episodes
  targetEpisodes.forEach((epInput) => {
    const epNum = epInput.episodeNumber;
    const existingEp = seriesEntry!.episodes.find(
      (e) => e.seasonNumber === seasonNumber && e.episodeNumber === epNum
    );

    if (!existingEp) {
      // Mark as watched (New)
      seriesEntry!.episodes.push({
        seasonNumber,
        episodeNumber: epNum,
        watchedAt: now,
        // @ts-ignore
        count: 1,
      });
      madeChanges = true;
    } else if (increment) {
      // Rewatch Mode: Increment count
      // @ts-ignore
      existingEp.count = (existingEp.count || 1) + 1;
      existingEp.watchedAt = now;
      madeChanges = true;
    }
  });

  if (madeChanges) {
    // Check completion after season mark
    await checkSeriesCompletion(seriesId, seriesEntry);

    user.markModified("seriesWatched");
    await user.save();
    io.to(String(id)).emit("series-season-marked", {
      seriesId,
      seriesWatched: user.seriesWatched,
    });
  }

  return res.json({ seriesWatched: user.seriesWatched });
}

// POST /api/user/series/mark-all-watched
// Body: { seriesId: string, increment?: boolean}
export async function markAllEpisodesWatched(req: Request, res: Response) {
  const { id } = req;
  const { seriesId, increment } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  console.log(`MarkAllWatched: Starting Strict Deep Fetch for ${seriesId}...`);

  // 1. Fetch Authoritative Seasons List
  let targetSeasons: { seasonNumber: number; episodeCount: number }[] = [];
  try {
    const sourceSeasons = await getSeriesSeasonsInternal(seriesId);
    // Map to basic number structure
    const mappedSeasons = sourceSeasons
      .map((s: any) => ({
        seasonNumber: Number(s.season) || 0,
      }))
      .filter((s: { seasonNumber: number }) => s.seasonNumber > 0);

    // 2. Fetch Episodes count for EACH season
    // Sequential fetching to avoid rate limits
    for (const season of mappedSeasons) {
      try {
        const eps = await getSeasonEpisodesInternal(
          seriesId,
          String(season.seasonNumber)
        );

        // Filter and Deduplicate: Use Set to ensure unique episode numbers
        const uniqueEpisodes = new Set();

        if (Array.isArray(eps)) {
          eps.forEach((e: any) => {
            const epNum = Number(e.episodeNumber);
            // Accept only valid positive integers
            if (!isNaN(epNum) && epNum > 0) {
              uniqueEpisodes.add(epNum);
            }
          });
        }

        const validCount = uniqueEpisodes.size;
        console.log(
          `Season ${season.seasonNumber}: Fetched ${eps.length} raw -> ${validCount} valid unique episodes.`
        );

        targetSeasons.push({
          seasonNumber: season.seasonNumber,
          episodeCount: validCount,
        });
      } catch (e) {
        console.error(
          `Failed to fetch episodes for season ${season.seasonNumber}`,
          e
        );
      }
    }
  } catch (err) {
    console.error("Error fetching internal seasons source:", err);
    return res
      .status(500)
      .json({ message: "Error fetching series data from source" });
  }

  // Find or create series entry
  let seriesEntry = user.seriesWatched.find((s) => s.seriesId === seriesId);
  if (!seriesEntry) {
    // @ts-ignore
    seriesEntry = { seriesId, episodes: [], isCompleted: true };
    user.seriesWatched.push(seriesEntry);
  } else {
    // Ensure completed flag is set
    (seriesEntry as any).isCompleted = true;
  }

  const now = new Date();

  // 4. Merge Strategy (Atomic Episode List UPDATE)
  if (Array.isArray(targetSeasons)) {
    targetSeasons.forEach(
      (season: { seasonNumber: number; episodeCount: number }) => {
        if (season.episodeCount <= 0) return;

        for (let ep = 1; ep <= season.episodeCount; ep++) {
          const existingEp = seriesEntry!.episodes.find(
            (e) =>
              e.seasonNumber === season.seasonNumber && e.episodeNumber === ep
          );

          if (!existingEp) {
            // Add new
            seriesEntry!.episodes.push({
              seasonNumber: season.seasonNumber,
              episodeNumber: ep,
              watchedAt: now,
              // @ts-ignore
              count: 1,
            });
          } else if (increment) {
            // Increment (Rewatch)
            // @ts-ignore
            existingEp.count = (existingEp.count || 1) + 1;
            existingEp.watchedAt = now;
          }
        }
      }
    );
  }

  console.log(
    `MarkAllWatched: Atomic Merge Save. Total Episodes: ${seriesEntry.episodes.length}`
  );

  user.markModified("seriesWatched");
  try {
    await user.save();
  } catch (error) {
    console.error("Error saving user seriesWatched:", error);
    return res.status(500).json({ message: "Error saving progress" });
  }

  io.to(String(id)).emit("series-marked-watched", {
    seriesId,
    seriesWatched: user.seriesWatched,
  });

  return res.json({ seriesWatched: user.seriesWatched });
}

// GET /api/user/series/:id/progress
export async function getSeriesProgress(req: Request, res: Response) {
  const userId = req.id;
  const { id: seriesId } = req.params;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const seriesEntry = user.seriesWatched.find((s) => s.seriesId === seriesId);

  if (!seriesEntry) {
    return res.json({
      seriesId,
      episodes: [],
      totalWatched: 0,
    });
  }

  return res.json({
    seriesId,
    episodes: seriesEntry.episodes,
    totalWatched: seriesEntry.episodes.length,
    isCompleted: (seriesEntry as any).isCompleted || false,
  });
}

// POST /api/user/series/completed
// Body: { seriesId: string, isCompleted: boolean }
export async function toggleSeriesCompleted(req: Request, res: Response) {
  const { id } = req;
  const { seriesId, isCompleted } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  let seriesEntry = user.seriesWatched.find((s) => s.seriesId === seriesId);

  if (!seriesEntry) {
    if (isCompleted) {
      // Create empty entry if marking as completed without episodes (unlikely but safe)
      seriesEntry = { seriesId, episodes: [] };
      user.seriesWatched.push(seriesEntry);
    } else {
      return res.json({ seriesWatched: user.seriesWatched });
    }
  }

  (seriesEntry as any).isCompleted = isCompleted;

  // If marking as not completed and no episodes, remove entry
  if (!isCompleted && seriesEntry.episodes.length === 0) {
    user.seriesWatched = user.seriesWatched.filter(
      (s) => s.seriesId !== seriesId
    );
  }

  await user.save();

  io.to(String(id)).emit("series-completed-toggled", {
    seriesId,
    isCompleted,
    seriesWatched: user.seriesWatched,
  });

  return res.json({ seriesWatched: user.seriesWatched });
}
// POST /api/user/series/reset
// Body: { seriesId: string }
export async function resetSeriesWatched(req: Request, res: Response) {
  const { id } = req;
  const { seriesId } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Remove series entry completely
  user.seriesWatched = user.seriesWatched.filter(
    (s) => s.seriesId !== seriesId
  );

  await user.save();

  io.to(String(id)).emit("series-marked-watched", {
    seriesId, // Send ID so client knows to remove it
    seriesWatched: user.seriesWatched,
  });

  // Also emit completed toggled false just in case
  io.to(String(id)).emit("series-completed-toggled", {
    seriesId,
    isCompleted: false,
    seriesWatched: user.seriesWatched,
  });

  return res.json({ seriesWatched: user.seriesWatched });
}
