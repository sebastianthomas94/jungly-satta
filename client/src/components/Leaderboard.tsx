import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

interface LeaderboardEntry {
  id: number;
  name: string;
  avatar: string;
  totalWinnings: number;
  wins: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await api.game.leaderboard();
      const normalized = data.map((entry: LeaderboardEntry) => ({
        ...entry,
        totalWinnings: Number(entry.totalWinnings),
        wins: Number(entry.wins),
      }));
      setEntries(normalized);
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 15000);
    return () => clearInterval(interval);
  }, [loadLeaderboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin text-4xl text-gold">↻</div>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const restOfTop = entries.slice(3, 50);

  // Mock data for badges
  const badges = [
    { id: 1, name: "High Roller", desc: "Stacks High Roller", icon: "💰", color: "bg-gold/20 text-gold border-gold/50" },
    { id: 2, name: "Lucky 7s", desc: "Lucky 7s x5", icon: "🎲", color: "bg-green/20 text-green border-green/50" },
    { id: 3, name: "Jungle King", desc: "Jungle King", icon: "🦁", color: "bg-orange-500/20 text-orange-400 border-orange-500/50" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1200px] mx-auto">
      {/* Main Leaderboard Area */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Top 3 Podium */}
        {top3.length > 0 && (
          <div className="flex justify-center items-end gap-2 md:gap-4 mb-8 pt-8">
            {/* Rank 2 - Silver */}
            {top3[1] && (
              <div className="w-[30%] max-w-[200px] bg-surface2/80 border border-gray-400/30 rounded-2xl p-4 flex flex-col items-center shadow-lg relative h-[180px] justify-end pb-6">
                <div className="absolute -top-10 w-20 h-20 rounded-full border-4 border-[#C0C0C0] overflow-hidden shadow-[0_0_15px_rgba(192,192,192,0.5)] bg-surface">
                  {top3[1].avatar ? <img src={top3[1].avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold">{top3[1].name[0]}</div>}
                </div>
                <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Rank 2</div>
                <div className="font-semibold text-sm text-center truncate w-full">{top3[1].name}</div>
                <div className="text-[#C0C0C0] font-bold mt-2">₹{top3[1].totalWinnings.toFixed(0)}</div>
                <div className="text-xs text-text-dim">(Silver)</div>
              </div>
            )}

            {/* Rank 1 - Gold */}
            {top3[0] && (
              <div className="w-[35%] max-w-[240px] bg-gradient-to-b from-surface2 to-surface border border-gold/50 rounded-2xl p-4 flex flex-col items-center shadow-[0_0_30px_rgba(255,215,0,0.15)] relative h-[220px] justify-end pb-8 z-10">
                <div className="absolute -top-12 w-24 h-24 rounded-full border-4 border-gold overflow-hidden shadow-[0_0_20px_rgba(255,215,0,0.8)] bg-surface">
                  {top3[0].avatar ? <img src={top3[0].avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gold">{top3[0].name[0]}</div>}
                </div>
                <div className="text-gold text-sm uppercase tracking-widest font-black mb-1 drop-shadow-md">Rank 1</div>
                <div className="font-bold text-lg text-center truncate w-full text-white">{top3[0].name}</div>
                <div className="text-gold text-xl font-black mt-2 drop-shadow-lg">₹{top3[0].totalWinnings.toFixed(0)}</div>
                <div className="text-xs text-gold-dim font-bold uppercase">(Gold)</div>
              </div>
            )}

            {/* Rank 3 - Bronze */}
            {top3[2] && (
              <div className="w-[30%] max-w-[200px] bg-surface2/80 border border-[#CD7F32]/30 rounded-2xl p-4 flex flex-col items-center shadow-lg relative h-[160px] justify-end pb-4">
                <div className="absolute -top-8 w-16 h-16 rounded-full border-4 border-[#CD7F32] overflow-hidden shadow-[0_0_15px_rgba(205,127,50,0.5)] bg-surface">
                  {top3[2].avatar ? <img src={top3[2].avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[#CD7F32]">{top3[2].name[0]}</div>}
                </div>
                <div className="text-[#CD7F32] text-xs uppercase tracking-widest font-bold mb-1">Rank 3</div>
                <div className="font-semibold text-sm text-center truncate w-full">{top3[2].name}</div>
                <div className="text-[#CD7F32] font-bold mt-1">₹{top3[2].totalWinnings.toFixed(0)}</div>
                <div className="text-xs text-text-dim">(Bronze)</div>
              </div>
            )}
          </div>
        )}

        {/* Top 50 List */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-surface2/50">
            <h3 className="text-text font-bold text-lg m-0">Top 50 Players</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-text-dim bg-surface2/30">
                <tr>
                  <th className="px-6 py-3 font-medium">Rank</th>
                  <th className="px-6 py-3 font-medium">Avatar</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Total Wins</th>
                  <th className="px-6 py-3 font-medium text-right">Wins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {restOfTop.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-surface2/30 transition-colors">
                    <td className="px-6 py-4 text-text-dim font-mono">{idx + 4}.</td>
                    <td className="px-6 py-4">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full border border-border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-xs font-bold text-text-dim">
                          {entry.name[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-text">{entry.name}</td>
                    <td className="px-6 py-4 font-bold text-gold">₹{entry.totalWinnings.toFixed(0)}</td>
                    <td className="px-6 py-4 text-right text-text-dim">{entry.wins} Wins</td>
                  </tr>
                ))}
                {restOfTop.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-dim">
                      No more players to display
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Stats & Badges */}
      <div className="lg:w-[320px] shrink-0 flex flex-col gap-6">
        
        {/* Your Stats */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h3 className="text-text font-bold text-lg m-0 mb-6">Your Stats</h3>
          <div className="flex flex-col items-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-20 h-20 rounded-full border-2 border-gold mb-4" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-surface2 border-2 border-gold flex items-center justify-center text-3xl font-bold mb-4">
                {user?.name?.[0] || "?"}
              </div>
            )}
            
            <div className="w-full flex justify-between items-center py-3 border-b border-border">
              <span className="text-text-dim">Current Rank</span>
              <span className="font-bold text-gold text-lg">1</span>
            </div>
            <div className="w-full flex justify-between items-center py-3 border-b border-border">
              <span className="text-text-dim">Best Streak</span>
              <span className="font-bold text-green text-lg">7 Wins</span>
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="bg-surface rounded-2xl border border-border p-6 flex-1">
          <h3 className="text-text font-bold text-lg m-0 mb-6">Achievement Badges</h3>
          <div className="flex flex-col gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="flex flex-col items-center gap-2 p-4 bg-surface2/50 rounded-xl border border-white/5 hover:bg-surface2 transition-colors cursor-pointer group">
                <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-3xl shadow-lg ${badge.color} group-hover:scale-110 transition-transform duration-300`}>
                  {badge.icon}
                </div>
                <div className="text-center">
                  <div className="font-bold text-text">{badge.name}</div>
                  <div className="text-xs text-text-dim">{badge.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}