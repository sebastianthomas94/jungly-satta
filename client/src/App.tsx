import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { GameProvider } from "./lib/gameContext";
import { useIsMobile } from "./lib/hooks";
import Login from "./pages/Login";
import Game from "./pages/Game";
import Wallet from "./pages/Wallet";
import YouTubeCallback from "./pages/YouTubeCallback";

function Navbar() {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  if (!user) return null;

  return (
    <nav className="flex justify-between items-center px-6 py-3 bg-surface border-b border-border flex-wrap gap-2 max-[767px]:p-3 max-[767px]:gap-2">
      <Link to="/" className="font-extrabold text-lg text-gold no-underline">
        Jungly Satta
      </Link>
      <div className="flex items-center gap-6 max-[767px]:gap-2">
        {user.avatar && (
          <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full" />
        )}
        {!isMobile && (
          <span className="text-text text-sm max-[767px]:hidden">{user.name}</span>
        )}
        <span className="text-gold font-bold">
          ${user.balance.toFixed(2)}
        </span>
        <Link to="/wallet" className="text-text text-sm">
          Wallet
        </Link>
        <button
          onClick={logout}
          className="bg-none border border-border rounded-md px-3 py-0.5 text-text-dim text-[0.85rem] cursor-pointer"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

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
          <Navbar />
          <Wallet />
        </PrivateRoute>
      } />
      <Route path="/" element={
        <PrivateRoute>
          <Navbar />
          <Game />
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