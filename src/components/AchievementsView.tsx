import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { Achievement } from '../types';
import { ArrowLeft, Check, Lock } from 'lucide-react';

export const AchievementsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    async function load() {
      if (!user) {
        setAchievements([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const data = await dbService.getUserAchievements(user.id);
      setAchievements(data);
      setIsLoading(false);
    }
    load();
  }, [user]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalXpEarned = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.xpReward, 0);

  const filtered = achievements.filter(a => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'unlocked') return a.unlocked;
    if (filterCategory === 'locked') return !a.unlocked;
    return a.category === filterCategory;
  });

  return (
    <div className="flex flex-col gap-7 w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 border-b border-hairline pb-5">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-vermilion font-medium">
            Milestones
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight mt-1">
            Badges &amp; Honors
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

      {/* Progress Banner */}
      <div className="p-7 rounded-2xl bg-ink text-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-vermilion">
            Achievement Progress
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-semibold text-surface mt-1 tabular-nums">
            {unlockedCount} of {achievements.length} Unlocked
          </h3>
          <p className="text-xs sm:text-sm text-surface/75 mt-1 max-w-md tabular-nums">
            Unlocked badges have contributed +{totalXpEarned.toLocaleString()} bonus XP toward your player rank.
          </p>
        </div>

        <div className="w-full sm:w-56 flex flex-col gap-2">
          <div className="flex justify-between font-mono text-xs tabular-nums">
            <span className="text-surface/65 uppercase">Completion</span>
            <span className="text-vermilion font-bold">
              {Math.round((unlockedCount / Math.max(1, achievements.length)) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface/15 overflow-hidden">
            <div
              className="h-full bg-vermilion rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${(unlockedCount / Math.max(1, achievements.length)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs (concentric: p-2 [8px] + rounded-lg [8px] = rounded-2xl [16px]) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 max-w-full scrollbar-none p-2 bg-surface rounded-2xl border border-hairline">
        {[
          { id: 'all', label: 'All Badges' },
          { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
          { id: 'locked', label: `Locked (${achievements.length - unlockedCount})` },
          { id: 'accuracy', label: 'Accuracy' },
          { id: 'speed', label: 'Speed' },
          { id: 'mastery', label: 'Mastery' },
        ].map(tab => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer ${
              filterCategory === tab.id
                ? 'bg-ink text-surface'
                : 'text-ink-secondary hover:bg-recessed hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      {isLoading ? (
        <div className="text-center py-12 font-mono text-sm text-ink-muted">Loading badges...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ach, idx) => {
            const isUnlocked = Boolean(ach.unlocked);
            return (
              <div
                key={ach.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-colors ${
                  isUnlocked
                    ? 'bg-surface border-ink'
                    : 'bg-surface/60 border-hairline opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                      {String(idx + 1).padStart(2, '0')} / {ach.category}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full ${
                        isUnlocked
                          ? 'bg-vermilion-wash text-vermilion'
                          : 'bg-recessed text-ink-muted'
                      }`}
                    >
                      {isUnlocked ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{isUnlocked ? 'Unlocked' : 'Locked'}</span>
                    </span>
                  </div>

                  <h4 className="font-display text-lg font-semibold text-ink">{ach.title}</h4>
                  <p className="text-xs text-ink-secondary mt-1 leading-relaxed">{ach.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between font-mono text-xs tabular-nums">
                  <span className={isUnlocked ? 'font-bold text-vermilion' : 'text-ink-muted'}>
                    +{ach.xpReward} XP
                  </span>
                  {ach.unlockedAt && (
                    <span className="text-[11px] text-ink-muted">
                      {new Date(ach.unlockedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
