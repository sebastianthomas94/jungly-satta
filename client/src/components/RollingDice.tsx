import { useState, useEffect } from "react";

interface RollingDiceProps {
  resultColor: string;
  onComplete: () => void;
}

const DICE_EMOJIS = ["\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"];

const colorHex: Record<string, string> = {
  red: "#e74c3c",
  green: "#2ecc71",
  blue: "#3498db",
};

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
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <div
        style={{
          fontSize: "5rem",
          animation: phase === "spinning" ? "spin 0.3s linear infinite" : "bounceIn 0.4s ease-out",
          filter: phase === "landing" ? `drop-shadow(0 0 20px ${colorHex[resultColor] || "#fff"})` : "none",
          transition: "filter 0.3s ease",
        }}
      >
        {emoji}
      </div>
      {phase === "landing" && (
        <div style={{
          marginTop: "1rem",
          fontSize: "1.2rem",
          fontWeight: 800,
          color: colorHex[resultColor] || "#fff",
          textTransform: "uppercase",
          animation: "fadeIn 0.3s ease-out",
          textShadow: `0 0 15px ${colorHex[resultColor] || "#fff"}50`,
        }}>
          {resultColor}
        </div>
      )}
      {phase === "spinning" && (
        <div style={{
          marginTop: "1rem",
          fontSize: "0.85rem",
          color: "var(--text-dim)",
          animation: "pulse 1s ease-in-out infinite",
        }}>
          Rolling...
        </div>
      )}
    </div>
  );
}