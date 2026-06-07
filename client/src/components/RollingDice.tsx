import { useState, useEffect } from "react";
import { COLOR_HEX } from "../lib/constants";

interface RollingDiceProps {
  resultColor: string;
  onComplete: () => void;
}

const DICE_EMOJIS = ["\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"];

export default function RollingDice({ resultColor, onComplete }: RollingDiceProps) {
  const [emoji, setEmoji] = useState(DICE_EMOJIS[0]);
  const [phase, setPhase] = useState<"spinning" | "landing">("spinning");

  useEffect(() => {
    let count = 0;
    const maxTicks = 12;
    const interval = setInterval(() => {
      count++;
      setEmoji(DICE_EMOJIS[Math.floor(Math.random() * DICE_EMOJIS.length)]);
      if (count >= maxTicks) {
        clearInterval(interval);
        setPhase("landing");
        setTimeout(onComplete, 800);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        className={phase === "spinning" ? "animate-spin" : "animate-bounce-in"}
        style={{
          fontSize: "5rem",
          filter: phase === "landing" ? `drop-shadow(0 0 20px ${COLOR_HEX[resultColor] || "#fff"})` : "none",
          transition: "filter 0.3s ease",
        }}
      >
        {emoji}
      </div>
      {phase === "landing" && (
        <div
          style={{
            marginTop: "1rem",
            fontSize: "1.2rem",
            fontWeight: 800,
            color: COLOR_HEX[resultColor] || "#fff",
            textTransform: "uppercase" as const,
            animation: "fadeIn 0.3s ease-out",
            textShadow: `0 0 15px ${COLOR_HEX[resultColor] || "#fff"}50`,
          }}
        >
          {resultColor}
        </div>
      )}
      {phase === "spinning" && (
        <div className="mt-4 text-[0.85rem] text-text-dim animate-pulse-anim">
          Rolling...
        </div>
      )}
    </div>
  );
}