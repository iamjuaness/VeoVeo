import { Router } from "express";
import { authMiddleware } from "../../core/middleware/authMiddleware.js";
import {
  addOrIncrementWatched,
  resetWatched,
  toggleWatchLater,
  getUserMovieStatus,
} from "../movies/movie.controller.js";
import {
  getMovieInWatchLater,
  getMovieWatchCount,
} from "../users/user.controller.js";
import {
  toggleSeriesWatchLater,
  getUserSeriesStatus,
  toggleEpisodeWatched,
  markAllEpisodesWatched,
  getSeriesProgress,
  toggleSeriesCompleted,
} from "../series/series.controller.js";
import {
  fetchSeriesBatchRawController,
  fetchSeriesDetail,
  fetchSeasonEpisodes,
} from "../series/imdb-series.controller.js";

const router = Router();

router.use(authMiddleware);

// Movie routes
router.post("/movies/watched", addOrIncrementWatched);
router.post("/movies/reset", resetWatched);
router.post("/movies/watch-later", toggleWatchLater);
router.get("/movies/status", getUserMovieStatus);
router.get("/count/:movieId", getMovieWatchCount);
router.get("/in-watch-later/:movieId", getMovieInWatchLater);

// Series user routes
router.post("/series/watch-later", toggleSeriesWatchLater);
router.get("/series/status", getUserSeriesStatus);
router.post("/series/completed", toggleSeriesCompleted);
router.post("/series/episodes/watched", toggleEpisodeWatched);
router.post("/series/mark-all-watched", markAllEpisodesWatched);
router.get("/series/:id/progress", getSeriesProgress);

// Series IMDB proxy routes
router.post("/series/batch", fetchSeriesBatchRawController);
router.get("/series/:id", fetchSeriesDetail);
router.get("/series/:id/episodes/:season", fetchSeasonEpisodes);

export default router;
