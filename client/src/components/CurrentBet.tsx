import { COLOR_HEX } from "../lib/constants";

interface CurrentBetProps {
  color: string;
  amount: number;
}

export default function CurrentBet({ color, amount }: CurrentBetProps) {
  return (
    <div className="bg-surface rounded-xl p-6 border border-border mb-6 text-center">
      <div className="text-[0.85rem] text-text-dim mb-2">
        Your bet this round
      </div>
      <div className="flex justify-center items-center gap-4">
        <span
          className="px-6 py-[0.4rem] rounded-lg font-bold text-white uppercase"
          style={{ background: COLOR_HEX[color] }}
        >
          {color}
        </span>
        <span className="text-[1.3rem] font-bold">
          ${amount.toFixed(2)}
        </span>
      </div>
    </div>
  );
}