import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { addOrIncrementWatched, resetWatched, toggleWatchLater, getUserMovieStatus } from "../controllers/movie.controller";

const router = Router();

router.use(authMiddleware);

router.post("/movies/watched", addOrIncrementWatched);
router.post("/movies/reset", resetWatched);
router.post("/movies/watch-later", toggleWatchLater);
router.get("/movies/status", getUserMovieStatus);

export default router;