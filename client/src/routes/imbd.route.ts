import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  fetchMoviesBatchRawController as fetchMoviesBatchRaw,
} from "../controllers/imbd.controller";

const router = Router();

router.use(authMiddleware);

// POST /imbd/movies/batch/:ids
router.post("/movies/batch/", fetchMoviesBatchRaw);

export default router;
