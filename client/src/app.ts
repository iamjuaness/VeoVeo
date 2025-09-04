import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";
import imbdRouter from "./routes/imbd.route";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});
app.use(express.json());
app.use(cors());
app.use(helmet());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/imbd", imbdRouter);

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(String(userId));
  });
});

server.listen(5000, () => console.log("Servidor corriendo en puerto 5000"));

export default app;
