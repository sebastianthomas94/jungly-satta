import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

interface LeaderboardEntry {
  id: number;
  name: string;
  avatar: string;
  totalWinnings: number;
  wins: number;
}

const MEDALS = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await api.game.leaderboard();
      const normalized = data.map((entry: LeaderboardEntry) => ({
        ...entry,
        totalWinnings: Number(entry.totalWinnings),
        wins: Number(entry.wins),
      }));
      setEntries(normalized);
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 15000);
    return () => clearInterval(interval);
  }, [loadLeaderboard]);

  if (loading) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-border">
        <div className="text-center text-text-dim text-[0.9rem]">
          Loading leaderboard...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-4 border border-border">
      <div className="text-base font-bold text-gold mb-3 flex items-center gap-2">
        <span className="text-[1.1rem]">&#127942;</span>
        Leaderboard
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-text-dim text-[0.85rem] p-4">
          No winners yet. Be the first!
        </div>
      ) : (
        <div className="flex flex-col gap-[0.4rem]">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="animate-slide-in-right flex items-center gap-[0.65rem] py-2 px-[0.6rem] rounded-lg"
              style={{
                animationDelay: `${index * 0.05}s`,
                background: index < 3 ? "rgba(245,197,66,0.08)" : "rgba(26,35,64,0.4)",
                border: index < 3 ? "1px solid rgba(245,197,66,0.2)" : "1px solid transparent",
              }}
            >
              <div
                className="w-6 text-center font-bold"
                style={{
                  fontSize: index < 3 ? "1rem" : "0.75rem",
                  color: index < 3 ? "var(--color-gold)" : "var(--color-text-dim)",
                }}
              >
                {index < 3 ? MEDALS[index] : `#${index + 1}`}
              </div>
              {entry.avatar ? (
                <img
                  src={entry.avatar}
                  alt={entry.name}
                  className="w-7 h-7 rounded-full object-cover"
                  style={{ border: index < 3 ? "2px solid var(--color-gold)" : "2px solid var(--color-border)" }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-surface2 flex items-center justify-center text-[0.75rem] font-bold text-text">
                  {entry.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[0.8rem] font-semibold truncate">{entry.name}</div>
                <div className="text-[0.7rem] text-text-dim">
                  {entry.wins} win{entry.wins !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="font-bold text-[0.85rem] text-green whitespace-nowrap">
                ${entry.totalWinnings.toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}