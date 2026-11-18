import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { GameResult, SessionLevelRecord, GameId } from '../types';
import { ALL_GAMES } from '../data/games';
import { Download, ChevronDown, ChevronUp, Search, Play, ArrowLeft, RefreshCw } from 'lucide-react';
import { sound } from '../utils/sound';

export const HistoryView: React.FC<{ onBack: () => void; onPlayGame: (gameId: GameId) => void }> = ({
  onBack,
  onPlayGame,
}) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<GameResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [telemetryCache, setTelemetryCache] = useState<Record<string, SessionLevelRecord[]>>({});
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadHistory = async () => {
    if (!user) {
      setHistory([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const data = await dbService.getUserHistory(user.id, trackFilter, gameFilter, 100);
    setHistory(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [user, trackFilter, gameFilter]);

  const toggleExpand = async (session: GameResult) => {
    sound.playClick();
    if (!session.id) return;

    if (expandedSessionId === session.id) {
      setExpandedSessionId(null);
      return;
    }

    setExpandedSessionId(session.id);

    if (!telemetryCache[session.id]) {
      const records = await dbService.getSessionTelemetry(session.id);
      setTelemetryCache(prev => ({ ...prev, [session.id!]: records }));
    }
  };

  const handleExport = async () => {
    if (!user) return;
    sound.playClick();
    const jsonStr = await dbService.exportUserData(user.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gamefied_apti_history_${user.username}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(item =>
    item.gameName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-7 w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 border-b border-hairline pb-5">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-vermilion font-medium">
            Execution Log
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight mt-1">
            Session History
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-surface hover:bg-recessed text-ink border border-hairline text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title="Export all data as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
          <button
            type="button"
            onClick={loadHistory}
            aria-label="Refresh history"
            className="p-2 rounded-xl bg-surface hover:bg-recessed text-ink border border-hairline transition-colors cursor-pointer"
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

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-surface rounded-2xl border border-hairline">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={trackFilter}
            onChange={e => setTrackFilter(e.target.value)}
            aria-label="Filter by track"
            className="px-3 py-1.5 bg-paper border border-hairline rounded-xl text-xs font-medium text-ink focus:outline-none focus:border-ink"
          >
            <option value="all">All Tracks</option>
            <option value="cognitive">Cognitive Track</option>
            <option value="game-based">Challenge Track</option>
          </select>

          <select
            value={gameFilter}
            onChange={e => setGameFilter(e.target.value)}
            aria-label="Filter by game"
            className="px-3 py-1.5 bg-paper border border-hairline rounded-xl text-xs font-medium text-ink focus:outline-none focus:border-ink"
          >
            <option value="all">All 12 Modules</option>
            {ALL_GAMES.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-paper border border-hairline rounded-xl text-xs text-ink placeholder-ink-muted focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="text-center py-14 text-ink-muted text-sm font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-vermilion" />
            <span>Loading session records...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-10 text-center bg-surface rounded-2xl border border-hairline text-ink-secondary text-sm">
            No matching sessions found. Complete any module to log telemetry here.
          </div>
        ) : (
          filteredHistory.map((item, idx) => {
            const isExpanded = expandedSessionId === item.id;
            const telemetry = item.id ? telemetryCache[item.id] || [] : [];

            return (
              <div
                key={item.id || idx}
                className="bg-surface border border-hairline hover:border-ink/40 rounded-2xl transition-colors overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(item)}
                  aria-expanded={isExpanded}
                  className="w-full text-left p-5 flex items-center justify-between flex-wrap gap-4 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-vermilion"
                >
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-display font-semibold text-ink text-lg">
                        {item.gameName}
                      </span>
                      <span className="font-mono text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-recessed text-ink-secondary">
                        {item.track === 'cognitive' ? 'Cognitive' : 'Challenge'}
                      </span>
                      {item.mode && item.mode !== 'practice' && (
                        <span className="font-mono text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-vermilion-wash text-vermilion">
                          {item.mode}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-ink-muted mt-1.5 flex items-center gap-2.5 tabular-nums">
                      <span>
                        {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} •{' '}
                        {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>/</span>
                      <span>{item.level} levels cleared</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline/60">
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-mono font-bold text-ink tabular-nums">
                        {item.score.toLocaleString()}{' '}
                        <span className="text-xs text-ink-muted font-normal">pts</span>
                      </div>
                      <div className="font-mono text-xs font-medium text-vermilion tabular-nums">
                        {item.accuracy}% acc ({item.correct}/{item.attempts})
                      </div>
                    </div>

                    {item.performanceIndex != null && (
                      <div className="text-right">
                        <div className="text-sm sm:text-base font-mono font-bold text-ink tabular-nums">
                          {item.performanceIndex}/100
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                          {item.performanceBand}
                        </div>
                      </div>
                    )}

                    <div className="text-ink-muted shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-4 border-t border-hairline bg-paper/70 animate-fade-in">
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="font-mono text-[10px] uppercase font-medium tracking-[0.12em] text-ink-muted">
                        Level-by-Level Telemetry
                      </span>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onPlayGame(item.gameId);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-ink hover:bg-vermilion text-surface text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Replay</span>
                      </button>
                    </div>

                    {telemetry.length === 0 ? (
                      <div className="p-4 rounded-xl bg-surface border border-hairline text-ink-muted font-mono text-xs text-center tabular-nums">
                        Round total: {item.score} pts • {item.correct} of {item.attempts} correct • {Math.round(item.durationSeconds / 60)} min
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                        {telemetry.map((lvl, lvlIdx) => (
                          <div
                            key={`${lvl.levelNumber}-${lvlIdx}`}
                            className={`p-3 rounded-xl border text-xs font-mono tabular-nums ${
                              lvl.isCorrect
                                ? 'bg-surface border-hairline text-ink'
                                : 'bg-vermilion-wash/60 border-vermilion/30 text-vermilion'
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between">
                              <span>L{String(lvl.levelNumber).padStart(2, '0')}</span>
                              <span>{lvl.isCorrect ? 'OK' : 'MISS'}</span>
                            </div>
                            <div className="font-bold mt-1">+{lvl.scoreEarned}</div>
                            <div className="text-[11px] text-ink-muted mt-0.5">
                              {lvl.timeTakenSeconds}s
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
