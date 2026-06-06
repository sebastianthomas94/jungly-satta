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
      <div style={{
        background: "var(--surface)",
        borderRadius: "12px",
        padding: "1.5rem",
        border: "1px solid var(--border)",
      }}>
        <div style={{ textAlign: "center", color: "var(--text-dim)", fontSize: "0.9rem" }}>
          Loading leaderboard...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "12px",
      padding: "1rem",
      border: "1px solid var(--border)",
    }}>
      <div style={{
        fontSize: "1rem",
        fontWeight: 700,
        color: "var(--gold)",
        marginBottom: "0.75rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}>
        <span style={{ fontSize: "1.1rem" }}>&#127942;</span>
        Leaderboard
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-dim)", fontSize: "0.85rem", padding: "1rem" }}>
          No winners yet. Be the first!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="winner-card-enter"
              style={{
                animationDelay: `${index * 0.05}s`,
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.5rem 0.6rem",
                background: index < 3 ? "rgba(245,197,66,0.08)" : "rgba(26,35,64,0.4)",
                borderRadius: "8px",
                border: index < 3 ? "1px solid rgba(245,197,66,0.2)" : "1px solid transparent",
              }}
            >
              <div style={{
                width: "24px",
                fontSize: index < 3 ? "1rem" : "0.75rem",
                fontWeight: 700,
                color: index < 3 ? "var(--gold)" : "var(--text-dim)",
                textAlign: "center",
              }}>
                {index < 3 ? MEDALS[index] : `#${index + 1}`}
              </div>
              {entry.avatar ? (
                <img
                  src={entry.avatar}
                  alt={entry.name}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: index < 3 ? "2px solid var(--gold)" : "2px solid var(--border)",
                  }}
                />
              ) : (
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "var(--surface2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text)",
                }}>
                  {entry.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {entry.name}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                  {entry.wins} win{entry.wins !== 1 ? "s" : ""}
                </div>
              </div>
              <div style={{
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "var(--green)",
                whiteSpace: "nowrap",
              }}>
                ${entry.totalWinnings.toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}