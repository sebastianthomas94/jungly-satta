// @ts-expect-error BigInt serialization for JSON.stringify
BigInt.prototype.toJSON = function () { return Number(this); };

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./db.js";
import { initGame, getCurrentRound } from "./game.js";
import authRoutes from "./auth.js";
import walletRoutes from "./wallet.js";
import betRoutes from "./bets.js";
import gameRoutes from "./gameRoutes.js";
import youtubeRoutes from "./youtube.js";
import paymentRoutes from "./payment.js";
import cors from "cors";
import { CORS_ORIGINS, PORT } from "./config.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGINS, methods: ["GET", "POST"] },
});

app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/bets", betRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/payment", paymentRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

io.on("connection", (socket) => {
  const round = getCurrentRound();
  if (round) {
    socket.emit("round:current", round);
  }

  socket.on("game:subscribe", () => {
    const round = getCurrentRound();
    if (round) {
      socket.emit("round:current", round);
    }
  });
});

async function main() {
  await prisma.$connect();
  console.log("Database connected");

  initGame(io);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});