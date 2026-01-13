import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import authRouter from "./features/auth/auth.routes.js";
import userRouter from "./features/users/user.routes.js";
import imbdRouter from "./features/movies/imdb.routes.js";
import socialRouter from "./features/social/social.routes.js";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
app.use(express.json());
app.use(cors());
app.use(helmet());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/imbd", imbdRouter);
app.use("/api/social", socialRouter);

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(String(userId));
  });
});

export default app;
