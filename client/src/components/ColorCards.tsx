import { COLORS, COLOR_HEX } from "../lib/constants";

interface ColorCardsProps {
  selectedColor: string | null;
  canBet: boolean;
  hasBet: boolean;
  onSelect: (color: string) => void;
}

export default function ColorCards({ selectedColor, canBet, hasBet, onSelect }: ColorCardsProps) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "1rem",
      marginBottom: "1.5rem",
    }}>
      {COLORS.map((color) => (
        <button
          key={color.id}
          onClick={() => !hasBet && canBet && onSelect(color.id)}
          disabled={hasBet || !canBet}
          style={{
            background: selectedColor === color.id ? COLOR_HEX[color.id] : "var(--surface2)",
            border: selectedColor === color.id ? `2px solid ${COLOR_HEX[color.id]}` : "2px solid var(--border)",
            borderRadius: "12px",
            padding: "1.5rem",
            textAlign: "center",
            opacity: hasBet || !canBet ? 0.5 : 1,
            transition: "all 0.2s ease",
            cursor: hasBet || !canBet ? "not-allowed" : "pointer",
          }}
        >
          <div style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            textTransform: "uppercase",
            color: selectedColor === color.id ? "#fff" : COLOR_HEX[color.id],
            marginBottom: "0.5rem",
          }}>
            {color.label}
          </div>
          <div style={{
            fontSize: "0.8rem",
            color: selectedColor === color.id ? "rgba(255,255,255,0.8)" : "var(--text-dim)",
          }}>
            {color.special ? "Special \u2B50" : "Regular"}
          </div>
          <div style={{
            fontSize: "1.2rem",
            fontWeight: 700,
            color: selectedColor === color.id ? "#fff" : "var(--gold)",
            marginTop: "0.5rem",
          }}>
            {color.payout}x
          </div>
        </button>
      ))}
    </div>
  );
}