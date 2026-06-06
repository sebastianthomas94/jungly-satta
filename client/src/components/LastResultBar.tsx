import { COLOR_HEX, PAYOUT_MULTIPLIER } from "../lib/constants";

interface LastResultBarProps {
  resultColor: string;
}

export default function LastResultBar({ resultColor }: LastResultBarProps) {
  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "12px",
      padding: "1rem",
      border: "1px solid var(--border)",
      marginBottom: "1.5rem",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "1rem",
    }}>
      <span style={{ color: "var(--text-dim)" }}>Last result:</span>
      <span style={{
        background: COLOR_HEX[resultColor] || "var(--text-dim)",
        padding: "0.4rem 1.5rem",
        borderRadius: "8px",
        fontWeight: 700,
        color: "#fff",
        textTransform: "uppercase",
        fontSize: "1.1rem",
      }}>
        {resultColor}
      </span>
      <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
        ({PAYOUT_MULTIPLIER[resultColor] || 2}x payout)
      </span>
    </div>
  );
}