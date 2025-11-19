import UserModel from "../users/user.model.js";
import { Request, Response } from "express";

/**
 * Obtiene el contador de veces que el usuario vio una película en particular.
 * @param userId string - ID del usuario
 * @param movieId string - ID de la película
 * @returns number (contador) o 0 si no existe
 */
export async function getWatchCount(
  userId: string,
  movieId: string
): Promise<number> {
  const user = await UserModel.findById(userId, { moviesWatched: 1 }).lean();

  if (!user || !user.moviesWatched) return 0;

  const watchedMovie = user.moviesWatched.find((mw) => mw.movieId === movieId);
  return watchedMovie ? watchedMovie.count : 0;
}

/**
 * Verifica si una película está en la lista watchLater del usuario.
 * @param userId string - ID del usuario
 * @param movieId string - ID de la película
 * @returns boolean
 */
export async function isInWatchLater(
  userId: string,
  movieId: string
): Promise<boolean> {
  const user = await UserModel.findById(userId, { watchLater: 1 }).lean();

  if (!user || !user.watchLater) return false;

  return user.watchLater.includes(movieId);
}

// Controlador que usa userId desde middleware (req.user) y movieId de req.params
export async function getMovieWatchCount(req: Request, res: Response) {
  try {
    const { id } = req;
    const { movieId } = req.params;

    if (!id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!movieId) {
      return res.status(400).json({ message: "movieId is required" });
    }

    const count = await getWatchCount(id, movieId);
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

// Controlador que usa userId desde middleware y movieId de req.params
export async function getMovieInWatchLater(req: Request, res: Response) {
  try {
    const { id } = req;
    const { movieId } = req.params;

    if (!id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!movieId) {
      return res.status(400).json({ message: "movieId is required" });
    }

    const inList = await isInWatchLater(id, movieId);
    res.json({ inWatchLater: inList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
