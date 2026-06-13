import { QUICK_BET_AMOUNTS } from "../lib/constants";

interface BetFormProps {
  betAmount: string;
  canBet: boolean;
  selectedColor: string | null;
  placing: boolean;
  balance: number | undefined;
  onAmountChange: (amount: string) => void;
  onPlaceBet: () => void;
}

export default function BetForm({ betAmount, canBet, selectedColor, placing, onAmountChange, onPlaceBet }: BetFormProps) {
  const disabled = !canBet || !selectedColor || !betAmount || placing;

  return (
    <div className="bg-surface2/60 rounded-full p-2 border border-border flex items-center gap-2 max-md:flex-col max-md:rounded-3xl max-md:p-4 shadow-lg w-full mb-6">
      <div className="flex-1 flex items-center bg-bg/50 rounded-full px-6 py-4 max-md:w-full max-md:justify-between border border-white/5">
        <input
          type="number"
          min="1"
          step="0.01"
          value={betAmount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="Bet Amount"
          disabled={!canBet || !selectedColor}
          className="bg-transparent border-none outline-none text-text text-lg w-full placeholder-text-dim/50 font-medium disabled:opacity-50"
        />
        
        <div className="flex items-center gap-2 max-md:hidden shrink-0">
          {QUICK_BET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => onAmountChange(String(amt))}
              disabled={!canBet || !selectedColor}
              className="px-3 py-1.5 rounded-full bg-surface2 border border-white/10 text-text-dim text-sm font-medium hover:text-white hover:bg-surface transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ₹{amt}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile quick chips */}
      <div className="md:hidden flex items-center justify-between w-full gap-2">
        {QUICK_BET_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => onAmountChange(String(amt))}
            disabled={!canBet || !selectedColor}
            className="flex-1 py-2 rounded-full bg-surface2 border border-white/10 text-text-dim text-sm font-medium cursor-pointer disabled:opacity-50"
          >
            ₹{amt}
          </button>
        ))}
      </div>

      <button
        onClick={onPlaceBet}
        disabled={disabled}
        className="btn-gold rounded-full px-10 py-4 font-bold text-lg max-md:w-full tracking-wide shrink-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {placing ? "PLACING..." : "PLACE BET"}
      </button>
    </div>
  );
}