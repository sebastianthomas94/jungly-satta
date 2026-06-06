import { useState } from "react";
import type { WinnerInfo } from "../lib/socket";

interface WinnersListProps {
  winners: WinnerInfo[];
  resultColor: string;
}

const colorHex: Record<string, string> = {
  red: "#e74c3c",
  green: "#2ecc71",
  blue: "#3498db",
};

export default function WinnersList({ winners, resultColor }: WinnersListProps) {
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  if (winners.length === 0) {
    return (
      <div style={{
        background: "var(--surface)",
        borderRadius: "12px",
        padding: "1.5rem",
        border: "1px solid var(--border)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-dim)", marginBottom: "0.5rem" }}>
          Round Result
        </div>
        <div style={{
          display: "inline-block",
          background: colorHex[resultColor] || "var(--text-dim)",
          padding: "0.5rem 2rem",
          borderRadius: "8px",
          fontWeight: 800,
          color: "#fff",
          textTransform: "uppercase",
          fontSize: "1.3rem",
          letterSpacing: "0.05em",
        }}
          className="result-badge-enter"
        >
          {resultColor}
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginTop: "0.75rem" }}>
          No winners this round
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
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "0.75rem",
      }}>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--gold)" }}>
          Winners
        </div>
        <div style={{
          background: colorHex[resultColor] || "var(--text-dim)",
          padding: "0.25rem 0.75rem",
          borderRadius: "6px",
          fontWeight: 700,
          color: "#fff",
          textTransform: "uppercase",
          fontSize: "0.8rem",
        }}
          className="result-badge-enter"
        >
          {resultColor}
        </div>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxHeight: "280px",
        overflowY: "auto",
      }}>
        {winners
          .sort((a, b) => b.payout - a.payout)
          .map((winner, index) => {
            const isExpanded = expandedUserId === winner.userId;
            const delay = index * 0.08;

            return (
              <div
                key={winner.userId}
                className="winner-card-enter"
                style={{ animationDelay: `${delay}s` }}
                onClick={() => setExpandedUserId(isExpanded ? null : winner.userId)}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0.75rem",
                  background: isExpanded ? "var(--surface2)" : "rgba(26,35,64,0.6)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                  border: isExpanded ? `1px solid ${colorHex[winner.color] || "var(--border)"}` : "1px solid transparent",
                }}>
                  {winner.avatar ? (
                    <img
                      src={winner.avatar}
                      alt={winner.name}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `2px solid ${colorHex[winner.color] || "var(--border)"}`,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: colorHex[winner.color] || "var(--surface2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#fff",
                    }}>
                      {winner.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {isExpanded ? winner.name : winner.name.split(" ")[0]}
                    </div>
                    {isExpanded && (
                      <div style={{
                        fontSize: "0.75rem",
                        color: "var(--text-dim)",
                        marginTop: "0.15rem",
                        animation: "fadeIn 0.2s ease-out forwards",
                      }}>
                        Bet ${winner.amount.toFixed(2)} on {winner.color}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "var(--green)",
                    whiteSpace: "nowrap",
                  }}>
                    +${winner.payout.toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: "0.65rem",
                    color: "var(--text-dim)",
                    marginLeft: "-0.25rem",
                  }}>
                    &#9662;
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <div style={{
        fontSize: "0.7rem",
        color: "var(--text-dim)",
        marginTop: "0.5rem",
        textAlign: "center",
      }}>
        Tap a winner to see more details
      </div>
    </div>
  );
}