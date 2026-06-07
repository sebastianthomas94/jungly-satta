/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { api } from "./api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

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
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  const refreshBalance = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.wallet.balance();
      setUser((prev) => prev ? { ...prev, balance: data.balance } : null);
    } catch { /* noop */ }
  }, [token]);

  useEffect(() => {
    if (token) {
      api.auth.me().then(setUser).catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      });
    }
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
  };

  return (
    <AuthContext.Provider value={{ user, token, loginWithGoogle, logout, refreshBalance }}>
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