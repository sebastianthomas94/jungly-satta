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
    <div className="bg-surface rounded-xl p-6 border border-border mb-6 text-center overflow-hidden">
      {phase === "rolling" && lastResult ? (
        <RollingDice
          resultColor={lastResult.resultColor}
          onComplete={onRollingComplete}
        />
      ) : phase === "rolling" ? (
        <div className="p-8">
          <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--color-gold)" }}>
            &#127922;
          </div>
          <div className="text-sm text-text-dim mt-2">
            Rolling...
          </div>
        </div>
      ) : (
        <>
          <div className="text-[0.85rem] text-text-dim mb-2">
            {phase === "closing" ? "No more bets!" : canBet ? "Place your bets!" : "Waiting..."}
          </div>
          <div
            className="font-extrabold tabular-nums max-[767px]:text-[2.5rem] max-[400px]:text-3xl"
            style={{
              fontSize: "3rem",
              color: phase === "closing" ? "var(--color-red)" : canBet ? "var(--color-green)" : "var(--color-text-dim)",
            }}
          >
            {phase === "closing" ? `${timeLeft}s` : canBet ? `${timeLeft}s` : "--"}
          </div>
          {roundState?.roundId && (
            <div className="text-[0.75rem] text-text-dim mt-2">
              Round #{roundState.roundId}
            </div>
          )}
        </>
      )}
    </div>
  );
}