import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface ResultOverlayProps {
  isWinner: boolean;
  resultColor: string;
  payout?: number;
  onDismiss: () => void;
}

const colorMap: Record<string, { main: string; glow: string }> = {
  red: { main: "#e74c3c", glow: "rgba(231,76,60,0.4)" },
  green: { main: "#2ecc71", glow: "rgba(46,204,113,0.4)" },
  blue: { main: "#3498db", glow: "rgba(52,152,219,0.4)" },
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
        colors: ["#f5c542", colorMap[resultColor]?.main || "#fff", "#fff"],
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
          colors: ["#f5c542", colorMap[resultColor]?.main || "#fff"],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#f5c542", colorMap[resultColor]?.main || "#fff"],
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isWinner, resultColor]);

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colors = colorMap[resultColor] || colorMap.red;

  return (
    <div
      className="overlay-enter"
      onClick={onDismiss}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: isWinner ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.75)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        cursor: "pointer",
      }}
    >
      {isWinner ? (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "4rem",
              fontWeight: 900,
              color: "var(--gold)",
              textShadow: `0 0 40px rgba(245,197,66,0.6)`,
              animation: "bounceIn 0.6s ease-out forwards",
            }}
          >
            YOU WON!
          </div>
          <div
            style={{
              fontSize: "1.8rem",
              color: colors.main,
              fontWeight: 700,
              marginTop: "0.5rem",
              textShadow: `0 0 20px ${colors.glow}`,
              animation: "fadeIn 0.5s ease-out 0.3s forwards",
              opacity: 0,
            }}
          >
            {resultColor.toUpperCase()} - {payout ? `$${payout.toFixed(2)}` : ""}
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              color: "var(--text-dim)",
              marginTop: "1.5rem",
              animation: "fadeIn 0.5s ease-out 0.6s forwards",
              opacity: 0,
            }}
          >
            Tap anywhere to continue
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "3rem",
              fontWeight: 800,
              color: "var(--text-dim)",
              animation: "fadeInScale 0.5s ease-out forwards",
            }}
          >
            Better luck next time
          </div>
          <div
            style={{
              fontSize: "1.4rem",
              color: colors.main,
              fontWeight: 700,
              marginTop: "0.75rem",
              animation: "fadeIn 0.5s ease-out 0.3s forwards",
              opacity: 0,
            }}
          >
            Result: {resultColor.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              color: "var(--text-dim)",
              marginTop: "1.5rem",
              animation: "fadeIn 0.5s ease-out 0.6s forwards",
              opacity: 0,
            }}
          >
            Tap anywhere to continue
          </div>
        </div>
      )}
    </div>
  );
}