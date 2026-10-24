import React, { useState } from 'react';
import { loadUserStats, clearUserStats } from '../utils/storage';
import { ALL_GAMES } from '../data/games';
import { Trophy, Target, Award, Trash2, ArrowLeft } from 'lucide-react';

export const StatsDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [stats, setStats] = useState(loadUserStats());

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all your practice history and scores?')) {
      clearUserStats();
      setStats(loadUserStats());
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-2 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-cyan-400" />
            <span>Performance Analytics</span>
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Your cumulative training records across all cognitive and game-based assessments.
          </p>
        </div>

        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Arena</span>
        </button>
      </div>

      {/* Global Stat Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-2xl">
            🎮
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {stats.gamesPlayed}
            </div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Rounds Completed
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-2xl">
            ⚡
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {stats.totalScore.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Total Score Points
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-2xl">
            <Target className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
              {stats.averageAccuracy}%
            </div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Average Accuracy
            </div>
          </div>
        </div>
      </div>

      {/* High Scores Grid (12 Games) */}
      <div className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>High Scores By Assessment Game</span>
          </h3>
          <span className="text-xs text-slate-400">12 Games Total</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-1">
          {ALL_GAMES.map(g => {
            const best = stats.bestScores[g.id] || 0;
            return (
              <div
                key={g.id}
                className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{g.icon}</span>
                  <span className="text-xs font-bold text-white truncate">{g.name}</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xs text-slate-400 font-semibold">Best:</span>
                  <span
                    className={`font-mono text-base font-black ${
                      best > 0 ? 'text-cyan-400' : 'text-slate-600'
                    }`}
                  >
                    {best > 0 ? `${best} pts` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Log */}
      <div className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Recent Rounds History</h3>
          {stats.history.length > 0 && (
            <button
              onClick={handleReset}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {stats.history.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No assessment sessions recorded yet. Play a game to record your score!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-xs">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Assessment Game</th>
                  <th className="py-2.5 px-3">Levels</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {stats.history.slice(0, 10).map((h, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 text-slate-300">
                    <td className="py-2.5 px-3 font-sans text-slate-400 text-xs">
                      {new Date(h.date).toLocaleDateString()} {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-white">
                      {h.gameName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">Level {h.level}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold ${
                          h.accuracy >= 80
                            ? 'text-emerald-400'
                            : h.accuracy >= 60
                            ? 'text-cyan-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {h.accuracy}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-300">
                      {h.score} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
