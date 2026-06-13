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

export default function GameTimer({ roundState, phase, timeLeft, lastResult, onRollingComplete }: GameTimerProps) {
  const progress = Math.max(0, Math.min(100, (timeLeft / 30) * 100));
  const circleRadius = 70;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-8 relative min-h-[250px]">
      {/* Background decorations for the jungle/gold theme */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent opacity-50 blur-xl pointer-events-none"></div>

      {phase === "rolling" && lastResult ? (
        <RollingDice
          resultColor={lastResult.resultColor}
          onComplete={onRollingComplete}
        />
      ) : phase === "rolling" ? (
        <div className="flex flex-col items-center justify-center animate-pulse">
          <div className="text-5xl font-bold text-gold drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
            🎲
          </div>
          <div className="text-gold mt-4 font-semibold tracking-wider">ROLLING...</div>
        </div>
      ) : (
        <div className="relative flex items-center justify-center">
          {/* Outer glow circles */}
          <div className="absolute inset-0 rounded-full border border-gold/20 scale-125 animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute inset-0 rounded-full border border-gold/10 scale-150 animate-[spin_15s_linear_infinite_reverse]"></div>

          <svg className="w-48 h-48 transform -rotate-90 drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r={circleRadius}
              className="stroke-gold/20"
              strokeWidth="8"
              fill="rgba(34, 29, 20, 0.6)"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r={circleRadius}
              className={`transition-all duration-1000 ease-linear ${phase === "closing" ? "stroke-red" : "stroke-gold"}`}
              strokeWidth="8"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ filter: `drop-shadow(0 0 8px ${phase === "closing" ? "rgba(230,57,70,0.8)" : "rgba(255,215,0,0.8)"})` }}
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span 
              className={`text-5xl font-extrabold tracking-tighter ${phase === "closing" ? "text-red animate-pulse" : "text-gold"}`}
              style={{ textShadow: `0 0 20px ${phase === "closing" ? "rgba(230,57,70,0.5)" : "rgba(255,215,0,0.5)"}` }}
            >
              {timeLeft}
            </span>
            <span className="text-gold-dim text-sm font-medium mt-1">30s</span>
          </div>
        </div>
      )}
      
      {roundState?.roundId && (
        <div className="mt-8 text-xs font-semibold tracking-widest text-gold-dim uppercase opacity-70">
          Round #{roundState.roundId}
        </div>
      )}
    </div>
  );
}