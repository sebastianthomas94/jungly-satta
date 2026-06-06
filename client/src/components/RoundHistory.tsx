import { COLOR_HEX } from "../lib/constants";

interface RoundHistoryProps {
  rounds: Array<{ id: number; resultColor: string }>;
  selectedRound: { roundId: number; resultColor: string; winners: Array<{ userId: number; name: string; avatar: string; color: string; amount: number; payout: number }>; loading: boolean } | null;
  onSelectRound: (roundId: number, resultColor: string) => void;
  onDeselectRound: () => void;
}

export default function RoundHistory({ rounds, selectedRound, onSelectRound, onDeselectRound }: RoundHistoryProps) {
  if (rounds.length === 0) return null;

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "12px",
      padding: "1.5rem",
      border: "1px solid var(--border)",
    }}>
      <h3 style={{ marginBottom: "1rem" }}>Recent Results</h3>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {rounds.slice(0, 15).map((round) => (
          <button
            key={round.id}
            onClick={() => onSelectRound(round.id, round.resultColor)}
            style={{
              background: COLOR_HEX[round.resultColor] || "var(--text-dim)",
              padding: "0.3rem 0.8rem",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              opacity: 0.9,
              transition: "opacity 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title={`Round #${round.id} - Click to see winners`}
          >
            #{round.id} {round.resultColor}
          </button>
        ))}
      </div>
      {selectedRound && (
        <div style={{
          marginTop: "1rem",
          background: "var(--surface2)",
          borderRadius: "8px",
          padding: "1rem",
          border: `1px solid ${COLOR_HEX[selectedRound.resultColor] || "var(--border)"}`,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
          }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
              Round #{selectedRound.roundId} Winners
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{
                background: COLOR_HEX[selectedRound.resultColor] || "var(--text-dim)",
                padding: "0.2rem 0.6rem",
                borderRadius: "4px",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}>
                {selectedRound.resultColor}
              </span>
              <button
                onClick={onDeselectRound}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-dim)",
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: "0 0.25rem",
                }}
              >
                &times;
              </button>
            </div>
          </div>
          {selectedRound.loading ? (
            <div style={{ textAlign: "center", color: "var(--text-dim)", fontSize: "0.85rem", padding: "0.5rem" }}>
              Loading winners...
            </div>
          ) : selectedRound.winners.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-dim)", fontSize: "0.85rem", padding: "0.5rem" }}>
              No winners this round
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {selectedRound.winners.map((w) => (
                <div key={w.userId} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.4rem 0.5rem",
                  background: "rgba(26,35,64,0.6)",
                  borderRadius: "6px",
                }}>
                  {w.avatar ? (
                    <img src={w.avatar} alt={w.name} style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: "24px", height: "24px", borderRadius: "50%",
                      background: COLOR_HEX[w.color] || "var(--surface2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.7rem", fontWeight: 700, color: "#fff",
                    }}>
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {w.name}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>
                      ${w.amount.toFixed(2)} on {w.color}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--green)", whiteSpace: "nowrap" }}>
                    +${w.payout.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}