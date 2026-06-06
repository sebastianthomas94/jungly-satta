import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../lib/auth";
import { useGame } from "../lib/gameContext";
import { api } from "../lib/api";
import { PAYOUT_MULTIPLIER } from "../lib/constants";
import WinnersList from "../components/WinnersList";
import Leaderboard from "../components/Leaderboard";
import ResultOverlay from "../components/ResultOverlay";
import GameTimer from "../components/GameTimer";
import ColorCards from "../components/ColorCards";
import BetForm from "../components/BetForm";
import CurrentBet from "../components/CurrentBet";
import RoundHistory from "../components/RoundHistory";
import BetHistory from "../components/BetHistory";
import LastResultBar from "../components/LastResultBar";
import MessageBanner from "../components/MessageBanner";
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

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Welcome to Jungly Satta</h2>
        <p style={{ color: "var(--text-dim)", marginBottom: "2rem" }}>
          Please login to start playing
        </p>
        <a href="/login" style={{
          display: "inline-block", padding: "0.75rem 2rem", background: "var(--blue)",
          borderRadius: "8px", color: "#fff", fontWeight: 600
        }}>
          Login
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1rem" }}>
      {showOverlay && lastResult && (
        <ResultOverlay
          isWinner={!!isUserWinner}
          resultColor={lastResult.resultColor}
          payout={isUserWinner && currentBet ? currentBet.amount * (PAYOUT_MULTIPLIER[currentBet.color] || 2) : undefined}
          onDismiss={() => setShowOverlay(false)}
        />
      )}

      <GameTimer
        roundState={roundState}
        phase={phase}
        timeLeft={timeLeft}
        canBet={canBet}
        lastResult={lastResult}
        onRollingComplete={handleRollingComplete}
      />

      {phase === "showing-result" && lastResult && (
        <div style={{ marginBottom: "1.5rem" }} className="overlay-enter">
          <WinnersList winners={roundWinners} resultColor={lastResult.resultColor} />
        </div>
      )}

      {lastResult && phase === "betting" && (
        <LastResultBar resultColor={lastResult.resultColor} />
      )}

      {message && <MessageBanner type={message.type} text={message.text} />}

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

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px", minWidth: 0 }}>
          <RoundHistory
            rounds={roundHistory}
            selectedRound={selectedRound}
            onSelectRound={handleRoundClick}
            onDeselectRound={() => setSelectedRound(null)}
          />
          <BetHistory bets={betHistory} />
        </div>
        <div style={{ flex: "0 0 300px" }}>
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}