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

export default function BetForm({ betAmount, canBet, selectedColor, placing, balance, onAmountChange, onPlaceBet }: BetFormProps) {
  const disabled = !canBet || !selectedColor || !betAmount || placing;

  return (
    <div className="bg-surface rounded-xl p-6 border border-border mb-6">
      <div className="flex gap-3 items-center mb-3 max-[767px]:flex-col">
        <input
          type="number"
          min="1"
          step="0.01"
          value={betAmount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="Bet amount"
          disabled={!canBet || !selectedColor}
          className="flex-1 p-[0.7rem] bg-surface2 border border-border rounded-lg text-text text-base outline-none"
        />
        <button
          onClick={onPlaceBet}
          disabled={disabled}
          className="p-[0.7rem] px-6 bg-gold border-none rounded-lg text-black text-base font-bold max-[767px]:w-full"
          style={{ opacity: disabled ? 0.4 : 1 }}
        >
          {placing ? "..." : "Bet!"}
        </button>
      </div>
      <div className="flex gap-2 max-[767px]:flex-wrap">
        {QUICK_BET_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => onAmountChange(String(amt))}
            className="flex-1 py-[0.4rem] bg-surface2 border border-border rounded-md text-text text-[0.85rem] cursor-pointer"
          >
            ${amt}
          </button>
        ))}
      </div>
      <div className="mt-2 text-[0.8rem] text-text-dim">
        Balance: ${balance?.toFixed(2)}
      </div>
    </div>
  );
}