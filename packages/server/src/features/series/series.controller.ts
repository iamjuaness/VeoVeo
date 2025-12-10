import { Request, Response } from "express";
import User from "../users/user.model.js";
import { io } from "../../app.js";

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
// Body: { seriesId: string, seasonNumber: number, episodeNumber: number }
export async function toggleEpisodeWatched(req: Request, res: Response) {
  const { id } = req;
  const { seriesId, seasonNumber, episodeNumber } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Find or create series entry
  let seriesEntry = user.seriesWatched.find((s) => s.seriesId === seriesId);
  if (!seriesEntry) {
    seriesEntry = { seriesId, episodes: [] };
    user.seriesWatched.push(seriesEntry);
  }

  // Check if episode already watched
  const episodeIndex = seriesEntry.episodes.findIndex(
    (e) => e.seasonNumber === seasonNumber && e.episodeNumber === episodeNumber
  );

  if (episodeIndex >= 0) {
    // Remove episode (unmark as watched)
    seriesEntry.episodes.splice(episodeIndex, 1);

    // Clean up: Remove series entry if no episodes left
    if (seriesEntry.episodes.length === 0) {
      user.seriesWatched = user.seriesWatched.filter(
        (s) => s.seriesId !== seriesId
      );
    }
  } else {
    // Add episode (mark as watched)
    seriesEntry.episodes.push({
      seasonNumber,
      episodeNumber,
      watchedAt: new Date(),
    });
  }

  await user.save();

  io.to(String(id)).emit("episode-watched-toggled", {
    seriesId,
    seasonNumber,
    episodeNumber,
    seriesWatched: user.seriesWatched,
  });

  return res.json({ seriesWatched: user.seriesWatched });
}

// POST /api/user/series/mark-all-watched
// Body: { seriesId: string, seasons: { seasonNumber: number, episodeCount: number }[] }
export async function markAllEpisodesWatched(req: Request, res: Response) {
  const { id } = req;
  const { seriesId, seasons } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Find or create series entry
  let seriesEntry = user.seriesWatched.find((s) => s.seriesId === seriesId);
  if (!seriesEntry) {
    seriesEntry = { seriesId, episodes: [] };
    user.seriesWatched.push(seriesEntry);
  }

  // Mark all episodes as watched
  const now = new Date();
  seasons.forEach((season: { seasonNumber: number; episodeCount: number }) => {
    for (let ep = 1; ep <= season.episodeCount; ep++) {
      const exists = seriesEntry!.episodes.some(
        (e) => e.seasonNumber === season.seasonNumber && e.episodeNumber === ep
      );
      if (!exists) {
        seriesEntry!.episodes.push({
          seasonNumber: season.seasonNumber,
          episodeNumber: ep,
          watchedAt: now,
        });
      }
    }
  });

  seriesEntry.isCompleted = true;

  await user.save();

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
