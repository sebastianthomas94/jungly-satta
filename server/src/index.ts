import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { prisma } from "./db.js";
import { initGame, getCurrentRound } from "./game.js";
import authRoutes, { authMiddleware } from "./auth.js";
import walletRoutes from "./wallet.js";
import betRoutes from "./bets.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/bets", betRoutes);

app.get("/api/game/state", (_req, res) => {
  const round = getCurrentRound();
  res.json({
    round,
    colors: ["red", "green", "blue"],
    specialColor: "red",
    payouts: { red: 3, green: 2, blue: 2 },
  });
});

app.get("/api/game/history", async (_req, res) => {
  const rounds = await prisma.round.findMany({
    where: { status: "COMPLETED" },
    orderBy: { id: "desc" },
    take: 20,
  });
  res.json(rounds);
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

const PORT = process.env.PORT || 3001;

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