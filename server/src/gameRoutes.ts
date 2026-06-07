import { Router } from "express";
import { prisma } from "./db.js";
import { getCurrentRound } from "./game.js";
import { COLORS, SPECIAL_COLOR, getPayoutMultiplier } from "./game.js";

const router = Router();

router.get("/state", (_req, res) => {
  const round = getCurrentRound();
  res.json({
    round,
    colors: [...COLORS],
    specialColor: SPECIAL_COLOR,
    payouts: Object.fromEntries(COLORS.map((c) => [c, getPayoutMultiplier(c)])),
  });
});

router.get("/history", async (_req, res) => {
  const rounds = await prisma.round.findMany({
    where: { status: "COMPLETED" },
    orderBy: { id: "desc" },
    take: 20,
  });
  res.json(rounds);
});

router.get("/leaderboard", async (_req, res) => {
  const topPlayers = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    avatar: string;
    totalWinnings: number;
    wins: number;
  }>>`
    SELECT CAST(u.id AS INTEGER) as id, u.name, u.avatar,
      CAST(COALESCE(SUM(b.payout), 0) AS REAL) as totalWinnings,
      CAST(COUNT(b.id) AS INTEGER) as wins
    FROM User u
    LEFT JOIN Bet b ON u.id = b.userId AND b.won = 1
    GROUP BY u.id
    HAVING COALESCE(SUM(b.payout), 0) > 0
    ORDER BY COALESCE(SUM(b.payout), 0) DESC
    LIMIT 20
  `;
  res.json(topPlayers);
});

router.get("/round/:roundId/winners", async (req, res) => {
  const roundId = parseInt(req.params.roundId, 10);
  if (isNaN(roundId)) {
    res.status(400).json({ error: "Invalid round ID" });
    return;
  }

  const round = await prisma.round.findUnique({
    where: { id: roundId },
  });

  if (!round || round.status !== "COMPLETED") {
    res.status(404).json({ error: "Round not found or not completed" });
    return;
  }

  const winningBets = await prisma.bet.findMany({
    where: { roundId, won: true },
    include: { user: true },
    orderBy: { payout: "desc" },
  });

  const winners = winningBets.map((bet) => ({
    userId: bet.userId,
    name: bet.user.name,
    avatar: bet.user.avatar,
    color: bet.color,
    amount: bet.amount,
    payout: bet.payout ?? 0,
  }));

  res.json({ roundId, resultColor: round.resultColor, winners });
});

export default router;