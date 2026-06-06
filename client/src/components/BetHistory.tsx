import { COLOR_HEX } from "../lib/constants";

interface BetHistoryItem {
  id: number;
  color: string;
  amount: number;
  payout: number | null;
  won: boolean | null;
}

interface BetHistoryProps {
  bets: BetHistoryItem[];
}

export default function BetHistory({ bets }: BetHistoryProps) {
  if (bets.length === 0) return null;

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "12px",
      padding: "1.5rem",
      border: "1px solid var(--border)",
      marginTop: "1rem",
    }}>
      <h3 style={{ marginBottom: "1rem" }}>Your Bet History</h3>
      {bets.slice(0, 10).map((bet) => (
        <div key={bet.id} style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 0",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{
              background: COLOR_HEX[bet.color] || "var(--text-dim)",
              padding: "0.2rem 0.6rem",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}>
              {bet.color}
            </span>
            <span style={{ fontSize: "0.85rem" }}>
              ${bet.amount.toFixed(2)}
            </span>
          </div>
          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
            {bet.won === null ? "Pending" : bet.won
              ? <span style={{ color: "var(--green)" }}>+${(bet.payout || 0).toFixed(2)}</span>
              : <span style={{ color: "var(--red)" }}>-${bet.amount.toFixed(2)}</span>
            }
          </div>
        </div>
      ))}
    </div>
  );
}