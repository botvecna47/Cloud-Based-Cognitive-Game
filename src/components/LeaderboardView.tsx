import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { LeaderboardEntry, GameId } from '../types';
import { ALL_GAMES } from '../data/games';
import { Trophy, Medal, Crown, ArrowLeft, RefreshCw, Flame, Search } from 'lucide-react';
import { sound } from '../utils/sound';

export const LeaderboardView: React.FC<{ onBack: () => void; onPlayGame: (gameId: GameId) => void }> = ({
  onBack,
  onPlayGame,
}) => {
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadScores = async (gameId: string) => {
    setIsLoading(true);
    const data = await dbService.getLeaderboard(gameId === 'all' ? undefined : gameId);
    setLeaderboard(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadScores(selectedGame);
  }, [selectedGame]);

  const handleRefresh = () => {
    sound.playClick();
    loadScores(selectedGame);
  };

  const filteredEntries = leaderboard.filter(e =>
    e.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = filteredEntries.slice(0, 3);
  const restEntries = filteredEntries.slice(3);

  const rankBadgeColors: Record<string, string> = {
    Grandmaster: 'text-purple-300 bg-purple-950/60 border-purple-500/40',
    Master: 'text-rose-300 bg-rose-950/60 border-rose-500/40',
    Diamond: 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40',
    Platinum: 'text-teal-300 bg-teal-950/60 border-teal-500/40',
    Gold: 'text-amber-300 bg-amber-950/60 border-amber-500/40',
    Silver: 'text-slate-300 bg-slate-800 border-slate-600',
    Bronze: 'text-orange-400 bg-orange-950/60 border-orange-500/40',
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-2 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span>Global Hall of Fame</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Live competitive rankings powered by Supabase Cloud Database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            title="Refresh Leaderboard"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Arena</span>
          </button>
        </div>
      </div>

      {/* Game Filter Carousel & Search */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-2 bg-slate-900/90 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <button
            onClick={() => {
              sound.playClick();
              setSelectedGame('all');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedGame === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            ⭐ Overall XP
          </button>

          {ALL_GAMES.map(g => (
            <button
              key={g.id}
              onClick={() => {
                sound.playClick();
                setSelectedGame(g.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedGame === g.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{g.icon}</span>
              <span>{g.name}</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Podium for Top 3 */}
      {topThree.length >= 2 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2 max-w-lg mx-auto w-full">
          {/* #2 Silver */}
          {topThree[1] && (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 p-0.5 shadow-lg shadow-slate-400/20 flex items-center justify-center text-2xl">
                  🧠
                </div>
                <div className="absolute -top-2 -right-1.5 px-2 py-0.5 bg-slate-300 text-slate-950 font-black text-xs rounded-full shadow">
                  #2
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center truncate max-w-[90px]">
                {topThree[1].username}
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {selectedGame === 'all' ? `${topThree[1].totalXp} XP` : `${topThree[1].bestScore || 0} pts`}
              </span>
              <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-2xl border-t border-slate-600 flex items-center justify-center font-black text-slate-400 text-xl mt-2">
                2nd
              </div>
            </div>
          )}

          {/* #1 Gold */}
          {topThree[0] && (
            <div className="flex flex-col items-center">
              <Crown className="w-7 h-7 text-amber-400 mb-1 animate-bounce" />
              <div className="relative mb-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 p-0.5 shadow-xl shadow-amber-400/30 flex items-center justify-center text-3xl">
                  👑
                </div>
                <div className="absolute -top-2 -right-1.5 px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow">
                  #1
                </div>
              </div>
              <span className="text-xs sm:text-base font-extrabold text-amber-300 text-center truncate max-w-[110px]">
                {topThree[0].username}
              </span>
              <span className="text-xs sm:text-sm font-mono font-black text-emerald-400">
                {selectedGame === 'all' ? `${topThree[0].totalXp} XP` : `${topThree[0].bestScore || 0} pts`}
              </span>
              <div className="w-full h-28 sm:h-32 bg-gradient-to-t from-amber-950/60 to-amber-800/80 rounded-t-2xl border-t border-amber-400 flex items-center justify-center font-black text-amber-300 text-2xl mt-2 shadow-lg shadow-amber-500/10">
                1st
              </div>
            </div>
          )}

          {/* #3 Bronze */}
          {topThree[2] && (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-700 to-orange-400 p-0.5 shadow-lg shadow-amber-700/20 flex items-center justify-center text-2xl">
                  ⚡
                </div>
                <div className="absolute -top-2 -right-1.5 px-2 py-0.5 bg-amber-700 text-white font-black text-xs rounded-full shadow">
                  #3
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center truncate max-w-[90px]">
                {topThree[2].username}
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {selectedGame === 'all' ? `${topThree[2].totalXp} XP` : `${topThree[2].bestScore || 0} pts`}
              </span>
              <div className="w-full h-16 sm:h-20 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-2xl border-t border-amber-700/80 flex items-center justify-center font-black text-amber-600 text-xl mt-2">
                3rd
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Fetching live cloud rankings...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No player records found for this game yet. Be the first to set a record!
          </div>
        ) : (
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Cadet Player</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3 text-right">
                  {selectedGame === 'all' ? 'Total Experience' : 'High Score'}
                </th>
                {selectedGame !== 'all' && (
                  <th className="py-2.5 px-3 text-right">Accuracy</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredEntries.map((player, idx) => (
                <tr
                  key={player.userId + idx}
                  className="hover:bg-slate-800/50 transition-colors text-slate-300"
                >
                  <td className="py-3 px-3 font-bold">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans font-semibold text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-base">
                      {idx === 0 ? '👑' : '🧠'}
                    </div>
                    <div>
                      <div>{player.username}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {player.gamesPlayed} sessions completed
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        rankBadgeColors[player.rankTier] || rankBadgeColors.Bronze
                      }`}
                    >
                      {player.rankTier}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-cyan-300 text-sm">
                    {selectedGame === 'all'
                      ? `${player.totalXp.toLocaleString()} XP`
                      : `${player.bestScore?.toLocaleString() || 0} pts`}
                  </td>
                  {selectedGame !== 'all' && (
                    <td className="py-3 px-3 text-right font-semibold text-emerald-400">
                      {player.bestAccuracy !== undefined ? `${player.bestAccuracy}%` : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
