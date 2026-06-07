import { Router } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { prisma } from "./db.js";
import { authMiddleware } from "./auth.js";
import { asyncHandler, type AuthenticatedRequest } from "./middleware.js";
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "./config.js";

const router = Router();

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

router.use(authMiddleware);

router.post(
  "/create-order",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: "Amount must be a positive number" });
      return;
    }

    if (amount < 1) {
      res.status(400).json({ error: "Minimum deposit amount is ₹1" });
      return;
    }

    const amountInPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${req.userId}_${Date.now()}`,
    });

    await prisma.payment.create({
      data: {
        userId: req.userId,
        razorpayOrderId: order.id,
        amount: amount,
        status: "PENDING",
      },
    });

    res.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID,
    });
  })
);

router.post(
  "/verify",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ error: "Missing payment verification details" });
      return;
    }

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ error: "Invalid payment signature" });
      return;
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (!payment) {
      res.status(404).json({ error: "Payment order not found" });
      return;
    }

    if (payment.userId !== req.userId) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    if (payment.status === "COMPLETED") {
      res.json({ message: "Payment already processed", balance: null });
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "COMPLETED",
      },
    });

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { balance: { increment: payment.amount } },
      select: { id: true, balance: true },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount: payment.amount,
      },
    });

    res.json({ message: "Payment successful", balance: user.balance });
  })
);

export default router;