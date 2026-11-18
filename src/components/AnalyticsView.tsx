import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { UserAnalytics } from '../types';
import { ArrowLeft } from 'lucide-react';

export const AnalyticsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setAnalytics(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const data = await dbService.getUserAnalytics(user.id);
      setAnalytics(data);
      setIsLoading(false);
    }
    load();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-muted font-mono text-sm gap-2">
        <span>Computing cognitive analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-ink-secondary gap-4">
        <p className="text-sm">Sign in or complete a practice round to generate your cognitive analytics.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-surface hover:bg-recessed text-ink border border-hairline text-xs font-semibold cursor-pointer"
        >
          Back to Arena
        </button>
      </div>
    );
  }

  const { abilities } = analytics;

  const abilityCards = [
    { code: '01', name: 'Numerical Agility', score: abilities.numerical, desc: 'Mental arithmetic speed and equation balancing.' },
    { code: '02', name: 'Working Memory', score: abilities.workingMemory, desc: 'Short-term visual sequence & dual-task recall.' },
    { code: '03', name: 'Planning & Sequencing', score: abilities.planning, desc: 'Forward-looking step calculation across towers and mazes.' },
    { code: '04', name: 'Logical Reasoning', score: abilities.logical, desc: 'Rule extraction from input/output transformations.' },
    { code: '05', name: 'Deductive Logic', score: abilities.deductive, desc: 'Constraint satisfaction in pixel grids and Latin squares.' },
    { code: '06', name: 'Pattern Recognition', score: abilities.pattern, desc: 'Visual matrix analogies and anomaly detection.' },
  ];

  const avgAbility = Math.round(Object.values(abilities).reduce((a, b) => a + b, 0) / 6);

  const readinessBand =
    avgAbility >= 80
      ? 'Elite Readiness (Top 10%)'
      : avgAbility >= 65
      ? 'Strong Performer (Top 25%)'
      : avgAbility >= 50
      ? 'Intermediate Aptitude'
      : 'Foundational Aptitude';

  return (
    <div className="flex flex-col gap-7 w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 border-b border-hairline pb-5">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-vermilion font-medium">
            Cognitive Profile
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight mt-1">
            Analytics
          </h2>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-surface hover:bg-recessed text-ink border border-hairline text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Arena</span>
        </button>
      </div>

      {/* High-Contrast Readiness Summary */}
      <div className="p-5 sm:p-8 rounded-2xl bg-ink text-surface flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-surface/10 border border-surface/20 flex flex-col items-center justify-center shrink-0">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-surface tabular-nums">{avgAbility}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-vermilion mt-0.5">
              Index
            </span>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-vermilion">
              Cognitive Readiness Rating
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-surface mt-1">
              {readinessBand}
            </h3>
            <p className="text-xs sm:text-sm text-surface/75 mt-1.5 max-w-md">
              Computed across {analytics.totalGamesPlayed} completed rounds with {analytics.overallAccuracy}% average accuracy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
          <div className="p-4 rounded-xl bg-surface/10 border border-surface/15 text-center">
            <div className="font-mono text-xl font-bold text-surface tabular-nums">
              {analytics.totalScore.toLocaleString()}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-surface/65 mt-0.5">
              Total Points
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface/10 border border-surface/15 text-center">
            <div className="font-mono text-xl font-bold text-vermilion tabular-nums">
              {analytics.highestPerformanceIndex}/100
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-surface/65 mt-0.5">
              Peak Index
            </div>
          </div>
        </div>
      </div>

      {/* 6 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {abilityCards.map(pillar => (
          <div
            key={pillar.name}
            className="p-6 rounded-2xl bg-surface border border-hairline flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] text-vermilion font-medium">{pillar.code}</span>
                  <span className="font-display text-lg font-semibold text-ink">{pillar.name}</span>
                </div>
                <span className="font-mono text-xl font-bold text-ink tabular-nums">
                  {pillar.score}%
                </span>
              </div>
              <p className="text-xs text-ink-secondary mt-1.5">{pillar.desc}</p>
            </div>

            <div className="w-full h-1.5 rounded-full bg-recessed overflow-hidden">
              <div
                className="h-full rounded-full bg-vermilion transition-[width] duration-500 ease-out"
                style={{ width: `${pillar.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Timeline */}
      {analytics.recentGamesTimeline.length > 0 && (
        <div className="p-6 rounded-2xl bg-surface border border-hairline">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted mb-4">
            Recent Sessions Trend
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {analytics.recentGamesTimeline.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-paper border border-hairline flex flex-col justify-between text-center"
              >
                <div className="font-mono text-[10px] text-ink-muted">{item.date}</div>
                <div className="text-xs font-semibold text-ink truncate my-1">{item.gameName}</div>
                <div className="font-mono text-sm font-bold text-ink tabular-nums">{item.score}</div>
                <div className="font-mono text-[10px] font-medium text-vermilion tabular-nums mt-0.5">
                  {item.accuracy}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
