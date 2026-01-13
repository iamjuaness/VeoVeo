import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../users/user.model.js";
import MediaCacheModel from "../media/media.model.js";
import { io } from "../../app.js";
import { ensureMediaInCache, enrichMediaList } from "../media/media.service.js";

// Función helper para obtener película enriquecida por ID
async function getEnrichedWatchedMovie(
  userId: string | undefined,
  movieId: string
) {
  const [result] = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    { $unwind: { path: "$moviesWatched", preserveNullAndEmptyArrays: true } },
    { $match: { "moviesWatched.movieId": movieId } },
    {
      $lookup: {
        from: MediaCacheModel.collection.name,
        localField: "moviesWatched.movieId",
        foreignField: "id",
        as: "watchedDetails",
      },
    },
    {
      $addFields: {
        movieDetail: { $arrayElemAt: ["$watchedDetails", 0] },
      },
    },
    {
      $project: {
        id: "$moviesWatched.movieId",
        movieId: "$moviesWatched.movieId",
        count: "$moviesWatched.count",
        duration: {
          $ifNull: ["$movieDetail.duration", "$moviesWatched.duration"],
        },
        watchedAt: "$moviesWatched.watchedAt",
        type: { $ifNull: ["$movieDetail.type", "movie"] },
        title: { $ifNull: ["$movieDetail.title", "Unknown Title"] },
        year: "$movieDetail.year",
        genres: { $ifNull: ["$movieDetail.genres", []] },
        rating: "$movieDetail.rating",
        description: { $ifNull: ["$movieDetail.description", ""] },
        poster: { $ifNull: ["$movieDetail.poster", ""] },
        backdrop: { $ifNull: ["$movieDetail.backdrop", ""] },
        lastUpdated: "$movieDetail.lastUpdated",
      },
    },
  ]);

  return result[0] || null;
}

// Función para watchLater (más simple, solo cache)
async function getEnrichedWatchLaterMovie(movieId: string) {
  const media = await MediaCacheModel.findOne({ id: movieId });
  if (!media) return null;

  return {
    id: media.id,
    movieId: media.id,
    watchLater: true,
    type: media.type as "movie" | "tvSeries" | "tvMiniSeries",
    duration: media.duration,
    title: media.title,
    year: media.year,
    genres: media.genres,
    rating: media.rating,
    description: media.description,
    poster: media.poster,
    backdrop: media.backdrop,
    lastUpdated: media.lastUpdated,
  };
}

export async function addOrIncrementWatched(req: Request, res: Response) {
  const { id } = req;
  const { movieId, duration, watchedAt } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Cache movie metadata on-demand
  await ensureMediaInCache(movieId);

  const found = user.moviesWatched.find((item) => item.movieId === movieId);
  let newMovieData;

  if (found) {
    found.count += watchedAt?.length ?? 1;
    if (watchedAt && watchedAt.length > 0) {
      const set = new Set([...(found.watchedAt || []), ...watchedAt]);
      found.watchedAt = Array.from(set).sort();
    }
  } else {
    user.moviesWatched.push({
      movieId,
      count: watchedAt?.length ?? 1,
      duration,
      watchedAt: watchedAt || [],
    });
  }
  await user.save();

  newMovieData = await getEnrichedWatchedMovie(id, movieId);

  io.to(String(id)).emit("movies-watched", {
    type: "add",
    data: newMovieData,
  });

  return res.json({ moviesWatched: user.moviesWatched });
}

// POST /api/user/movies/reset
// POST /api/user/movies/reset
export async function resetWatched(req: Request, res: Response) {
  const { id } = req;
  const { movieId } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const movieIndex = user.moviesWatched.findIndex((m) => m.movieId === movieId);

  if (movieIndex > -1) {
    const movieEntry = user.moviesWatched[movieIndex];
    if (movieEntry.count && movieEntry.count > 1) {
      // Decrement count
      movieEntry.count -= 1;
      // Remove the last watched date
      if (movieEntry.watchedAt && movieEntry.watchedAt.length > 0) {
        movieEntry.watchedAt.pop();
      }
    } else {
      // Remove completely if count is 1 or 0
      user.moviesWatched.splice(movieIndex, 1);
    }
  }

  await user.save();

  io.to(String(id)).emit("movie-watched-updated", {
    moviesWatched: user.moviesWatched,
  });

  return res.json({ moviesWatched: user.moviesWatched });
}

// POST /api/user/movies/watch-later
// Body: { movieId: string }
export async function toggleWatchLater(req: Request, res: Response) {
  const { id } = req;
  const { movieId } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  let newWatchLaterData;
  let isAdding = false;

  // Cache movie metadata when adding to watch later
  if (!user.watchLater.includes(movieId)) {
    await ensureMediaInCache(movieId);
  }

  if (user.watchLater.includes(movieId)) {
    user.watchLater = user.watchLater.filter((id) => id !== movieId);
  } else {
    await ensureMediaInCache(movieId);
    user.watchLater.push(movieId);
    isAdding = true;

    newWatchLaterData = await getEnrichedWatchLaterMovie(movieId);
  }
  await user.save();

  io.to(String(id)).emit("watch-later-toggled", {
    movieId,
    watchLater: user.watchLater,
    newMovie: isAdding ? newWatchLaterData : null,
  });
  return res.json({ watchLater: user.watchLater });
}

export async function getUserMovieStatus(req: Request, res: Response) {
  const { id } = req;

  // Use aggregation to fetch everything in one DB round trip
  const start = Date.now();
  const [result] = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $project: {
        moviesWatched: 1,
        watchLater: 1,
      },
    },
    // 1. Enrich Watch Later (Array of strings)
    {
      $lookup: {
        from: MediaCacheModel.collection.name,
        localField: "watchLater",
        foreignField: "id",
        as: "watchLaterDetails",
      },
    },
    // 2. Unwind moviesWatched to enrich individual items
    {
      $unwind: {
        path: "$moviesWatched",
        preserveNullAndEmptyArrays: true,
      },
    },
    // 3. Lookup details for each watched movie
    {
      $lookup: {
        from: MediaCacheModel.collection.name,
        localField: "moviesWatched.movieId",
        foreignField: "id",
        as: "watchedDetails",
      },
    },
    // 4. Merge details and re-group
    {
      $addFields: {
        // Take the first match from lookup (should be unique by imdbId)
        movieDetail: { $arrayElemAt: ["$watchedDetails", 0] },
      },
    },
    {
      $group: {
        _id: "$_id",
        watchLaterDetails: { $first: "$watchLaterDetails" },
        // Reconstruct moviesWatched array with merged data
        moviesWatched: {
          $push: {
            $cond: [
              { $ifNull: ["$moviesWatched.movieId", false] }, // Only if movieId exists (handle empty array case)
              {
                id: "$moviesWatched.movieId", // Frontend expects 'id'
                movieId: "$moviesWatched.movieId",
                count: "$moviesWatched.count",
                duration: {
                  $ifNull: [
                    "$movieDetail.runtimeMins",
                    "$moviesWatched.duration",
                  ],
                }, // Fallback to user stored duration or cached
                watchedAt: "$moviesWatched.watchedAt",
                // Full Metadata
                type: { $ifNull: ["$movieDetail.type", "movie"] },
                title: { $ifNull: ["$movieDetail.title", "Unknown Title"] },
                year: "$movieDetail.year",
                genres: { $ifNull: ["$movieDetail.genres", []] },
                rating: "$movieDetail.rating",
                description: { $ifNull: ["$movieDetail.description", ""] },
                poster: { $ifNull: ["$movieDetail.poster", ""] },
                backdrop: { $ifNull: ["$movieDetail.backdrop", ""] },
                lastUpdated: "$movieDetail.lastUpdated",
              },
              "$$REMOVE", // Exclude nulls if array was initially empty
            ],
          },
        },
      },
    },
    {
      $project: {
        moviesWatched: 1,
        // Format watchLater similar to enriched output
        watchLater: {
          $map: {
            input: "$watchLaterDetails",
            as: "wl",
            in: {
              id: "$$wl.id",
              movieId: "$$wl.id",
              watchLater: true,
              // Full Metadata
              type: { $ifNull: ["$$wl.type", "movie"] },
              duration: "$$wl.duration",
              title: "$$wl.title",
              year: "$$wl.year",
              genres: { $ifNull: ["$$wl.genres", []] },
              rating: "$$wl.rating",
              description: { $ifNull: ["$$wl.description", ""] },
              poster: { $ifNull: ["$$wl.poster", ""] },
              backdrop: { $ifNull: ["$$wl.backdrop", ""] },
              lastUpdated: "$$wl.lastUpdated",
            },
          },
        },
      },
    },
  ]);

  if (!result) return res.status(404).json({ message: "User not found" });

  const response = {
    moviesWatched: result.moviesWatched || [],
    watchLater: result.watchLater || [],
    stats: {
      watchedCount: result.moviesWatched?.length || 0,
      watchLaterCount: result.watchLater?.length || 0,
    },
  };

  res.json(response);
}
