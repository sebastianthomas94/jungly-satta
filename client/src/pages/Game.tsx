import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../lib/auth";
import { useGame } from "../lib/gameContext";
import { api } from "../lib/api";
import { PAYOUT_MULTIPLIER } from "../lib/constants";
import WinnersList from "../components/WinnersList";
import ResultOverlay from "../components/ResultOverlay";
import GameTimer from "../components/GameTimer";
import ColorCards from "../components/ColorCards";
import BetForm from "../components/BetForm";
import CurrentBet from "../components/CurrentBet";
import RoundHistory from "../components/RoundHistory";
import BetHistory from "../components/BetHistory";
import LastResultBar from "../components/LastResultBar";
import MessageBanner from "../components/MessageBanner";
import ReelsViewer from "../components/ReelsViewer";
import type { WinnerInfo } from "../lib/socket";

interface BetData {
  betId: number;
  roundId: number;
  color: string;
  amount: number;
  timeRemaining: number;
}

interface BetHistoryItem {
  id: number;
  color: string;
  amount: number;
  payout: number | null;
  won: boolean | null;
}

interface RoundHistoryItem {
  id: number;
  resultColor: string;
}

type GamePhase = "betting" | "closing" | "rolling" | "showing-result";

export default function Game() {
  const { user } = useAuth();
  const { roundState, lastResult, roundWinners, refreshBalance } = useGame();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [currentBet, setCurrentBet] = useState<BetData | null>(null);
  const [betHistory, setBetHistory] = useState<BetHistoryItem[]>([]);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryItem[]>([]);
  const [placing, setPlacing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedRound, setSelectedRound] = useState<{
    roundId: number;
    resultColor: string;
    winners: WinnerInfo[];
    loading: boolean;
  } | null>(null);
  const [diceComplete, setDiceComplete] = useState(false);
  const [prevRoundId, setPrevRoundId] = useState<number | null>(null);

  const phase: GamePhase = useMemo(() => {
    if (!roundState) return "betting";
    if (roundState.status === "ROLLING" && !diceComplete) return "rolling";
    if (roundState.status === "ROLLING" && diceComplete) return "showing-result";
    if (roundState.status === "BETTING" && roundState.timeRemaining <= 5000) return "closing";
    return "betting";
  }, [roundState, diceComplete]);

  const canBet = roundState?.status === "BETTING" && (roundState?.timeRemaining ?? 0) > 5000;
  const timeLeft = roundState ? Math.max(0, Math.ceil(roundState.timeRemaining / 1000)) : 0;
  const isUserWinner = lastResult && currentBet && currentBet.color === lastResult.resultColor;

  const handleRoundClick = useCallback(async (roundId: number, resultColor: string) => {
    setSelectedRound({ roundId, resultColor, winners: [], loading: true });
    try {
      const data = await api.game.roundWinners(roundId);
      setSelectedRound({ roundId, resultColor: data.resultColor, winners: data.winners, loading: false });
    } catch {
      setSelectedRound(null);
    }
  }, []);

  const loadCurrentBet = useCallback(async () => {
    try {
      const data = await api.bets.currentRoundBet();
      setCurrentBet(data.bet);
      if (data.bet) setSelectedColor(data.bet.color);
    } catch { /* noop */ }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const [bets, rounds] = await Promise.all([
        api.bets.history(),
        api.game.history(),
      ]);
      setBetHistory(bets);
      setRoundHistory(rounds);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (user) {
      loadCurrentBet();
      loadHistory();
    }
  }, [user, loadCurrentBet, loadHistory]);

  useEffect(() => {
    if (!lastResult || phase !== "showing-result") return;
    loadCurrentBet();
    loadHistory();
    if (currentBet && currentBet.color === lastResult.resultColor) {
      const payout = currentBet.amount * (PAYOUT_MULTIPLIER[currentBet.color] || 2);
      setMessage({ type: "success", text: `You won! Payout: $${payout.toFixed(2)}` });
    } else if (lastResult) {
      setMessage({ type: "error", text: "Better luck next time!" });
    }
    setShowOverlay(true);
  }, [lastResult, phase, currentBet, loadCurrentBet, loadHistory]);

  useEffect(() => {
    if (roundState?.roundId && roundState.roundId !== prevRoundId) {
      setDiceComplete(false);
      setCurrentBet(null);
      setSelectedColor(null);
      setPrevRoundId(roundState.roundId);
    }
  }, [roundState?.roundId, prevRoundId]);

  const handleRollingComplete = useCallback(() => {
    setDiceComplete(true);
  }, []);

  const handlePlaceBet = async () => {
    if (!selectedColor || !betAmount) return;
    setPlacing(true);
    setMessage(null);
    try {
      const data = await api.bets.place(selectedColor, parseFloat(betAmount));
      setMessage({ type: "info", text: `Bet placed: $${parseFloat(betAmount).toFixed(2)} on ${selectedColor}` });
      setCurrentBet(data);
      await refreshBalance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place bet";
      setMessage({ type: "error", text: msg });
    }
    setPlacing(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-[1200px] mx-auto w-full relative">
      {showOverlay && lastResult && (
        <ResultOverlay
          isWinner={!!isUserWinner}
          resultColor={lastResult.resultColor}
          payout={isUserWinner && currentBet ? currentBet.amount * (PAYOUT_MULTIPLIER[currentBet.color] || 2) : undefined}
          onDismiss={() => setShowOverlay(false)}
        />
      )}

      {message && <MessageBanner type={message.type} text={message.text} />}

      {/* Main Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Betting Dashboard */}
        <div className="flex-1 flex flex-col gap-8">
          
          <GameTimer
            roundState={roundState}
            phase={phase}
            timeLeft={timeLeft}
            canBet={canBet}
            lastResult={lastResult}
            onRollingComplete={handleRollingComplete}
          />

          {phase === "showing-result" && lastResult && (
            <div className="animate-fade-in">
              <WinnersList winners={roundWinners} resultColor={lastResult.resultColor} />
            </div>
          )}

          {lastResult && phase === "betting" && (
            <LastResultBar resultColor={lastResult.resultColor} />
          )}

          <ColorCards
            selectedColor={selectedColor}
            canBet={canBet}
            hasBet={!!currentBet}
            onSelect={setSelectedColor}
          />

          {!currentBet && (
            <BetForm
              betAmount={betAmount}
              canBet={canBet}
              selectedColor={selectedColor}
              placing={placing}
              balance={user?.balance}
              onAmountChange={setBetAmount}
              onPlaceBet={handlePlaceBet}
            />
          )}

          {currentBet && <CurrentBet color={currentBet.color} amount={currentBet.amount} />}

          {/* Recent Winners Preview (Mocked for dashboard) */}
          <div className="flex items-center gap-3 text-sm text-text-dim px-4">
            <span>Recent Winners:</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-xs">🐯</div>
              <span className="text-gold">₹2000</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-xs">🐯</div>
              <span className="text-gold">₹300</span>
            </div>
          </div>
          
        </div>

        {/* Right Column: Reels / Social */}
        <div className="lg:w-[360px] shrink-0">
          <div className="border border-gold/30 rounded-2xl p-1 bg-surface2/40 shadow-2xl overflow-hidden relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[90%]">
              <button className="w-full py-2 bg-black/60 backdrop-blur border border-gold/50 rounded-lg text-gold font-semibold text-sm flex items-center justify-center gap-2 hover:bg-black/80 transition-colors">
                <span className="text-red">▶</span> Connect YouTube
              </button>
            </div>
            <ReelsViewer />
          </div>
        </div>
      </div>

      {/* History Sections at bottom */}
      <div className="mt-12 flex gap-4 flex-wrap md:gap-4 border-t border-border/50 pt-8">
        <div className="flex-[1_1_300px] min-w-0">
          <RoundHistory
            rounds={roundHistory}
            selectedRound={selectedRound}
            onSelectRound={handleRoundClick}
            onDeselectRound={() => setSelectedRound(null)}
          />
        </div>
        <div className="flex-[1_1_300px] min-w-0">
          <BetHistory bets={betHistory} />
        </div>
      </div>
    </div>
  );
}