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
    <div className="bg-surface rounded-xl p-6 border border-border mt-4">
      <h3 className="mb-4">Your Bet History</h3>
      {bets.slice(0, 10).map((bet) => (
        <div key={bet.id} className="flex justify-between items-center py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span
              className="px-[0.6rem] py-[0.2rem] rounded text-white text-xs font-semibold"
              style={{ background: COLOR_HEX[bet.color] || "var(--color-text-dim)" }}
            >
              {bet.color}
            </span>
            <span className="text-[0.85rem]">
              ${bet.amount.toFixed(2)}
            </span>
          </div>
          <div className="font-semibold text-[0.85rem]">
            {bet.won === null ? "Pending" : bet.won
              ? <span className="text-green">+${(bet.payout || 0).toFixed(2)}</span>
              : <span className="text-red">-${bet.amount.toFixed(2)}</span>
            }
          </div>
        </div>
      ))}
    </div>
  );
}