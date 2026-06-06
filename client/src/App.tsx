import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Login from "./pages/Login";
import Game from "./pages/Game";
import Wallet from "./pages/Wallet";

function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "0.75rem 1.5rem", background: "var(--surface)",
      borderBottom: "1px solid var(--border)"
    }}>
      <Link to="/" style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--gold)", textDecoration: "none" }}>
        Jungly Satta
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        {user.avatar && (
          <img src={user.avatar} alt={user.name} style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
        )}
        <span style={{ color: "var(--text)", fontSize: "0.9rem" }}>{user.name}</span>
        <span style={{ color: "var(--gold)", fontWeight: 700 }}>
          ${user.balance.toFixed(2)}
        </span>
        <Link to="/wallet" style={{ color: "var(--text)", fontSize: "0.9rem" }}>
          Wallet
        </Link>
        <button
          onClick={logout}
          style={{
            background: "none", border: "1px solid var(--border)", borderRadius: "6px",
            padding: "0.3rem 0.75rem", color: "var(--text-dim)", fontSize: "0.85rem"
          }}
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
      <Route path="/wallet" element={
        <PrivateRoute>
          <>
            <Navbar />
            <Wallet />
          </>
        </PrivateRoute>
      } />
      <Route path="/" element={
        <PrivateRoute>
          <>
            <Navbar />
            <Game />
          </>
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}