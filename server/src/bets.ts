import { Router, Request, Response } from "express";
import { prisma } from "./db.js";
import { authMiddleware } from "./auth.js";
import { canPlaceBet, getCurrentRound, COLORS, GameColor } from "./game.js";

const router = Router();

router.use(authMiddleware);

router.post("/place", async (req: Request, res: Response) => {
  try {
    const { color, amount } = req.body;
    const userId = (req as any).userId;

    if (!color || !amount) {
      return res.status(400).json({ error: "Color and amount required" });
    }

    if (!COLORS.includes(color as GameColor)) {
      return res.status(400).json({ error: "Invalid color. Must be: red, green, or blue" });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }

    if (!canPlaceBet()) {
      return res.status(400).json({ error: "Betting is closed for this round. Wait for the next round." });
    }

    const round = getCurrentRound();
    if (!round) {
      return res.status(400).json({ error: "No active round" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const existingBet = await prisma.bet.findFirst({
      where: { userId, roundId: round.roundId },
    });
    if (existingBet) {
      return res.status(400).json({ error: "You already placed a bet this round" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });

    await prisma.transaction.create({
      data: {
        userId,
        type: "BET",
        amount: -amount,
      },
    });

    const bet = await prisma.bet.create({
      data: {
        userId,
        roundId: round.roundId,
        color,
        amount,
      },
    });

    return res.json({
      betId: bet.id,
      roundId: round.roundId,
      color,
      amount,
      timeRemaining: round.timeRemaining,
    });
  } catch (err) {
    console.error("Place bet error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/history", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const bets = await prisma.bet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { round: true },
    });
    return res.json(bets);
  } catch (err) {
    console.error("Bet history error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/current-round-bet", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const round = getCurrentRound();
    if (!round) return res.json({ bet: null });

    const bet = await prisma.bet.findFirst({
      where: { userId, roundId: round.roundId },
    });
    return res.json({ bet, roundId: round.roundId });
  } catch (err) {
    console.error("Current round bet error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;