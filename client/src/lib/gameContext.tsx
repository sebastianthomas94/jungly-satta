/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { connectSocket, disconnectSocket } from "./socket";
import type { RoundState, WinnerInfo } from "./socket";

interface GameContextType {
  roundState: RoundState | null;
  lastResult: { roundId: number; resultColor: string } | null;
  roundWinners: WinnerInfo[];
  refreshBalance: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

interface GameProviderProps {
  token: string | null;
  onBalanceRefresh: () => Promise<void>;
  children: ReactNode;
}

export function GameProvider({ token, onBalanceRefresh, children }: GameProviderProps) {
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [lastResult, setLastResult] = useState<{ roundId: number; resultColor: string } | null>(null);
  const [roundWinners, setRoundWinners] = useState<WinnerInfo[]>([]);

  const refreshBalance = useCallback(async () => {
    await onBalanceRefresh();
  }, [onBalanceRefresh]);

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket();

    socket.on("round:new", (state: RoundState) => {
      setRoundState(state);
      setLastResult(null);
      setRoundWinners([]);
    });

    socket.on("round:tick", (data: { roundId: number; timeRemaining: number }) => {
      setRoundState((prev) =>
        prev && prev.roundId === data.roundId
          ? { ...prev, timeRemaining: data.timeRemaining }
          : prev
      );
    });

    socket.on("round:closing", () => {
      setRoundState((prev) =>
        prev ? { ...prev, status: "ROLLING" } : prev
      );
    });

    socket.on("round:rolling", (data: { roundId: number; resultColor: string }) => {
      setRoundState((prev) =>
        prev ? { ...prev, status: "ROLLING", resultColor: data.resultColor } : prev
      );
      setLastResult({ roundId: data.roundId, resultColor: data.resultColor });
    });

    socket.on("round:result", (data: { roundId: number; resultColor: string; winners: WinnerInfo[] }) => {
      setRoundWinners(data.winners || []);
      refreshBalance();
    });

    socket.on("round:current", (state: RoundState) => {
      setRoundState(state);
    });

    return () => {
      disconnectSocket();
    };
  }, [token, refreshBalance]);

  return (
    <GameContext.Provider value={{ roundState, lastResult, roundWinners, refreshBalance }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}