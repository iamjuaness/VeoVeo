import { Router } from "express";
import { register, login } from "./auth.controller";
import { validate } from "../../core/middleware/validate";
import { registerSchema, loginSchema } from "../users/user.schemas";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

export default router;
