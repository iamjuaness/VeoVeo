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

export async function searchUsers(req: Request, res: Response) {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await UserModel.find(
      {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
        _id: { $ne: req.id }, // Exclude current user
      },
      { name: 1, email: 1, selectedAvatar: 1 }
    ).limit(10);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getUserProfile(req: Request, res: Response) {
  try {
    const { id } = req;
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const user = await UserModel.findById(id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      ...user,
      id: String(user._id),
      avatar: user.selectedAvatar,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateUserProfile(req: Request, res: Response) {
  try {
    const { id } = req;
    const { name, email, bio, selectedAvatar } = req.body;

    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const update: any = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (bio !== undefined) update.bio = bio;
    if (selectedAvatar) update.selectedAvatar = selectedAvatar;

    const user = await UserModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    )
      .select("-password")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      ...user,
      id: String(user._id),
      avatar: user.selectedAvatar,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateUserSettings(req: Request, res: Response) {
  try {
    const { id } = req;
    const {
      notificationPreferences,
      privacyPreferences,
      appearancePreferences,
    } = req.body;

    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const update: any = {};
    if (notificationPreferences)
      update.notificationPreferences = notificationPreferences;
    if (privacyPreferences) update.privacyPreferences = privacyPreferences;
    if (appearancePreferences)
      update.appearancePreferences = appearancePreferences;

    const user = await UserModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    )
      .select("-password")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      ...user,
      id: String(user._id),
      avatar: user.selectedAvatar,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
