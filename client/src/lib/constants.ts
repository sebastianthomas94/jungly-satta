export const COLORS = [
  { id: "red" as const, label: "Red", special: true, payout: 3 },
  { id: "green" as const, label: "Green", special: false, payout: 2 },
  { id: "blue" as const, label: "Blue", special: false, payout: 2 },
];

export type ColorId = (typeof COLORS)[number]["id"];

export const COLOR_HEX: Record<string, string> = {
  red: "#E63946",
  green: "#00E676",
  blue: "#00B4D8",
};

export const PAYOUT_MULTIPLIER: Record<string, number> = {
  red: 3,
  green: 2,
  blue: 2,
};

export const QUICK_BET_AMOUNTS = [5, 10, 25, 50, 100];