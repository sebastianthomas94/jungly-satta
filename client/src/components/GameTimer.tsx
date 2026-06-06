import type { RoundState } from "../lib/socket";
import RollingDice from "./RollingDice";

type GamePhase = "betting" | "closing" | "rolling" | "showing-result";

interface GameTimerProps {
  roundState: RoundState | null;
  phase: GamePhase;
  timeLeft: number;
  canBet: boolean;
  lastResult: { roundId: number; resultColor: string } | null;
  onRollingComplete: () => void;
}

export default function GameTimer({ roundState, phase, timeLeft, canBet, lastResult, onRollingComplete }: GameTimerProps) {
  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "12px",
      padding: "1.5rem",
      border: "1px solid var(--border)",
      marginBottom: "1.5rem",
      textAlign: "center",
      overflow: "hidden",
    }}>
      {phase === "rolling" && lastResult ? (
        <RollingDice
          resultColor={lastResult.resultColor}
          onComplete={onRollingComplete}
        />
      ) : phase === "rolling" ? (
        <div style={{ padding: "2rem" }}>
          <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--gold)" }}>
            &#127922;
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
            Rolling...
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginBottom: "0.5rem" }}>
            {phase === "closing" ? "No more bets!" : canBet ? "Place your bets!" : "Waiting..."}
          </div>
          <div style={{
            fontSize: "3rem",
            fontWeight: 800,
            color: phase === "closing" ? "var(--red)" : canBet ? "var(--green)" : "var(--text-dim)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {phase === "closing" ? `${timeLeft}s` : canBet ? `${timeLeft}s` : "--"}
          </div>
          {roundState?.roundId && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
              Round #{roundState.roundId}
            </div>
          )}
        </>
      )}
    </div>
  );
}