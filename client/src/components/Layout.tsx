import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useIsMobile } from "../lib/hooks";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!user) return <>{children}</>;

  const links = [
    { path: "/", label: "Game", icon: "🎮" },
    { path: "/wallet", label: "Wallet", icon: "💳" },
    { path: "/leaderboard", label: "Leaderboard", icon: "🏆" },
    // Mock profile button mapping to logout as discussed
    { path: "#", label: "Profile", icon: "👤", onClick: logout },
  ];

  return (
    <div className="flex min-h-screen bg-bg text-text">
      {/* Left Sidebar */}
      {!isMobile && (
        <aside className="w-64 flex-shrink-0 border-r border-border bg-surface2/50 flex flex-col">
          <div className="p-6">
            <Link to="/" className="text-2xl font-extrabold text-gradient-gold no-underline tracking-wide">
              Jungly Satta
            </Link>
          </div>
          <nav className="flex-1 px-4 py-2 flex flex-col gap-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return link.path === "#" ? (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer transition-all hover:bg-surface text-text-dim hover:text-text border-none bg-transparent"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </button>
              ) : (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl no-underline transition-all ${
                    isActive
                      ? "bg-surface border border-border shadow-[0_0_15px_rgba(255,215,0,0.05)] text-gold"
                      : "text-text-dim hover:bg-surface hover:text-text"
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 border-b border-border bg-surface2/30 flex items-center justify-between px-6 shrink-0">
          {/* Mobile Logo or Left Space */}
          <div className="flex items-center">
            {isMobile && (
              <Link to="/" className="text-xl font-extrabold text-gradient-gold no-underline tracking-wide">
                Jungly Satta
              </Link>
            )}
          </div>

          {/* Right side stats */}
          <div className="flex items-center gap-4 md:gap-6 bg-surface px-4 py-2 rounded-full border border-border shadow-lg">
            <div className="flex items-center gap-2">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-gold" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
              )}
              {!isMobile && <span className="text-sm font-medium">{user.name}</span>}
            </div>
            
            <div className="h-6 w-px bg-border hidden md:block"></div>

            <div className="flex items-center gap-2">
              <span className="text-gold font-bold tracking-wide">₹{user.balance.toFixed(2)}</span>
              <Link to="/wallet" className="w-6 h-6 rounded-full bg-gold text-bg flex items-center justify-center font-bold no-underline hover:scale-110 transition-transform">
                +
              </Link>
            </div>

            <div className="h-6 w-px bg-border hidden md:block"></div>

            <button
              onClick={logout}
              className="text-text-dim hover:text-red transition-colors bg-transparent border-none cursor-pointer text-sm font-medium hidden md:block"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around p-3 z-50">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return link.path === "#" ? (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className="flex flex-col items-center gap-1 bg-transparent border-none text-text-dim"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-[10px]">{link.label}</span>
                </button>
              ) : (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`flex flex-col items-center gap-1 no-underline ${
                    isActive ? "text-gold" : "text-text-dim"
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-[10px]">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
