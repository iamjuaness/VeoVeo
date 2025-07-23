import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import "dotenv/config";
import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

export default app;
