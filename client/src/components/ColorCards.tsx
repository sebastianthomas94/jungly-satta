import { COLORS } from "../lib/constants";

interface ColorCardsProps {
  selectedColor: string | null;
  canBet: boolean;
  hasBet: boolean;
  onSelect: (color: string) => void;
}

export default function ColorCards({ selectedColor, canBet, hasBet, onSelect }: ColorCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
      {COLORS.map((color) => {
        const isSelected = selectedColor === color.id;
        // Dynamically assign our new glassmorphism classes from index.css
        const buttonClass = 
          color.id === "red" ? "glass-button-red text-red" : 
          color.id === "green" ? "glass-button-green text-green" : 
          "glass-button-blue text-blue";
          
        return (
          <button
            key={color.id}
            onClick={() => !hasBet && canBet && onSelect(color.id)}
            disabled={hasBet || !canBet}
            className={`
              relative overflow-hidden rounded-2xl p-6 md:p-8 text-center transition-all duration-300
              ${buttonClass}
              ${isSelected ? "scale-105 ring-2 ring-white/50 z-10" : "scale-100"}
              ${!canBet || hasBet ? "opacity-40 cursor-not-allowed saturate-50" : "cursor-pointer hover:-translate-y-2"}
            `}
          >
            {/* Inner highlights for glass effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div
                className="font-black tracking-widest text-3xl md:text-4xl drop-shadow-lg mb-2 uppercase"
                style={{
                  color: isSelected ? "#fff" : "currentColor",
                  textShadow: isSelected ? "0 0 15px currentColor" : "none",
                }}
              >
                {color.label}
              </div>
              <div
                className="font-extrabold text-2xl"
                style={{
                  color: isSelected ? "#fff" : "rgba(255,255,255,0.7)",
                }}
              >
                {color.payout}x
              </div>
            </div>
            
            {/* Jewel/Gem background abstract decoration (simulated with CSS circles) */}
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-xl mix-blend-overlay"></div>
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/10 rounded-full blur-md mix-blend-overlay"></div>
          </button>
        );
      })}
    </div>
  );
}