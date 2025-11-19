import { Router } from "express";
import { authMiddleware } from "../../core/middleware/authMiddleware";
import { addOrIncrementWatched, resetWatched, toggleWatchLater, getUserMovieStatus } from "../movies/movie.controller";
import { getMovieInWatchLater, getMovieWatchCount } from "../users/user.controller";

const router = Router();

router.use(authMiddleware);

router.post("/movies/watched", addOrIncrementWatched);
router.post("/movies/reset", resetWatched);
router.post("/movies/watch-later", toggleWatchLater);
router.get("/movies/status", getUserMovieStatus);
router.get("/count/:movieId", getMovieWatchCount);
router.get("/in-watch-later/:movieId", getMovieInWatchLater);

export default router;