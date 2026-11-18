import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { LeaderboardEntry, GameId } from '../types';
import { ALL_GAMES } from '../data/games';
import { ArrowLeft, RefreshCw, Search, Play } from 'lucide-react';
import { sound } from '../utils/sound';
import { getAvatarIcon } from '../utils/avatars';

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

  return (
    <div className="flex flex-col gap-7 w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 border-b border-hairline pb-5">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-vermilion font-medium">
            Global Standings
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight mt-1">
            Leaderboard
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {selectedGame !== 'all' && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onPlayGame(selectedGame as GameId);
              }}
              className="px-4 py-2 rounded-xl bg-vermilion hover:bg-vermilion-hover text-surface text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Module</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh Leaderboard"
            aria-label="Refresh Leaderboard"
            className="p-2.5 rounded-xl bg-surface hover:bg-recessed text-ink border border-hairline transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-recessed text-ink border border-hairline text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Arena</span>
          </button>
        </div>
      </div>

      {/* Filters & Search (concentric: p-2 [8px] + rounded-lg [8px] = rounded-2xl [16px]) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 bg-surface rounded-2xl border border-hairline">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 max-w-full scrollbar-none">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setSelectedGame('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer ${
              selectedGame === 'all'
                ? 'bg-ink text-surface'
                : 'text-ink-secondary hover:bg-recessed hover:text-ink'
            }`}
          >
            Overall XP
          </button>

          {ALL_GAMES.map(g => (
            <button
              type="button"
              key={g.id}
              onClick={() => {
                sound.playClick();
                setSelectedGame(g.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                selectedGame === g.id
                  ? 'bg-ink text-surface'
                  : 'text-ink-secondary hover:bg-recessed hover:text-ink'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-paper border border-hairline rounded-lg text-xs text-ink placeholder-ink-muted focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      {/* Editorial Top 3 Podium Cards */}
      {topThree.length >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topThree.map((entry, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={entry.userId + idx}
                className={`p-6 rounded-2xl border flex flex-col justify-between gap-4 ${
                  isFirst
                    ? 'bg-ink text-surface border-ink'
                    : 'bg-surface text-ink border-hairline'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold uppercase tracking-widest ${
                      isFirst ? 'text-vermilion' : 'text-ink-muted'
                    }`}
                  >
                    Rank #{idx + 1}
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isFirst
                        ? 'border-surface/20 text-surface/80'
                        : 'border-hairline text-ink-secondary bg-recessed/60'
                    }`}
                  >
                    {entry.rankTier}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-lg shrink-0 ${
                      isFirst ? 'bg-vermilion text-surface' : 'bg-recessed text-ink'
                    }`}
                  >
                    {getAvatarIcon(entry.avatarUrl)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-lg font-semibold truncate">{entry.username}</div>
                    <div
                      className={`font-mono text-xs tabular-nums ${
                        isFirst ? 'text-surface/75' : 'text-ink-muted'
                      }`}
                    >
                      {entry.gamesPlayed} sessions
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-current/15 font-mono text-xl font-bold tabular-nums">
                  {selectedGame === 'all'
                    ? `${entry.totalXp.toLocaleString()} XP`
                    : `${(entry.bestScore || 0).toLocaleString()} pts`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Standings Table */}
      <div className="rounded-2xl bg-surface border border-hairline overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-14 text-ink-muted text-sm flex items-center justify-center gap-2 font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-vermilion" />
            <span>Loading standings...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-ink-muted text-sm">
            No player records found for this module yet. Be the first to set a record.
          </div>
        ) : (
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-hairline text-ink-muted font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 sm:px-5">Rank</th>
                <th className="py-3 px-3 sm:px-5">Player</th>
                <th className="hidden sm:table-cell py-3 px-5">Tier</th>
                <th className="py-3 px-3 sm:px-5 text-right">
                  {selectedGame === 'all' ? 'Total XP' : 'High Score'}
                </th>
                {selectedGame !== 'all' && <th className="py-3 px-3 sm:px-5 text-right">Acc</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/70">
              {filteredEntries.map((player, idx) => (
                <tr key={player.userId + idx} className="hover:bg-paper/70 transition-colors duration-150">
                  <td className="py-3 px-3 sm:px-5 font-mono font-bold tabular-nums">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${
                        idx === 0
                          ? 'bg-vermilion text-surface'
                          : idx < 3
                          ? 'bg-ink text-surface'
                          : 'text-ink-muted'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3 sm:px-5">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-recessed text-ink font-mono flex items-center justify-center text-sm shrink-0">
                        {getAvatarIcon(player.avatarUrl)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate max-w-[120px] sm:max-w-none">
                          {player.username}
                        </div>
                        <div className="text-[11px] text-ink-muted font-mono tabular-nums">
                          {player.gamesPlayed} sessions
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell py-3 px-5">
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-recessed text-ink-secondary font-medium">
                      {player.rankTier}
                    </span>
                  </td>
                  <td className="py-3 px-3 sm:px-5 text-right font-mono font-bold text-ink tabular-nums whitespace-nowrap">
                    {selectedGame === 'all'
                      ? `${player.totalXp.toLocaleString()} XP`
                      : `${(player.bestScore || 0).toLocaleString()} pts`}
                  </td>
                  {selectedGame !== 'all' && (
                    <td className="py-3 px-3 sm:px-5 text-right font-mono font-semibold text-vermilion tabular-nums whitespace-nowrap">
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
