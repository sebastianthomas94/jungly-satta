const API_BASE = (import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001") + "/api";

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  auth: {
    google: (idToken: string) =>
      request("/auth/google", { method: "POST", body: JSON.stringify({ idToken }) }),
    me: () => request("/auth/me"),
  },
  wallet: {
    balance: () => request("/wallet/balance"),
    deposit: (amount: number) =>
      request("/wallet/deposit", { method: "POST", body: JSON.stringify({ amount }) }),
    withdraw: (amount: number) =>
      request("/wallet/withdraw", { method: "POST", body: JSON.stringify({ amount }) }),
    transactions: () => request("/wallet/transactions"),
  },
  bets: {
    place: (color: string, amount: number) =>
      request("/bets/place", { method: "POST", body: JSON.stringify({ color, amount }) }),
    history: () => request("/bets/history"),
    currentRoundBet: () => request("/bets/current-round-bet"),
  },
  game: {
    state: () => request("/game/state"),
    history: () => request("/game/history"),
    leaderboard: () => request("/game/leaderboard"),
    roundWinners: (roundId: number) => request(`/game/round/${roundId}/winners`),
  },
  youtube: {
    authUrl: () => request("/youtube/auth-url"),
    connect: (code: string) =>
      request("/youtube/connect", { method: "POST", body: JSON.stringify({ code }) }),
    disconnect: () => request("/youtube/disconnect", { method: "DELETE" }),
    status: () => request("/youtube/status"),
    reels: () => request("/youtube/reels"),
  },
};