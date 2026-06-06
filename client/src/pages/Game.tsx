import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

const COLORS = [
  { id: "red", label: "Red", bg: "var(--red", special: true, payout: 3 },
  { id: "green", label: "Green", bg: "var(--green)", special: false, payout: 2 },
  { id: "blue", label: "Blue", bg: "var(--blue)", special: false, payout: 2 },
] as const;

const DICE_FACES: Record<string, string> = {
  red: "\uD83C\uDFB2",
  green: "\uD83C\uDFB3",
  blue: "\uD83C\uDFB4",
};

export default function Game() {
  const { user, roundState, lastResult, refreshBalance } = useAuth();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [currentBet, setCurrentBet] = useState<any>(null);
  const [betHistory, setBetHistory] = useState<any[]>([]);
  const [roundHistory, setRoundHistory] = useState<any[]>([]);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (user) {
      loadCurrentBet();
      loadHistory();
    }
  }, [user]);

  useEffect(() => {
    if (user && lastResult) {
      loadCurrentBet();
      loadHistory();
      checkResult();
    }
  }, [lastResult]);

  const loadCurrentBet = async () => {
    try {
      const data = await api.bets.currentRoundBet();
      setCurrentBet(data.bet);
      if (data.bet) setSelectedColor(data.bet.color);
    } catch {}
  };

  const loadHistory = async () => {
    try {
      const [bets, rounds] = await Promise.all([
        api.bets.history(),
        api.game.history(),
      ]);
      setBetHistory(bets);
      setRoundHistory(rounds);
    } catch {}
  };

  const checkResult = async () => {
    if (!currentBet || !lastResult) return;
    if (currentBet.color === lastResult.resultColor) {
      const payout = currentBet.amount * (currentBet.color === "red" ? 3 : 2);
      setMessage({ type: "success", text: `You won! Payout: $${payout.toFixed(2)}` });
    } else {
      setMessage({ type: "error", text: "Better luck next time!" });
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedColor || !betAmount) return;
    setPlacing(true);
    setMessage(null);
    try {
      const data = await api.bets.place(selectedColor, parseFloat(betAmount));
      setMessage({ type: "info", text: `Bet placed: $${parseFloat(betAmount).toFixed(2)} on ${selectedColor}` });
      setCurrentBet(data);
      await refreshBalance();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
    setPlacing(false);
  };

  const canBet = roundState?.status === "BETTING" && roundState.timeRemaining > 5000;
  const timeLeft = roundState ? Math.max(0, Math.ceil(roundState.timeRemaining / 1000)) : 0;
  const isRolling = roundState?.status === "ROLLING";

  const colorHex: Record<string, string> = {
    red: "#e74c3c",
    green: "#2ecc71",
    blue: "#3498db",
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Welcome to Jungly Satta</h2>
        <p style={{ color: "var(--text-dim)", marginBottom: "2rem" }}>
          Please login to start playing
        </p>
        <a href="/login" style={{
          display: "inline-block", padding: "0.75rem 2rem", background: "var(--blue)",
          borderRadius: "8px", color: "#fff", fontWeight: 600
        }}>
          Login
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1rem" }}>
      {/* Timer & Status */}
      <div style={{
        background: "var(--surface)", borderRadius: "12px", padding: "1.5rem",
        border: "1px solid var(--border)", marginBottom: "1.5rem", textAlign: "center"
      }}>
        <div style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginBottom: "0.5rem" }}>
          {isRolling ? "Rolling..." : canBet ? "Place your bets!" : "Round ending..."}
        </div>
        <div style={{
          fontSize: "3rem", fontWeight: 800,
          color: isRolling ? "var(--gold)" : canBet ? "var(--green)" : "var(--red)",
          fontVariantNumeric: "tabular-nums"
        }}>
          {isRolling ? "\uD83C\uDFB2" : `${timeLeft}s`}
        </div>
        {roundState?.roundId && (
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
            Round #{roundState.roundId}
          </div>
        )}
      </div>

      {/* Last Result */}
      {lastResult && (
        <div style={{
          background: "var(--surface)", borderRadius: "12px", padding: "1rem",
          border: "1px solid var(--border)", marginBottom: "1.5rem",
          display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem"
        }}>
          <span style={{ color: "var(--text-dim)" }}>Last result:</span>
          <span style={{
            background: colorHex[lastResult.resultColor] || "var(--text-dim)",
            padding: "0.4rem 1.5rem", borderRadius: "8px", fontWeight: 700,
            color: "#fff", textTransform: "uppercase", fontSize: "1.1rem"
          }}>
            {lastResult.resultColor}
          </span>
          <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
            ({lastResult.resultColor === "red" ? "3x" : "2x"} payout)
          </span>
        </div>
      )}

      {/* Message */}
      {message && (
        <div style={{
          background: message.type === "success" ? "rgba(46,204,113,0.15)" :
            message.type === "error" ? "rgba(231,76,60,0.15)" : "rgba(52,152,219,0.15)",
          color: message.type === "success" ? "var(--green)" :
            message.type === "error" ? "var(--red)" : "var(--blue)",
          padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", textAlign: "center",
          fontSize: "0.95rem", fontWeight: 600
        }}>
          {message.text}
        </div>
      )}

      {/* Color Betting Cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem",
        marginBottom: "1.5rem"
      }}>
        {COLORS.map((color) => (
          <button
            key={color.id}
            onClick={() => !currentBet && canBet && setSelectedColor(color.id)}
            disabled={!!currentBet || !canBet}
            style={{
              background: selectedColor === color.id ? colorHex[color.id] : "var(--surface2)",
              border: selectedColor === color.id ? `2px solid ${colorHex[color.id]}` : "2px solid var(--border)",
              borderRadius: "12px", padding: "1.5rem", textAlign: "center",
              opacity: currentBet || !canBet ? 0.5 : 1,
              transition: "all 0.2s ease", cursor: currentBet || !canBet ? "not-allowed" : "pointer",
            }}
          >
            <div style={{
              fontSize: "1.5rem", fontWeight: 800, textTransform: "uppercase",
              color: selectedColor === color.id ? "#fff" : colorHex[color.id],
              marginBottom: "0.5rem"
            }}>
              {color.label}
            </div>
            <div style={{
              fontSize: "0.8rem", color: selectedColor === color.id ? "rgba(255,255,255,0.8)" : "var(--text-dim)"
            }}>
              {color.special ? "Special \u2B50" : "Regular"}
            </div>
            <div style={{
              fontSize: "1.2rem", fontWeight: 700,
              color: selectedColor === color.id ? "#fff" : "var(--gold)",
              marginTop: "0.5rem"
            }}>
              {color.payout}x
            </div>
          </button>
        ))}
      </div>

      {/* Bet Amount Input */}
      {!currentBet && (
        <div style={{
          background: "var(--surface)", borderRadius: "12px", padding: "1.5rem",
          border: "1px solid var(--border)", marginBottom: "1.5rem"
        }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <input
              type="number" min="1" step="0.01"
              value={betAmount} onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Bet amount"
              disabled={!canBet || !selectedColor}
              style={{
                flex: 1, padding: "0.7rem", background: "var(--surface2)",
                border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)",
                fontSize: "1rem", outline: "none"
              }}
            />
            <button
              onClick={handlePlaceBet}
              disabled={!canBet || !selectedColor || !betAmount || placing}
              style={{
                padding: "0.7rem 1.5rem", background: "var(--gold)",
                border: "none", borderRadius: "8px", color: "#000", fontSize: "1rem",
                fontWeight: 700, opacity: (!canBet || !selectedColor || !betAmount) ? 0.4 : 1,
              }}
            >
              {placing ? "..." : "Bet!"}
            </button>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[5, 10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(String(amt))}
                style={{
                  flex: 1, padding: "0.4rem", background: "var(--surface2)",
                  border: "1px solid var(--border)", borderRadius: "6px",
                  color: "var(--text)", fontSize: "0.85rem", cursor: "pointer"
                }}
              >
                ${amt}
              </button>
            ))}
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-dim)" }}>
            Balance: ${user?.balance?.toFixed(2)}
          </div>
        </div>
      )}

      {/* Current Bet */}
      {currentBet && (
        <div style={{
          background: "var(--surface)", borderRadius: "12px", padding: "1.5rem",
          border: "1px solid var(--border)", marginBottom: "1.5rem", textAlign: "center"
        }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginBottom: "0.5rem" }}>
            Your bet this round
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
            <span style={{
              background: colorHex[currentBet.color],
              padding: "0.4rem 1.5rem", borderRadius: "8px",
              fontWeight: 700, color: "#fff", textTransform: "uppercase"
            }}>
              {currentBet.color}
            </span>
            <span style={{ fontSize: "1.3rem", fontWeight: 700 }}>${currentBet.amount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Round History */}
      {roundHistory.length > 0 && (
        <div style={{
          background: "var(--surface)", borderRadius: "12px", padding: "1.5rem",
          border: "1px solid var(--border)"
        }}>
          <h3 style={{ marginBottom: "1rem" }}>Recent Results</h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {roundHistory.slice(0, 15).map((round: any) => (
              <span key={round.id} style={{
                background: colorHex[round.resultColor] || "var(--text-dim)",
                padding: "0.3rem 0.8rem", borderRadius: "6px",
                color: "#fff", fontSize: "0.85rem", fontWeight: 600
              }}>
                {round.resultColor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bet History */}
      {betHistory.length > 0 && (
        <div style={{
          background: "var(--surface)", borderRadius: "12px", padding: "1.5rem",
          border: "1px solid var(--border)", marginTop: "1rem"
        }}>
          <h3 style={{ marginBottom: "1rem" }}>Your Bet History</h3>
          {betHistory.slice(0, 10).map((bet: any) => (
            <div key={bet.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.5rem 0", borderBottom: "1px solid var(--border)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{
                  background: colorHex[bet.color] || "var(--text-dim)",
                  padding: "0.2rem 0.6rem", borderRadius: "4px",
                  color: "#fff", fontSize: "0.75rem", fontWeight: 600
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
      )}
    </div>
  );
}