import { useState } from "react";
import { COLOR_HEX } from "../lib/constants";
import type { WinnerInfo } from "../lib/socket";

interface WinnersListProps {
  winners: WinnerInfo[];
  resultColor: string;
}

export default function WinnersList({ winners, resultColor }: WinnersListProps) {
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  if (winners.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-border text-center">
        <div className="text-lg font-bold text-text-dim mb-2">
          Round Result
        </div>
        <div
          className="inline-block px-8 py-2 rounded-lg font-extrabold text-white uppercase text-[1.3rem] tracking-wide animate-bounce-in"
          style={{ background: COLOR_HEX[resultColor] || "var(--color-text-dim)" }}
        >
          {resultColor}
        </div>
        <div className="text-[0.85rem] text-text-dim mt-3">
          No winners this round
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="text-base font-bold text-gold">
          Winners
        </div>
        <div
          className="px-3 py-1 rounded-md font-bold text-white uppercase text-[0.8rem] animate-bounce-in"
          style={{ background: COLOR_HEX[resultColor] || "var(--color-text-dim)" }}
        >
          {resultColor}
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto">
        {winners
          .sort((a, b) => b.payout - a.payout)
          .map((winner, index) => {
            const isExpanded = expandedUserId === winner.userId;

            return (
              <div
                key={winner.userId}
                className="animate-slide-in-right"
                style={{ animationDelay: `${index * 0.08}s` }}
                onClick={() => setExpandedUserId(isExpanded ? null : winner.userId)}
              >
                <div
                  className="flex items-center gap-3 py-[0.6rem] px-3 rounded-lg cursor-pointer transition-colors duration-200"
                  style={{
                    background: isExpanded ? "var(--color-surface2)" : "rgba(26,35,64,0.6)",
                    border: isExpanded ? `1px solid ${COLOR_HEX[winner.color] || "var(--color-border)"}` : "1px solid transparent",
                  }}
                >
                  {winner.avatar ? (
                    <img
                      src={winner.avatar}
                      alt={winner.name}
                      className="w-8 h-8 rounded-full object-cover"
                      style={{ border: `2px solid ${COLOR_HEX[winner.color] || "var(--color-border)"}` }}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[0.85rem] font-bold text-white"
                      style={{ background: COLOR_HEX[winner.color] || "var(--color-surface2)" }}
                    >
                      {winner.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.85rem] font-semibold truncate">
                      {isExpanded ? winner.name : winner.name.split(" ")[0]}
                    </div>
                    {isExpanded && (
                      <div
                        className="text-xs text-text-dim mt-[0.15rem]"
                        style={{ animation: "fadeIn 0.2s ease-out forwards" }}
                      >
                        Bet ${winner.amount.toFixed(2)} on {winner.color}
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-[0.9rem] text-green whitespace-nowrap">
                    +${winner.payout.toFixed(2)}
                  </div>
                  <div className="text-[0.65rem] text-text-dim -ml-1">
                    &#9662;
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <div className="text-[0.7rem] text-text-dim mt-2 text-center">
        Tap a winner to see more details
      </div>
    </div>
  );
}