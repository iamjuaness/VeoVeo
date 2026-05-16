import { Router } from "express";
import { register, login, refresh } from "./auth.controller.js";
import { validate } from "../../core/middleware/validate.js";
import { registerSchema, loginSchema } from "../users/user.schemas.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);

export default router;
