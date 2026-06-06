import { Server } from "socket.io";
import { prisma } from "./db.js";
import { ROUND_DURATION_MS, BETTING_CUTOFF_MS, RESULT_DISPLAY_MS } from "./config.js";

const COLORS = ["red", "green", "blue"] as const;
const SPECIAL_COLOR = "red";
const REGULAR_PAYOUT = 2;
const SPECIAL_PAYOUT = 3;

export type GameColor = (typeof COLORS)[number];

export interface RoundState {
  roundId: number;
  status: "BETTING" | "ROLLING" | "COMPLETED";
  timeRemaining: number;
  resultColor?: GameColor;
}

export interface WinnerInfo {
  userId: number;
  name: string;
  avatar: string;
  color: string;
  amount: number;
  payout: number;
}

const DICE_WEIGHTS: Record<GameColor, number> = {
  red: 2,
  green: 3,
  blue: 3,
};

let currentRound: RoundState | null = null;
let roundTimer: ReturnType<typeof setTimeout> | null = null;
let tickInterval: ReturnType<typeof setInterval> | null = null;
let io: Server | null = null;

function rollDice(): GameColor {
  const totalWeight = COLORS.reduce((sum, c) => sum + DICE_WEIGHTS[c], 0);
  let roll = Math.random() * totalWeight;
  for (const color of COLORS) {
    roll -= DICE_WEIGHTS[color];
    if (roll <= 0) return color;
  }
  return COLORS[COLORS.length - 1];
}

export function getPayoutMultiplier(color: GameColor): number {
  return color === SPECIAL_COLOR ? SPECIAL_PAYOUT : REGULAR_PAYOUT;
}

function clearTimers() {
  if (roundTimer) {
    clearTimeout(roundTimer);
    roundTimer = null;
  }
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

async function resolveRound(roundId: number, resultColor: GameColor): Promise<WinnerInfo[]> {
  const bets = await prisma.bet.findMany({
    where: { roundId },
    include: { user: true },
  });

  const winners: WinnerInfo[] = [];

  for (const bet of bets) {
    const won = bet.color === resultColor;
    const payout = won ? bet.amount * getPayoutMultiplier(bet.color as GameColor) : 0;

    await prisma.bet.update({
      where: { id: bet.id },
      data: { won, payout },
    });

    if (won) {
      await prisma.user.update({
        where: { id: bet.userId },
        data: { balance: { increment: payout } },
      });

      await prisma.transaction.create({
        data: { userId: bet.userId, type: "WIN", amount: payout },
      });

      winners.push({
        userId: bet.userId,
        name: bet.user.name,
        avatar: bet.user.avatar,
        color: bet.color,
        amount: bet.amount,
        payout,
      });
    }
  }

  await prisma.round.update({
    where: { id: roundId },
    data: { resultColor, status: "COMPLETED", endTime: new Date() },
  });

  return winners;
}

async function startNewRound() {
  clearTimers();

  if (currentRound?.roundId) {
    const resultColor = rollDice();
    currentRound.resultColor = resultColor;
    currentRound.status = "ROLLING";

    io?.emit("round:rolling", {
      roundId: currentRound.roundId,
      resultColor,
    });

    const winners = await resolveRound(currentRound.roundId, resultColor);

    io?.emit("round:result", {
      roundId: currentRound.roundId,
      resultColor,
      payouts: getPayoutMultiplier(resultColor),
      winners,
    });

    await new Promise((r) => setTimeout(r, RESULT_DISPLAY_MS));
  }

  const round = await prisma.round.create({
    data: { status: "BETTING" },
  });

  currentRound = {
    roundId: round.id,
    status: "BETTING",
    timeRemaining: ROUND_DURATION_MS,
  };

  io?.emit("round:new", currentRound);

  roundTimer = setTimeout(() => {
    if (!currentRound) return;
    currentRound.status = "ROLLING";
    currentRound.timeRemaining = 0;
    io?.emit("round:closing", { roundId: currentRound.roundId });

    setTimeout(() => startNewRound(), 1000);
  }, ROUND_DURATION_MS - BETTING_CUTOFF_MS);

  tickInterval = setInterval(() => {
    if (!currentRound || currentRound.status !== "BETTING") {
      if (tickInterval) clearInterval(tickInterval);
      return;
    }
    currentRound.timeRemaining -= 1000;
    io?.emit("round:tick", {
      roundId: currentRound.roundId,
      timeRemaining: currentRound.timeRemaining,
    });
  }, 1000);
}

export function initGame(socketIo: Server) {
  io = socketIo;
  startNewRound();
}

export function getCurrentRound(): RoundState | null {
  return currentRound;
}

export function canPlaceBet(): boolean {
  if (!currentRound) return false;
  if (currentRound.status !== "BETTING") return false;
  if (currentRound.timeRemaining <= BETTING_CUTOFF_MS) return false;
  return true;
}

export { COLORS, SPECIAL_COLOR };