import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { COLOR_HEX } from "../lib/constants";

interface ResultOverlayProps {
  isWinner: boolean;
  resultColor: string;
  payout?: number;
  onDismiss: () => void;
}

const COLOR_GLOW: Record<string, string> = {
  red: "rgba(230,57,70,0.4)",
  green: "rgba(0,230,118,0.4)",
  blue: "rgba(0,180,216,0.4)",
};

export default function ResultOverlay({ isWinner, resultColor, payout, onDismiss }: ResultOverlayProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (isWinner && !fired.current) {
      fired.current = true;
      const duration = 3000;
      const end = Date.now() + duration;

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFD700", COLOR_HEX[resultColor] || "#fff", "#fff"],
      });

      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#FFD700", COLOR_HEX[resultColor] || "#fff"],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#FFD700", COLOR_HEX[resultColor] || "#fff"],
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isWinner, resultColor]);

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const mainColor = COLOR_HEX[resultColor] || COLOR_HEX.red;
  const glowColor = COLOR_GLOW[resultColor] || COLOR_GLOW.red;

  return (
    <div
      className="animate-fade-in fixed inset-0 flex flex-col items-center justify-center z-[1000] cursor-pointer"
      onClick={onDismiss}
      style={{ background: isWinner ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.75)" }}
    >
      {isWinner ? (
        <div className="text-center">
          <div
            className="max-[767px]:text-[2.5rem]"
            style={{
              fontSize: "4rem",
              fontWeight: 900,
              color: "var(--color-gold)",
              textShadow: "0 0 40px rgba(255,215,0,0.6)",
              animation: "bounceIn 0.6s ease-out forwards",
            }}
          >
            YOU WON!
          </div>
          <div
            className="max-[767px]:text-[1.2rem]"
            style={{
              fontSize: "1.8rem",
              color: mainColor,
              fontWeight: 700,
              marginTop: "0.5rem",
              textShadow: `0 0 20px ${glowColor}`,
              animation: "fadeIn 0.5s ease-out 0.3s forwards",
              opacity: 0,
            }}
          >
            {resultColor.toUpperCase()} - {payout ? `$${payout.toFixed(2)}` : ""}
          </div>
          <div
            className="text-[0.9rem] text-text-dim mt-6"
            style={{ animation: "fadeIn 0.5s ease-out 0.6s forwards", opacity: 0 }}
          >
            Tap anywhere to continue
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div
            className="max-[767px]:text-[2.5rem]"
            style={{
              fontSize: "3rem",
              fontWeight: 800,
              color: "var(--color-text-dim)",
              animation: "fadeInScale 0.5s ease-out forwards",
            }}
          >
            Better luck next time
          </div>
          <div
            className="max-[767px]:text-[1.2rem]"
            style={{
              fontSize: "1.4rem",
              color: mainColor,
              fontWeight: 700,
              marginTop: "0.75rem",
              animation: "fadeIn 0.5s ease-out 0.3s forwards",
              opacity: 0,
            }}
          >
            Result: {resultColor.toUpperCase()}
          </div>
          <div
            className="text-[0.9rem] text-text-dim mt-6"
            style={{ animation: "fadeIn 0.5s ease-out 0.6s forwards", opacity: 0 }}
          >
            Tap anywhere to continue
          </div>
        </div>
      )}
    </div>
  );
}