import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { Achievement } from '../types';
import { Award, ArrowLeft, CheckCircle2, Lock, Sparkles } from 'lucide-react';

export const AchievementsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    async function load() {
      if (!user) return;
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
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-2 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Award className="w-8 h-8 text-amber-400" />
            <span>Badges & Achievements</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Earn experience bounties and climb ranks by mastering each cognitive challenge.
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

      {/* Progress Showcase Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-navy via-indigo-950 to-slate-900 border border-amber-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Cognitive Trophy Room</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {unlockedCount} of {achievements.length} Badges Unlocked
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            Unlocked badges have contributed {totalXpEarned.toLocaleString()} bonus XP toward your player rank!
          </p>
        </div>

        <div className="w-full sm:w-48 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold font-mono">
            <span className="text-slate-400">Progress</span>
            <span className="text-amber-400">{Math.round((unlockedCount / Math.max(1, achievements.length)) * 100)}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
              style={{ width: `${(unlockedCount / Math.max(1, achievements.length)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
        {[
          { id: 'all', label: 'All Badges' },
          { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
          { id: 'locked', label: `Locked (${achievements.length - unlockedCount})` },
          { id: 'accuracy', label: 'Accuracy' },
          { id: 'speed', label: 'Speed' },
          { id: 'mastery', label: 'Mastery' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === tab.id
                ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(ach => {
          const isUnlocked = ach.unlocked;
          return (
            <div
              key={ach.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isUnlocked
                  ? 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-slate-900/40 border-slate-800/80 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${
                      isUnlocked
                        ? 'bg-amber-400/10 border-amber-400/40'
                        : 'bg-slate-800 border-slate-700 grayscale'
                    }`}
                  >
                    {ach.icon}
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isUnlocked
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {isUnlocked ? 'Unlocked ✓' : 'Locked'}
                  </span>
                </div>

                <h4 className={`text-base font-bold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                  {ach.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ach.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-amber-400">+{ach.xpReward} XP</span>
                {ach.unlockedAt && (
                  <span className="text-[10px] text-slate-500">
                    {new Date(ach.unlockedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
