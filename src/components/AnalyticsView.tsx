import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { UserAnalytics } from '../types';
import { Brain, ArrowLeft, Target, Award, Zap, TrendingUp, Compass, ShieldCheck } from 'lucide-react';

export const AnalyticsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setIsLoading(true);
      const data = await dbService.getUserAnalytics(user.id);
      setAnalytics(data);
      setIsLoading(false);
    }
    load();
  }, [user]);

  if (isLoading || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <div className="animate-spin text-3xl">🧠</div>
        <p className="text-sm">Calculating cognitive telemetry analytics...</p>
      </div>
    );
  }

  const { abilities } = analytics;

  const abilityCards = [
    { name: 'Numerical Agility', score: abilities.numerical, desc: 'Speed & accuracy with mental arithmetic and equation balancing', icon: '🔢', color: 'from-blue-500 to-cyan-500' },
    { name: 'Working Memory', score: abilities.workingMemory, desc: 'Short-term visual recall under dual-task interference', icon: '🧠', color: 'from-purple-500 to-indigo-500' },
    { name: 'Planning & Sequencing', score: abilities.planning, desc: 'Forward-looking step calculation (Tower of Hanoi & maze navigation)', icon: '🗼', color: 'from-emerald-500 to-teal-500' },
    { name: 'Logical Reasoning', score: abilities.logical, desc: 'Rule extraction from input/output transformations', icon: '⚙️', color: 'from-amber-500 to-yellow-500' },
    { name: 'Deductive Logic', score: abilities.deductive, desc: 'Constraint satisfaction in nonograms and Latin square grids', icon: '🔳', color: 'from-rose-500 to-red-500' },
    { name: 'Pattern Recognition', score: abilities.pattern, desc: 'Geometric matrix analogies and anomaly detection', icon: '🧩', color: 'from-cyan-400 to-teal-400' },
  ];

  // Cognitive readiness index
  const avgAbility = Math.round(
    Object.values(abilities).reduce((a, b) => a + b, 0) / 6
  );

  const readinessBand =
    avgAbility >= 80 ? 'Placement Ready (Top 10%)' :
    avgAbility >= 65 ? 'Competitive Candidate (Top 25%)' :
    avgAbility >= 50 ? 'Intermediate Aptitude' : 'Foundational Aptitude';

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-2 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Brain className="w-8 h-8 text-cyan-400" />
            <span>Cognitive Analytics & Readiness</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Multi-dimensional evaluation across campus recruitment assessment pillars.
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

      {/* Readiness Overview Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-navy via-indigo-950 to-slate-900 border border-cyan-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 rounded-2xl bg-cyan-500/10 border-2 border-cyan-400/40 flex flex-col items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
            <span className="text-3xl font-black font-mono text-cyan-300">{avgAbility}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Index</span>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-cyan-400 font-extrabold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Assessment Readiness Rating</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {readinessBand}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-md">
              Computed across {analytics.totalGamesPlayed} completed assessment rounds with an overall accuracy of {analytics.overallAccuracy}%.
            </p>
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
            <div className="text-lg font-black text-emerald-400 font-mono">
              {analytics.totalScore.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Points</div>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
            <div className="text-lg font-black text-amber-300 font-mono">
              {analytics.highestPerformanceIndex}/100
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Peak Index</div>
          </div>
        </div>
      </div>

      {/* 6 Cognitive Ability Pillars */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <span>Core Cognitive Dimensions</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {abilityCards.map(pillar => (
            <div
              key={pillar.name}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{pillar.icon}</span>
                    <span className="font-bold text-white text-base">{pillar.name}</span>
                  </div>
                  <span className="font-mono text-xl font-black text-cyan-300">
                    {pillar.score}%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{pillar.desc}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${pillar.color} transition-all duration-500`}
                  style={{ width: `${pillar.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Performance Timeline */}
      {analytics.recentGamesTimeline.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Recent Sessions Trend</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {analytics.recentGamesTimeline.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between text-center"
              >
                <div className="text-[10px] text-slate-400 font-semibold">{item.date}</div>
                <div className="text-xs font-bold text-white truncate my-1">{item.gameName}</div>
                <div className="text-sm font-black font-mono text-cyan-300">{item.score} pts</div>
                <div className="text-[10px] font-semibold text-emerald-400 mt-0.5">
                  {item.accuracy}% acc
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
