import { COLOR_HEX, PAYOUT_MULTIPLIER } from "../lib/constants";

interface LastResultBarProps {
  resultColor: string;
}

export default function LastResultBar({ resultColor }: LastResultBarProps) {
  return (
    <div className="bg-surface rounded-xl p-4 border border-border mb-6 flex justify-center items-center gap-4 flex-wrap max-[767px]:flex-wrap max-[767px]:gap-2">
      <span className="text-text-dim">Last result:</span>
      <span
        className="px-4 py-[0.4rem] rounded-lg font-bold text-white uppercase text-lg"
        style={{ background: COLOR_HEX[resultColor] || "var(--color-text-dim)" }}
      >
        {resultColor}
      </span>
      <span className="text-text-dim text-[0.85rem]">
        ({PAYOUT_MULTIPLIER[resultColor] || 2}x payout)
      </span>
    </div>
  );
}