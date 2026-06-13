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
    <div className="bg-surface rounded-xl p-6 border border-border">
      <h3 className="mb-4">Recent Results</h3>
      <div className="flex gap-2 flex-wrap">
        {rounds.slice(0, 15).map((round) => (
          <button
            key={round.id}
            onClick={() => onSelectRound(round.id, round.resultColor)}
            className="px-3 py-[0.3rem] rounded-md text-white text-[0.85rem] font-semibold border-none cursor-pointer opacity-90 transition-all duration-200 hover:opacity-100 hover:scale-110"
            style={{ background: COLOR_HEX[round.resultColor] || "var(--color-text-dim)" }}
            title={`Round #${round.id} - Click to see winners`}
          >
            #{round.id} {round.resultColor}
          </button>
        ))}
      </div>
      {selectedRound && (
        <div
          className="mt-4 bg-surface2 rounded-lg p-4"
          style={{ border: `1px solid ${COLOR_HEX[selectedRound.resultColor] || "var(--color-border)"}` }}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="text-[0.95rem] font-bold">
              Round #{selectedRound.roundId} Winners
            </div>
            <div className="flex items-center gap-2">
              <span
                className="px-[0.6rem] py-[0.2rem] rounded text-white text-xs font-bold uppercase"
                style={{ background: COLOR_HEX[selectedRound.resultColor] || "var(--color-text-dim)" }}
              >
                {selectedRound.resultColor}
              </span>
              <button
                onClick={onDeselectRound}
                className="bg-transparent border-none text-text-dim text-[1.1rem] cursor-pointer leading-none px-1"
              >
                &times;
              </button>
            </div>
          </div>
          {selectedRound.loading ? (
            <div className="text-center text-text-dim text-[0.85rem] p-2">
              Loading winners...
            </div>
          ) : selectedRound.winners.length === 0 ? (
            <div className="text-center text-text-dim text-[0.85rem] p-2">
              No winners this round
            </div>
          ) : (
            <div className="flex flex-col gap-[0.4rem]">
              {selectedRound.winners.map((w) => (
                <div key={w.userId} className="flex items-center gap-[0.6rem] py-[0.4rem] px-[0.5rem] bg-[rgba(34,29,20,0.6)] rounded-md">
                  {w.avatar ? (
                    <img src={w.avatar} alt={w.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[0.7rem] font-bold text-white"
                      style={{ background: COLOR_HEX[w.color] || "var(--color-surface2)" }}
                    >
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.8rem] font-semibold truncate">{w.name}</div>
                    <div className="text-[0.65rem] text-text-dim">
                      ${w.amount.toFixed(2)} on {w.color}
                    </div>
                  </div>
                  <div className="font-bold text-[0.85rem] text-green whitespace-nowrap">
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