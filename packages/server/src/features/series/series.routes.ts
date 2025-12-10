import { Router } from "express";
import { authMiddleware } from "../../core/middleware/authMiddleware.js";
import {
  toggleSeriesWatchLater,
  getUserSeriesStatus,
  toggleEpisodeWatched,
  markAllEpisodesWatched,
  getSeriesProgress,
} from "./series.controller.js";
import {
  fetchSeriesBatchRawController,
  fetchSeriesDetail,
  fetchSeasonEpisodes,
} from "./imdb-series.controller.js";

const router = Router();

// User series endpoints
router.post("/series/watch-later", authMiddleware, toggleSeriesWatchLater);
router.get("/series/status", authMiddleware, getUserSeriesStatus);
router.post("/series/episodes/watched", authMiddleware, toggleEpisodeWatched);
router.post("/series/mark-all-watched", authMiddleware, markAllEpisodesWatched);
router.get("/series/:id/progress", authMiddleware, getSeriesProgress);

// IMDB series endpoints
router.post("/series/batch", authMiddleware, fetchSeriesBatchRawController);
router.get("/series/:id", authMiddleware, fetchSeriesDetail);
router.get("/series/:id/episodes/:season", authMiddleware, fetchSeasonEpisodes);

export default router;
