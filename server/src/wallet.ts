import { Router } from "express";
import { prisma } from "./db.js";
import { authMiddleware } from "./auth.js";
import { AuthenticatedRequest, asyncHandler } from "./middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/balance", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { balance: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ balance: user.balance });
}));

router.post("/deposit", asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    res.status(400).json({ error: "Amount must be positive" });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { balance: { increment: amount } },
    select: { id: true, balance: true },
  });

  await prisma.transaction.create({
    data: { userId: user.id, type: "DEPOSIT", amount },
  });

  res.json({ balance: user.balance });
}));

router.post("/withdraw", asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    res.status(400).json({ error: "Amount must be positive" });
    return;
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { balance: true },
  });

  if (!currentUser || currentUser.balance < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { balance: { decrement: amount } },
    select: { id: true, balance: true },
  });

  await prisma.transaction.create({
    data: { userId: user.id, type: "WITHDRAW", amount },
  });

  res.json({ balance: user.balance });
}));

router.get("/transactions", asyncHandler(async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(transactions);
}));

export default router;