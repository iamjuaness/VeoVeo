// POST /api/user/movies/watched
// Body: { movieId: string }
import { Request, Response } from "express";
import User from "../models/user.model";
import { io } from "../app";

export async function addOrIncrementWatched(req: Request, res: Response) {
  const { id } = req;
  const { movieId, duration, watchedAt } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const found = user.moviesWatched.find((item) => item.movieId === movieId);

  if (found) {
    found.count += watchedAt?.length ?? 1;  // suma las vistas nuevas
    if (watchedAt && watchedAt.length > 0) {
      // Evita fechas duplicadas (si lo deseas)
      const set = new Set([...(found.watchedAt || []), ...watchedAt]);
      found.watchedAt = Array.from(set).sort(); // ordena si quieres por fecha
    }
    // Actualiza duration si lo necesitas...
  } else {
    user.moviesWatched.push({
      movieId,
      count: watchedAt?.length ?? 1,
      duration,
      watchedAt: watchedAt || []
    });
  }
  await user.save();
  io.to(String(id)).emit("movies-watched", {
    type: "add",
    data: {
      movieId,
      count: found ? found.count : (watchedAt?.length ?? 1),
      duration,
      watchedAt: found ? found.watchedAt : (watchedAt || [])
    },
  });
  return res.json({ moviesWatched: user.moviesWatched });
}


// POST /api/user/movies/reset
// Body: { movieId: string }
export async function resetWatched(req: Request, res: Response) {
  const { id } = req;
  const { movieId } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Elimina del array la película con ese movieId
  user.moviesWatched = user.moviesWatched.filter(
    (item) => item.movieId !== movieId
  );

  await user.save();
  io.to(String(id)).emit("movies-reset", {
    type: "reset",
    movieId,
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

  if (user.watchLater.includes(movieId)) {
    user.watchLater = user.watchLater.filter((id) => id !== movieId);
  } else {
    user.watchLater.push(movieId);
  }
  await user.save();
  io.to(String(id)).emit("watch-later-toggled", {
    movieId,
    watchLater: user.watchLater,
  });
  return res.json({ watchLater: user.watchLater });
}

// GET /api/user/movies/status
export async function getUserMovieStatus(req: Request, res: Response) {
  const { id } = req;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({
    moviesWatched: user.moviesWatched,
    watchLater: user.watchLater,
  });
}
