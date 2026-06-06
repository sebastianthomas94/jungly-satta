import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { api } from "./api";
import { connectSocket, disconnectSocket } from "./socket";
import type { RoundState } from "./socket";

const GOOGLE_CLIENT_ID = "643362371367-ci57ulekvp6saqhq3o2n1k1mmjiurk8l.apps.googleusercontent.com";

interface User {
  userId: number;
  name: string;
  email: string;
  avatar: string;
  balance: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshBalance: () => Promise<void>;
  roundState: RoundState | null;
  lastResult: { roundId: number; resultColor: string } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [lastResult, setLastResult] = useState<{ roundId: number; resultColor: string } | null>(null);

  useEffect(() => {
    if (token) {
      api.auth.me().then(setUser).catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      });
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket();

    socket.on("round:new", (state: RoundState) => {
      setRoundState(state);
      setLastResult(null);
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
        prev
          ? { ...prev, status: "ROLLING", resultColor: data.resultColor }
          : prev
      );
      setLastResult({ roundId: data.roundId, resultColor: data.resultColor });
    });

    socket.on("round:result", () => {
      refreshBalance();
    });

    socket.on("round:current", (state: RoundState) => {
      setRoundState(state);
    });

    return () => {
      disconnectSocket();
    };
  }, [token]);

  const loginWithGoogle = async (idToken: string) => {
    const data = await api.auth.google(idToken);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser({
      userId: data.userId,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      balance: data.balance,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const refreshBalance = async () => {
    if (!token) return;
    try {
      const data = await api.wallet.balance();
      setUser((prev) => prev ? { ...prev, balance: data.balance } : null);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loginWithGoogle, logout, refreshBalance, roundState, lastResult }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}