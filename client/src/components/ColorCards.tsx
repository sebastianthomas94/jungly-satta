import { COLORS, COLOR_HEX } from "../lib/constants";

interface ColorCardsProps {
  selectedColor: string | null;
  canBet: boolean;
  hasBet: boolean;
  onSelect: (color: string) => void;
}

export default function ColorCards({ selectedColor, canBet, hasBet, onSelect }: ColorCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {COLORS.map((color) => (
        <button
          key={color.id}
          onClick={() => !hasBet && canBet && onSelect(color.id)}
          disabled={hasBet || !canBet}
          className="rounded-xl p-6 text-center transition-all duration-200 max-[767px]:p-4 max-[400px]:p-3"
          style={{
            background: selectedColor === color.id ? COLOR_HEX[color.id] : "var(--color-surface2)",
            border: selectedColor === color.id ? `2px solid ${COLOR_HEX[color.id]}` : "2px solid var(--color-border)",
            opacity: hasBet || !canBet ? 0.5 : 1,
            cursor: hasBet || !canBet ? "not-allowed" : "pointer",
          }}
        >
          <div
            className="font-extrabold uppercase mb-2 max-[767px]:text-xl max-[400px]:text-base"
            style={{
              fontSize: "1.5rem",
              color: selectedColor === color.id ? "#fff" : COLOR_HEX[color.id],
            }}
          >
            {color.label}
          </div>
          <div
            className="text-[0.8rem]"
            style={{
              color: selectedColor === color.id ? "rgba(255,255,255,0.8)" : "var(--color-text-dim)",
            }}
          >
            {color.special ? "Special \u2B50" : "Regular"}
          </div>
          <div
            className="font-bold mt-2 max-[767px]:text-lg max-[400px]:text-base"
            style={{
              fontSize: "1.2rem",
              color: selectedColor === color.id ? "#fff" : "var(--color-gold)",
            }}
          >
            {color.payout}x
          </div>
        </button>
      ))}
    </div>
  );
}