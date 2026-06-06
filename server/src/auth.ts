import { Router, Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";
import { JWT_SECRET, GOOGLE_CLIENT_ID } from "./config.js";
import { AuthenticatedRequest, asyncHandler } from "./middleware.js";

const router = Router();
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    _res.status(401).json({ error: "Missing token" });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { userId: number };
    (req as AuthenticatedRequest).userId = payload.userId;
    next();
  } catch {
    _res.status(401).json({ error: "Invalid token" });
  }
}

async function verifyGoogleToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error("Invalid Google token");
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    avatar: payload.picture,
  };
}

router.post("/google", asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ error: "Google ID token required" });
    return;
  }

  const googleUser = await verifyGoogleToken(idToken);

  let user = await prisma.user.findUnique({
    where: { googleId: googleUser.googleId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        googleId: googleUser.googleId,
        email: googleUser.email || "",
        name: googleUser.name || "User",
        avatar: googleUser.avatar || "",
        balance: 0,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: googleUser.name || user.name,
        avatar: googleUser.avatar || user.avatar,
      },
    });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({
    token,
    userId: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    balance: user.balance,
  });
}));

router.get("/me", authMiddleware, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, avatar: true, balance: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
}));

export default router;