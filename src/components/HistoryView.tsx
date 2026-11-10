import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { GameResult, SessionLevelRecord, GameId } from '../types';
import { ALL_GAMES } from '../data/games';
import { History, Download, ChevronDown, ChevronUp, Search, Play, ArrowLeft, RefreshCw, Zap } from 'lucide-react';
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
    if (!user) return;
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

    // Fetch telemetry if not already cached
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
    a.download = `mount_adept_history_${user.username}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.gameName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-2 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <History className="w-8 h-8 text-cyan-400" />
            <span>Aptitude Records & History</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Deep granular telemetry, accuracy metrics, and speed audits stored in Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            title="Export all data as JSON"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
          <button
            onClick={loadHistory}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Track Filter */}
          <select
            value={trackFilter}
            onChange={e => setTrackFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Tracks</option>
            <option value="cognitive">Track 1: Cognitive Aptitude</option>
            <option value="game-based">Track 2: Capgemini Game Round</option>
          </select>

          {/* Game Filter */}
          <select
            value={gameFilter}
            onChange={e => setGameFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All 12 Games</option>
            {ALL_GAMES.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search game sessions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Loading assessment records...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            No matching assessment sessions found. Play a game to record your performance!
          </div>
        ) : (
          filteredHistory.map((item, idx) => {
            const isExpanded = expandedSessionId === item.id;
            const telemetry = item.id ? telemetryCache[item.id] || [] : [];

            return (
              <div
                key={item.id || idx}
                className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded-2xl transition-all overflow-hidden shadow-md"
              >
                {/* Main Row */}
                <div
                  onClick={() => toggleExpand(item)}
                  className="p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-xl shrink-0">
                      {ALL_GAMES.find(g => g.id === item.gameId)?.icon || '🎮'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-white text-base">
                          {item.gameName}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                          {item.track}
                        </span>
                        {item.mode && item.mode !== 'practice' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {item.mode}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span>
                          {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                          {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span>Level {item.level} cleared</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    {/* Score & Index */}
                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-mono font-black text-cyan-300">
                        {item.score} <span className="text-xs text-slate-500 font-sans font-normal">pts</span>
                      </div>
                      <div className="text-xs font-semibold text-emerald-400">
                        {item.accuracy}% acc ({item.correct}/{item.attempts})
                      </div>
                    </div>

                    {item.performanceIndex !== undefined && (
                      <div className="hidden sm:block text-right">
                        <div className="text-base font-mono font-bold text-amber-300">
                          {item.performanceIndex} / 100
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.performanceBand}
                        </div>
                      </div>
                    )}

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expandable Granular Level Telemetry */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Level-by-Level Execution Telemetry</span>
                      </span>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onPlayGame(item.gameId);
                        }}
                        className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Replay Game</span>
                      </button>
                    </div>

                    {telemetry.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs text-center">
                        Total round score: {item.score} pts • {item.correct} correct of {item.attempts} attempts in {Math.round(item.durationSeconds / 60)} minutes.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {telemetry.map(lvl => (
                          <div
                            key={lvl.levelNumber}
                            className={`p-2.5 rounded-xl border flex flex-col text-xs ${
                              lvl.isCorrect
                                ? 'bg-slate-900 border-slate-800 text-slate-300'
                                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                            }`}
                          >
                            <div className="font-bold text-white flex items-center justify-between">
                              <span>Lvl {lvl.levelNumber}</span>
                              <span>{lvl.isCorrect ? '✓' : '✗'}</span>
                            </div>
                            <div className="font-mono text-cyan-400 font-bold mt-1">
                              +{lvl.scoreEarned} pts
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              ⏱ {lvl.timeTakenSeconds}s
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
