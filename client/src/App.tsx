import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { GameProvider } from "./lib/gameContext";
import Login from "./pages/Login";
import Game from "./pages/Game";
import Wallet from "./pages/Wallet";
import LeaderboardPage from "./pages/LeaderboardPage";
import YouTubeCallback from "./pages/YouTubeCallback";
import Layout from "./components/Layout";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
      <Route path="/auth/youtube/callback" element={<YouTubeCallback />} />
      <Route path="/wallet" element={
        <PrivateRoute>
          <Layout>
            <Wallet />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/leaderboard" element={
        <PrivateRoute>
          <Layout>
            <LeaderboardPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/" element={
        <PrivateRoute>
          <Layout>
            <Game />
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppWithGame />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppWithGame() {
  const { token, refreshBalance } = useAuth();
  return (
    <GameProvider token={token} onBalanceRefresh={refreshBalance}>
      <AppRoutes />
    </GameProvider>
  );
}