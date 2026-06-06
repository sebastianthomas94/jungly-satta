import { COLOR_HEX } from "../lib/constants";

interface CurrentBetProps {
  color: string;
  amount: number;
}

export default function CurrentBet({ color, amount }: CurrentBetProps) {
  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "12px",
      padding: "1.5rem",
      border: "1px solid var(--border)",
      marginBottom: "1.5rem",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginBottom: "0.5rem" }}>
        Your bet this round
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
        <span style={{
          background: COLOR_HEX[color],
          padding: "0.4rem 1.5rem",
          borderRadius: "8px",
          fontWeight: 700,
          color: "#fff",
          textTransform: "uppercase",
        }}>
          {color}
        </span>
        <span style={{ fontSize: "1.3rem", fontWeight: 700 }}>
          ${amount.toFixed(2)}
        </span>
      </div>
    </div>
  );
}