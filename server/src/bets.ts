import { Router } from "express";
import { prisma } from "./db.js";
import { authMiddleware } from "./auth.js";
import { canPlaceBet, getCurrentRound, COLORS, GameColor } from "./game.js";
import { AuthenticatedRequest, asyncHandler } from "./middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/place", asyncHandler(async (req, res) => {
  const { color, amount } = req.body;

  if (!color || !amount) {
    res.status(400).json({ error: "Color and amount required" });
    return;
  }

  if (!COLORS.includes(color as GameColor)) {
    res.status(400).json({ error: "Invalid color. Must be: red, green, or blue" });
    return;
  }

  if (typeof amount !== "number" || amount <= 0) {
    res.status(400).json({ error: "Amount must be a positive number" });
    return;
  }

  if (!canPlaceBet()) {
    res.status(400).json({ error: "Betting is closed for this round. Wait for the next round." });
    return;
  }

  const round = getCurrentRound();
  if (!round) {
    res.status(400).json({ error: "No active round" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.balance < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const existingBet = await prisma.bet.findFirst({
    where: { userId: req.userId, roundId: round.roundId },
  });
  if (existingBet) {
    res.status(400).json({ error: "You already placed a bet this round" });
    return;
  }

  await prisma.user.update({
    where: { id: req.userId },
    data: { balance: { decrement: amount } },
  });

  await prisma.transaction.create({
    data: { userId: req.userId, type: "BET", amount: -amount },
  });

  const bet = await prisma.bet.create({
    data: { userId: req.userId, roundId: round.roundId, color, amount },
  });

  res.json({
    betId: bet.id,
    roundId: round.roundId,
    color,
    amount,
    timeRemaining: round.timeRemaining,
  });
}));

router.get("/history", asyncHandler(async (req, res) => {
  const bets = await prisma.bet.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { round: true },
  });
  res.json(bets);
}));

router.get("/current-round-bet", asyncHandler(async (req, res) => {
  const round = getCurrentRound();
  if (!round) {
    res.json({ bet: null });
    return;
  }

  const bet = await prisma.bet.findFirst({
    where: { userId: req.userId, roundId: round.roundId },
  });
  res.json({ bet, roundId: round.roundId });
}));

export default router;