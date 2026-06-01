import { Router } from "express";
import { ImagesController } from "./images.controller.js";

const router = Router();

router.get("/", ImagesController.proxyImage);

export default router;
