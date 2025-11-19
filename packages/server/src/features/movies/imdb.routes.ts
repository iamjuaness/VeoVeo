import { Router } from "express";
import { authMiddleware } from "../../core/middleware/authMiddleware.js";
import {
  fetchMoviesBatchRawController as fetchMoviesBatchRaw,
} from "./imdb.controller.js";

const router = Router();

router.use(authMiddleware);

// POST /imbd/movies/batch/:ids
router.post("/movies/batch/", fetchMoviesBatchRaw);

export default router;
