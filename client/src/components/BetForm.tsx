import { QUICK_BET_AMOUNTS } from "../lib/constants";

interface BetFormProps {
  betAmount: string;
  canBet: boolean;
  selectedColor: string | null;
  placing: boolean;
  balance: number | undefined;
  onAmountChange: (amount: string) => void;
  onPlaceBet: () => void;
}

export default function BetForm({ betAmount, canBet, selectedColor, placing, balance, onAmountChange, onPlaceBet }: BetFormProps) {
  const disabled = !canBet || !selectedColor || !betAmount || placing;

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "12px",
      padding: "1.5rem",
      border: "1px solid var(--border)",
      marginBottom: "1.5rem",
    }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
        <input
          type="number"
          min="1"
          step="0.01"
          value={betAmount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="Bet amount"
          disabled={!canBet || !selectedColor}
          style={{
            flex: 1,
            padding: "0.7rem",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text)",
            fontSize: "1rem",
            outline: "none",
          }}
        />
        <button
          onClick={onPlaceBet}
          disabled={disabled}
          style={{
            padding: "0.7rem 1.5rem",
            background: "var(--gold)",
            border: "none",
            borderRadius: "8px",
            color: "#000",
            fontSize: "1rem",
            fontWeight: 700,
            opacity: disabled ? 0.4 : 1,
          }}
        >
          {placing ? "..." : "Bet!"}
        </button>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {QUICK_BET_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => onAmountChange(String(amt))}
            style={{
              flex: 1,
              padding: "0.4rem",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--text)",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            ${amt}
          </button>
        ))}
      </div>
      <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-dim)" }}>
        Balance: ${balance?.toFixed(2)}
      </div>
    </div>
  );
}