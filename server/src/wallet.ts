import { Router, Request, Response } from "express";
import { prisma } from "./db.js";
import { authMiddleware } from "./auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/balance", async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId },
      select: { balance: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ balance: user.balance });
  } catch (err) {
    console.error("Balance error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/deposit", async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    const user = await prisma.user.update({
      where: { id: (req as any).userId },
      data: { balance: { increment: amount } },
      select: { id: true, balance: true },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount,
      },
    });

    return res.json({ balance: user.balance });
  } catch (err) {
    console.error("Deposit error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/withdraw", async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: (req as any).userId },
      select: { balance: true },
    });

    if (!currentUser || currentUser.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const user = await prisma.user.update({
      where: { id: (req as any).userId },
      data: { balance: { decrement: amount } },
      select: { id: true, balance: true },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "WITHDRAW",
        amount,
      },
    });

    return res.json({ balance: user.balance });
  } catch (err) {
    console.error("Withdraw error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/transactions", async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: (req as any).userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return res.json(transactions);
  } catch (err) {
    console.error("Transactions error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;